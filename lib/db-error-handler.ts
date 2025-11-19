import { Prisma } from '@prisma/client';

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server timed out
    // P1008: Operations timed out
    // P1017: Server has closed the connection
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database") ||
      message.includes('database server is not running') ||
      message.includes('connection refused') ||
      message.includes('econnrefused')
    );
  }

  return false;
}

export function handleDatabaseError(error: unknown): {
  error: string;
  isDatabaseDown: boolean;
  status: number;
} {
  if (isDatabaseConnectionError(error)) {
    return {
      error: 'База данных не запущена!',
      isDatabaseDown: true,
      status: 503,
    };
  }

  console.error('Database error:', error);

  return {
    error: 'Ошибка при работе с базой данных',
    isDatabaseDown: false,
    status: 500,
  };
}
