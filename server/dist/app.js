import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { ErrorCode } from './game/interface.js';
import { createApiRouter } from './routes/api.js';
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultClientDist = path.resolve(currentDir, '../..', 'client', 'dist');
export function createApp() {
    const app = express();
    const allowedOrigins = (process.env.CLIENT_ORIGINS ?? 'http://localhost:8080')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    // Disable strict default CSP when serving PixiJS WebGL + Google Fonts + SVG assets
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin))
                return callback(null, true);
            return callback(new Error('CORS origin is not allowed'));
        },
    }));
    app.use(express.json({ limit: '10kb', strict: true }));
    app.get('/healthz', (_request, response) => {
        response.json({ status: 'ok' });
    });
    app.use('/api', createApiRouter());
    // Optionally serve the built PixiJS client on the same origin (used in Render production deploy)
    if (process.env.SERVE_CLIENT === 'true') {
        const clientDist = process.env.CLIENT_DIST_DIR || defaultClientDist;
        if (fs.existsSync(clientDist)) {
            app.use(express.static(clientDist));
            app.get('/{*splat}', (_request, response) => {
                response.sendFile(path.join(clientDist, 'index.html'));
            });
        }
    }
    app.use((_request, response) => {
        response.status(404).json({
            error: { code: ErrorCode.NotFound, message: 'Route not found.' },
        });
    });
    const errorHandler = (error, _request, response, _next) => {
        if (response.headersSent)
            return;
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
//# sourceMappingURL=app.js.map