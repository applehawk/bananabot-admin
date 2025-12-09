import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const type = searchParams.get('type');
        const status = searchParams.get('status'); // 'ALL' or specific status

        const where: any = {};
        if (userId) where.userId = userId;
        if (type) where.type = type;
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // 1. Calculate Period Stats (1d, 7d, 30d, 90d)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const [count1d, count7d, count30d, count90d] = await Promise.all([
            prisma.generation.count({ where: { ...where, createdAt: { gte: oneDayAgo } } }),
            prisma.generation.count({ where: { ...where, createdAt: { gte: sevenDaysAgo } } }),
            prisma.generation.count({ where: { ...where, createdAt: { gte: thirtyDaysAgo } } }),
            prisma.generation.count({ where: { ...where, createdAt: { gte: ninetyDaysAgo } } }),
        ]);

        // 2. Calculate Daily Stats for Chart (Last 30 days)
        // Fetch generic dates to aggregate in memory (efficient enough for <1M records/month)
        const dates = await prisma.generation.findMany({
            where: {
                ...where,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true
            }
        });

        // Aggregate in JS
        const dailyMap = new Map<string, number>();

        // Initialize all days in the range with 0 to ensure continuity
        for (let i = 0; i < 30; i++) {
            // We go from 29 days ago to today
            const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            dailyMap.set(dateStr, 0);
        }

        dates.forEach(d => {
            const dateStr = new Date(d.createdAt).toISOString().split('T')[0];
            // Only count if it falls within our initialized map (it should, given the query)
            if (dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
            } else {
                // Fallback for timezone differences if any edge cases occur
                dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
            }
        });

        const dailyStats = Array.from(dailyMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            periodStats: {
                day1: count1d,
                day7: count7d,
                day30: count30d,
                day90: count90d
            },
            dailyStats
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
