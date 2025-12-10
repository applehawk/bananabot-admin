import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    let limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        // For BigInt/TelegramID, we might need strict equality if search is numeric, 
        // or just ignore if it's text. Prisma doesn't support 'contains' for BigInt easily.
        // We'll try to convert search to BigInt if it looks like one.
      ];
      // Try to parse search as BigInt for telegramId search
      try {
        if (/^\d+$/.test(search)) {
          where.OR.push({ telegramId: BigInt(search) });
        }
      } catch (e) { }
    }

    // Transaction for count and data
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          settings: true,
          _count: {
            select: {
              transactions: true,
              generations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedUsers = users.map((user: any) => ({
      ...user,
      telegramId: user.telegramId.toString(),
    }));

    return NextResponse.json({
      users: serializedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
