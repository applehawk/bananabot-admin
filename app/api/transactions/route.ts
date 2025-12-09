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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const paymentMethods = searchParams.get('paymentMethod')?.split(',').filter(Boolean);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};
    if (userId) where.userId = userId;
    if (paymentMethods && paymentMethods.length > 0) {
      where.paymentMethod = { in: paymentMethods };
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
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
        skip,
        take: limit,
      })
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedTransactions = transactions.map((tx: any) => ({
      ...tx,
      user: {
        ...tx.user,
        telegramId: tx.user.telegramId.toString(),
      },
    }));

    return NextResponse.json({
      transactions: serializedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
