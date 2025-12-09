import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [total, generations] = await Promise.all([
      prisma.generation.count({ where }),
      prisma.generation.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              firstName: true,
              telegramId: true,
            },
          },
          inputImages: true,
          model: {
            select: {
              name: true,
              providerId: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedGenerations = generations.map((gen: any) => ({
      ...gen,
      user: {
        ...gen.user,
        telegramId: gen.user.telegramId.toString(),
      },
    }));

    return NextResponse.json({
      generations: serializedGenerations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching generations:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
