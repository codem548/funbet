/**
 * Vercel serverless function entry point.
 * Imports the fully-configured Express app from the main server module.
 * Vercel auto-detects files in /api/ and compiles them as serverless functions.
 */
import dotenv from 'dotenv';

// Load environment variables (from .env.local locally, or Vercel Env Vars in prod)
dotenv.config();

// Import the Express application, HTTP server, and Socket.IO instance.
// When Vercel imports server.ts, all module-level code runs: routes are
// registered, data files are loaded, and middleware is configured. The
// only skipped part is httpServer.listen() — server.ts guards that call
// with a VERCEL environment check so it never tries to bind a port.
import { app, httpServer, io } from '../server';

export { app, httpServer, io };

// Vercel Node.js runtime uses the default export as the request handler.
export default app;