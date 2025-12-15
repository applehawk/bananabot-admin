import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';
import { TransactionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    let limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';

    // Filters
    const minCredits = searchParams.get('minCredits') ? Number(searchParams.get('minCredits')) : null;
    const maxGenerations = searchParams.get('maxGenerations') ? Number(searchParams.get('maxGenerations')) : null;

    // Expiring/Inactivity Filter
    const maxCredits = searchParams.get('maxCredits') ? Number(searchParams.get('maxCredits')) : null;
    const daysSinceLastTopUp = searchParams.get('daysSinceLastTopUp') ? Number(searchParams.get('daysSinceLastTopUp')) : null;

    // Broadcast Filter
    const excludeBroadcastsHours = searchParams.get('excludeBroadcastsHours') ? Number(searchParams.get('excludeBroadcastsHours')) : null;

    // Blocked Filter
    const isBlocked = searchParams.get('isBlocked') === 'true';

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // 1. Text Search
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
      ];
      // Try to parse search as BigInt for telegramId search
      try {
        if (/^\d+$/.test(search)) {
          where.OR.push({ telegramId: BigInt(search) });
        }
      } catch (e) { }
    }

    // 2. Min Credits Filter
    if (minCredits !== null && !isNaN(minCredits)) {
      where.credits = { ...where.credits, gte: minCredits };
    }

    // 3. Max Generations Filter
    // Using the aggregated totalGenerated field for efficiency
    if (maxGenerations !== null && !isNaN(maxGenerations)) {
      where.totalGenerated = { ...where.totalGenerated, lte: maxGenerations };
    }

    // 4. Expiring Users Filter (Low balance AND no recent top-ups)
    if (maxCredits !== null && !isNaN(maxCredits) && daysSinceLastTopUp !== null && !isNaN(daysSinceLastTopUp)) {
      // Balance condition
      where.credits = { ...where.credits, lte: maxCredits };

      // Date calculation
      const dateAgo = new Date();
      dateAgo.setDate(dateAgo.getDate() - daysSinceLastTopUp);

      // No PURCHASE transactions since dateAgo
      where.transactions = {
        none: {
          type: TransactionType.PURCHASE,
          createdAt: {
            gte: dateAgo
          }
        }
      };
    }

    // 5. Exclude Recent Broadcasts
    if (excludeBroadcastsHours !== null && !isNaN(excludeBroadcastsHours)) {
      const broadcastDateAgo = new Date();
      broadcastDateAgo.setHours(broadcastDateAgo.getHours() - excludeBroadcastsHours);

      where.adminMessages = {
        none: {
          isBroadcast: true,
          sentAt: {
            gte: broadcastDateAgo
          }
        }
      };
    }

    // 6. Blocked Status
    if (isBlocked) {
      where.isBlocked = true;
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
