import dotenv from "dotenv";

// Pre-load environment variables from .env
dotenv.config();

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not configured`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV'),
  PORT: getEnv('PORT'),
  MONGO_URI: getEnv('MONGO_URI'),
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: getEnv('JWT_ACCESS_EXPIRES_IN'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN'),
  COOKIE_NAME_REFRESH: getEnv('COOKIE_NAME_REFRESH'),
  FRONTEND_URL: getEnv('FRONTEND_URL'),
  LOG_RETENTION_DAYS: getEnv('LOG_RETENTION_DAYS'),
  /** `local` (disk) or `s3` — swap without changing upload handlers */
  FILE_STORAGE_PROVIDER: getEnvOptional('FILE_STORAGE_PROVIDER', 'local') as 'local' | 's3',
  UPLOAD_DIR: getEnvOptional('UPLOAD_DIR', './uploads'),
  API_PUBLIC_URL: getEnvOptional('API_PUBLIC_URL', `http://localhost:${getEnvOptional('PORT', '5000')}`),
  MAX_UPLOAD_MB: parseInt(getEnvOptional('MAX_UPLOAD_MB', '15'), 10),
};
