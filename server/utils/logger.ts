import pino from 'pino';
import { env } from '../config/env';

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'jwtSecret',
    ],
    censor: '[REDACTED]',
  },
});

export { logger };
