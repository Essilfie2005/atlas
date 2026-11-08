import { PrismaClient } from './generated/prisma/index.js';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting the database connection limit due to hot module reloading.
// See: https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  return new PrismaClient({
    log: isDevelopment
      ? [
          { emit: 'stdout', level: 'query' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });
}

/**
 * Singleton Prisma client instance.
 *
 * In development, the client is stored on the global object to survive
 * hot module reloads without exhausting DB connections.
 *
 * In production, a fresh singleton is created per process.
 */
export const prisma: PrismaClient =
  process.env['NODE_ENV'] === 'production'
    ? createPrismaClient()
    : (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()));

export default prisma;
