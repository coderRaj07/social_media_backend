import { CookieOptions, NextFunction, Request, Response } from 'express';
import config from 'config';
import crypto from 'crypto';
import {
  CreateUserInput,
  LoginUserInput,
  VerifyEmailInput,
} from '../schemas/user.schema';
import {
  createUser,
  findUser,
  findUserByEmail,
  findUserById,
  invalidateUserCache,
  signTokens,
} from '../services/user.service';
import AppError from '../utils/appError';
import redisClient, { getRedisClient } from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';
import { User } from '../entities/user.entity';
import Email from '../utils/email';

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000,
};

export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, password, email } = req.body;
    const emailLower = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await findUserByEmail({ email: emailLower });

    if (existingUser) {
      if (!existingUser.verified) {
        // Resend verification email
        const { hashedVerificationCode, verificationCode } =
          User.createVerificationCode();
        existingUser.verificationCode = hashedVerificationCode;
        existingUser.name = name;
        existingUser.password = password; // hash handled in entity
        await existingUser.save();

        // Invalidate cache
        await invalidateUserCache(existingUser);

        const redirectUrl = `${config.get<string>(
          'origin'
        )}/api/auth/verifyemail/${verificationCode}`;

        await new Email(existingUser, redirectUrl).sendVerificationCode();

        return res.status(200).json({
          status: 'success',
          message:
            'An email with a new verification code has been sent to your email',
        });
      } else {
        return res.status(409).json({
          status: 'fail',
          message: 'User with that email already exists',
        });
      }
    }

    // 2. Create new user
    const newUser = await createUser({
      name,
      email: emailLower,
      password,
    });

    const { hashedVerificationCode, verificationCode } =
      User.createVerificationCode();
    newUser.verificationCode = hashedVerificationCode;
    await newUser.save();

    // Invalidate cache
    await invalidateUserCache(newUser);

    // 3. Send verification email
    const redirectUrl = `${config.get<string>(
      'origin'
    )}/api/auth/verifyemail/${verificationCode}`;

    await new Email(newUser, redirectUrl).sendVerificationCode();

    res.status(201).json({
      status: 'success',
      message: 'An email with a verification code has been sent to your email',
    });
  } catch (err: any) {
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // 1. Fetch user (from cache or DB)
    const user = await findUserByEmail({ email });

    if (!user) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // 2. Check if verified
    if (!user.verified) {
      return next(
        new AppError(
          401,
          'You are not verified. Check your email to verify your account'
        )
      );
    }

    // 3. Check password
    if (!(await User.comparePasswords(password, user.password))) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // 4. Sign access & refresh tokens, save session separately
    const { access_token, refresh_token } = await signTokens(user);

    // 5. Add cookies
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 6. Invalidate user cache to ensure fresh data next time
    await invalidateUserCache(user);

    // 7. Send response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};


export const verifyEmailHandler = async (
  req: Request<VerifyEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationCode = crypto
      .createHash('sha256')
      .update(req.params.verificationCode)
      .digest('hex');

    const user = await findUser({ verificationCode });

    if (!user) {
      return next(new AppError(401, 'Could not verify email'));
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    // Invalidate Redis cache
    await invalidateUserCache(user);

    res.status(200).json({
      status: 'success',
      message:
        'Email verified successfully. You can now log in without issues.',
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const message = 'Could not refresh access token';

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    // Validate refresh token
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      'refreshTokenPublicKey'
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }
    const redisClient = getRedisClient();
    // Check if user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    // Check if user still exist
    const user = await findUserById(JSON.parse(session).id);

    if (!user) {
      return next(new AppError(403, message));
    }

    // Sign new access token
    const access_token = signJwt({ sub: user.id }, 'accessTokenPrivateKey', {
      expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    });

    // 4. Add Cookies
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Send response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

const logout = (res: Response) => {
  res.cookie('access_token', '', { maxAge: 1 });
  res.cookie('refresh_token', '', { maxAge: 1 });
  res.cookie('logged_in', '', { maxAge: 1 });
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    if (user) {
      const redisClient = getRedisCredisClientlient();
      // Delete session cache
      await redisClient.del(`session:${user.id}`);

      // Optional: also invalidate user cache
      await invalidateUserCache(user);
    }

    // Clear cookies
    logout(res);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err: any) {
    next(err);
  }
};
