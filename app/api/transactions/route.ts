import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where = userId ? { userId } : {};

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            telegramId: true,
          },
        },
        package: true,
      },
      orderBy: { [sortBy]: order },
      take: 100,
    });

    // Convert BigInt to string for JSON serialization
    const serializedTransactions = transactions.map((tx: any) => ({
      ...tx,
      user: {
        ...tx.user,
        telegramId: tx.user.telegramId.toString(),
      },
    }));

    return NextResponse.json(serializedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
