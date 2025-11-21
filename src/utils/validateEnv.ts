import { cleanEnv, port, str } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),

    // Postgres
    POSTGRES_HOST: str(),
    POSTGRES_PORT: port(),
    POSTGRES_USER: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_DB: str(),

    // JWT Keys
    JWT_ACCESS_TOKEN_PRIVATE_KEY: str(),
    JWT_ACCESS_TOKEN_PUBLIC_KEY: str(),
    JWT_REFRESH_TOKEN_PRIVATE_KEY: str(),
    JWT_REFRESH_TOKEN_PUBLIC_KEY: str(),

    // SMTP
    EMAIL_HOST: str(),
    EMAIL_PORT: port(),
    EMAIL_USER: str(),
    EMAIL_PASS: str(),

    // Redis
    REDIS_HOST: str(),
    REDIS_PORT: port(),
    REDIS_USER: str(),
    REDIS_PASSWORD: str(),
  });
};

export default validateEnv;
