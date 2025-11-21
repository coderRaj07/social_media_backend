import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { AppDataSource } from './utils/data-source';
import AppError from './utils/appError';
import validateEnv from './utils/validateEnv';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import postRouter from './routes/post.routes';
import commentRouter from './routes/comment.routes';
import likeRouter from './routes/like.routes';
import followRouter from './routes/follow.routes';

import { connectRedis, getRedisClient } from './utils/connectRedis';

const startApp = async () => {
  try {
    // 1️⃣ Connect Redis (singleton)
    await connectRedis();

    // 2️⃣ Initialize database
    await AppDataSource.initialize();

    // 3️⃣ Validate ENV
    validateEnv();

    // 4️⃣ Create Express app
    const app = express();

    // TEMPLATE ENGINE
    app.set('view engine', 'pug');
    app.set('views', `${__dirname}/views`);

    // MIDDLEWARE
    app.use(express.json({ limit: '10kb' }));
    if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
    app.use(cookieParser());
    app.use(
      cors({
        origin: config.get<string>('origin'),
        credentials: true,
      })
    );

    // ROUTES
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/posts', postRouter);
    app.use('/api/comments', commentRouter);
    app.use('/api/like', likeRouter);
    app.use('/api/follow', followRouter);

    // HEALTH CHECK
    app.get('/api/healthChecker', async (_, res: Response) => {
      const redisClient = getRedisClient();
      const message = await redisClient.get('try');
      res.status(200).json({
        status: 'success',
        message: message || 'Welcome to Node.js, we are happy to see you',
      });
    });

    // CATCH-ALL 404 ROUTE
    app.all(/.*/, (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(404, `Route ${req.originalUrl} not found`));
    });

    // GLOBAL ERROR HANDLER
    app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
      error.status = error.status || 'error';
      error.statusCode = error.statusCode || 500;

      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    });

    // START SERVER
    const port = config.get<number>('port') || 4000;
    app.listen(port, () => {
      console.log(`Server started with pid: ${process.pid} on port: ${port}`);
    });
  } catch (err) {
    console.error('App startup failed:', err);
    process.exit(1);
  }
};

// START
startApp();
