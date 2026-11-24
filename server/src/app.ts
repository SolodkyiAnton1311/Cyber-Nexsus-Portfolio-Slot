import cors from 'cors';
import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { ErrorCode } from './game/interface.js';
import { createApiRouter } from './routes/api.js';

interface ErrorWithType extends Error {
  type?: string;
}

export function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CLIENT_ORIGINS ?? 'http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed'));
    },
  }));
  app.use(express.json({ limit: '10kb', strict: true }));

  app.get('/healthz', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api', createApiRouter());

  app.use((_request, response) => {
    response.status(404).json({
      error: { code: ErrorCode.NotFound, message: 'Route not found.' },
    });
  });

  const errorHandler: ErrorRequestHandler = (error: ErrorWithType, _request, response, _next) => {
    if (response.headersSent) return;
    if (error.message === 'CORS origin is not allowed') {
      response.status(403).json({
        error: { code: ErrorCode.OriginNotAllowed, message: 'This origin is not allowed.' },
      });
      return;
    }
    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      response.status(400).json({
        error: { code: ErrorCode.InvalidJson, message: 'Request body must contain valid JSON.' },
      });
      return;
    }
    if (error.type === 'entity.too.large') {
      response.status(413).json({
        error: { code: ErrorCode.BodyTooLarge, message: 'Request body exceeds the 10kb limit.' },
      });
      return;
    }
    console.error(error);
    response.status(500).json({
      error: { code: ErrorCode.InternalError, message: 'An unexpected server error occurred.' },
    });
  };

  app.use(errorHandler);
  return app;
}
