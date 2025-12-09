import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Filter by user if requested, otherwise global stats
        const where: any = {};
        if (userId) where.userId = userId;

        // We focus on PURCHASE transactions or transactions that have an amount > 0 and status COMPLETED for revenue
        // However, the user asked for "stats of payments" (amount), but also mentioned "filter by all types".
        // Usually revenue stats are strictly about money coming in.
        const revenueWhere = {
            ...where,
            status: 'COMPLETED',
            type: 'PURCHASE',
            amount: { gt: 0 }
        };

        // 1. Calculate Period Revenue (1d, 7d, 30d, 90d)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const [revenue1d, revenue7d, revenue30d, revenue90d] = await Promise.all([
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { ...revenueWhere, createdAt: { gte: oneDayAgo } }
            }),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { ...revenueWhere, createdAt: { gte: sevenDaysAgo } }
            }),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { ...revenueWhere, createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { ...revenueWhere, createdAt: { gte: ninetyDaysAgo } }
            }),
        ]);

        // 2. Calculate Daily Revenue for Chart (Last 30 days)
        // We fetch raw data to aggregate. Since we only care about dates and sum, it's efficient enough.
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                ...revenueWhere,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true,
                amount: true
            }
        });

        const dailyMap = new Map<string, number>();

        // Initialize all days
        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            dailyMap.set(dateStr, 0);
        }

        recentTransactions.forEach(tx => {
            if (tx.amount) {
                const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];
                if (dailyMap.has(dateStr)) {
                    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + tx.amount);
                } else {
                    // Fallback
                    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + tx.amount);
                }
            }
        });

        const dailyStats = Array.from(dailyMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            periodRevenue: {
                day1: revenue1d._sum.amount || 0,
                day7: revenue7d._sum.amount || 0,
                day30: revenue30d._sum.amount || 0,
                day90: revenue90d._sum.amount || 0
            },
            dailyStats
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
