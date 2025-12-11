import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const scale = searchParams.get('scale') || '1M'; // '1D', '1W', '1M', '1Q'

        // Filter by user if requested, otherwise global stats
        const where: any = {};
        if (userId) where.userId = userId;

        // We focus on PURCHASE transactions or transactions that have an amount > 0 and status COMPLETED for revenue
        const revenueWhere = {
            ...where,
            status: 'COMPLETED',
            // type: 'PURCHASE', // Removed strict type check to include all positive revenue if needed, or keep it strict?
            // User requested "transactions" aggregation. Usually implies all revenue.
            // Existing code used type: 'PURCHASE'. I'll stick to existing logic but just check amount > 0
            // Actually, existing code had type: 'PURCHASE'.
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

        // 2. Calculate Chart Stats based on 'scale'
        let chartStartDate = thirtyDaysAgo;
        let bucketSize = 'day'; // 'hour', '6hour', 'day'

        if (scale === '1D') {
            chartStartDate = oneDayAgo;
            bucketSize = 'hour';
        } else if (scale === '1W') {
            chartStartDate = sevenDaysAgo;
            bucketSize = '6hour';
        } else if (scale === '1M') {
            chartStartDate = thirtyDaysAgo;
            bucketSize = 'day';
        } else if (scale === '1Q') {
            chartStartDate = ninetyDaysAgo;
            bucketSize = 'day';
        }

        const statsData = await prisma.transaction.findMany({
            where: {
                ...revenueWhere,
                createdAt: { gte: chartStartDate }
            },
            select: {
                createdAt: true,
                amount: true
            }
        });

        const dailyStats = generateRevenueChartData(statsData, chartStartDate, now, bucketSize);

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

function getStep(bucketSize: string): number {
    switch (bucketSize) {
        case 'hour': return 60 * 60 * 1000;
        case '6hour': return 6 * 60 * 60 * 1000;
        case 'day': return 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
    }
}

function generateRevenueChartData(
    data: { createdAt: Date, amount: number | null }[],
    start: Date,
    end: Date,
    bucketSize: string
) {
    const map = new Map<string, number>();
    const formatKey = (date: Date) => {
        if (bucketSize === 'day') return date.toISOString().split('T')[0];

        const d = new Date(date);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);

        if (bucketSize === '6hour') {
            const h = d.getHours();
            const roundedH = Math.floor(h / 6) * 6;
            d.setHours(roundedH);
        }

        return d.toISOString();
    };

    // Initialize buckets
    let current = new Date(start);
    if (bucketSize === 'hour') {
        current.setMinutes(0, 0, 0);
    } else if (bucketSize === '6hour') {
        current.setMinutes(0, 0, 0);
        const h = current.getHours();
        current.setHours(Math.floor(h / 6) * 6);
    }

    while (current <= end) {
        map.set(formatKey(current), 0);
        current = new Date(current.getTime() + getStep(bucketSize));
    }

    // Fill data
    data.forEach(item => {
        if (item.amount) {
            const key = formatKey(new Date(item.createdAt));
            if (map.has(key)) {
                map.set(key, (map.get(key) || 0) + item.amount);
            } else {
                map.set(key, (map.get(key) || 0) + item.amount);
            }
        }
    });

    return Array.from(map.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
