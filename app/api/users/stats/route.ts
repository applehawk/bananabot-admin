import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Calculate chart params
        const scale = searchParams.get('scale') || '1M';
        let chartStartDate = thirtyDaysAgo;
        let bucketSize = 'day';

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

        // Determine the earliest date we need data for
        // We need 90 days for stats cards, and chartStartDate for the chart
        // Since max chart range is 1Q (90 days), ninetyDaysAgo covers everything usually.
        // But let's be safe and take the min.
        const minDate = new Date(Math.min(ninetyDaysAgo.getTime(), chartStartDate.getTime()));

        // Single DB query for all required data
        const statsData = await prisma.user.findMany({
            where: {
                createdAt: { gte: minDate }
            },
            select: {
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // 1. Calculate Period Stats in memory
        let count1d = 0;
        let count7d = 0;
        let count30d = 0;
        let count90d = 0;

        const oneDayTime = oneDayAgo.getTime();
        const sevenDaysTime = sevenDaysAgo.getTime();
        const thirtyDaysTime = thirtyDaysAgo.getTime();
        const ninetyDaysTime = ninetyDaysAgo.getTime();

        for (const user of statsData) {
            const time = user.createdAt.getTime();
            if (time >= oneDayTime) count1d++;
            if (time >= sevenDaysTime) count7d++;
            if (time >= thirtyDaysTime) count30d++;
            if (time >= ninetyDaysTime) count90d++;
        }

        // 2. Calculate Chart Stats
        // We filter statsData again to only include points for the chart range if needed,
        // but generateChartData logic typically handles start/end boundaries or we can slice.
        // generateChartData iterates and counts.
        // We can pass the full statsData, or filtered.
        // Let's filter slightly to match chartStartDate strictly for valid graph
        const chartDataSubset = statsData.filter(u => u.createdAt >= chartStartDate);

        const chartStats = generateChartData(chartDataSubset, chartStartDate, now, bucketSize);

        return NextResponse.json({
            periodStats: {
                day1: count1d,
                day7: count7d,
                day30: count30d,
                day90: count90d
            },
            chartStats
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
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

function generateChartData(
    data: { createdAt: Date }[],
    start: Date,
    end: Date,
    bucketSize: string
) {
    const map = new Map<string, number>();
    const formatKey = (date: Date) => {
        if (bucketSize === 'day') return date.toISOString().split('T')[0];

        // For sub-day resolution, we want a readable label or sortable key
        // Let's return ISO string for safety, frontend can format
        // But we need to round the date to the bucket
        const d = new Date(date);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);

        if (bucketSize === '6hour') {
            const h = d.getHours();
            const roundedH = Math.floor(h / 6) * 6;
            d.setHours(roundedH);
        }

        // For 'hour', it's already rounded to hour

        return d.toISOString();
    };

    // Initialize buckets
    let current = new Date(start);
    // Align start for sub-day buckets to nice boundaries if needed
    if (bucketSize === 'hour') {
        current.setMinutes(0, 0, 0);
    } else if (bucketSize === '6hour') {
        current.setMinutes(0, 0, 0);
        const h = current.getHours();
        current.setHours(Math.floor(h / 6) * 6);
    } else {
        // Day: reset to midnight?
        // Actually usually we want "Last 24h" vs "Calendar Day".
        // The prompt says "1 Day (scale by hours)". This usually means "Last 24 hours".
        // "1 Week (scale by ...)". This usually means "Last 7 days".
        // Let's treat start as the beginning of the bucket.
    }

    while (current <= end) {
        map.set(formatKey(current), 0);
        current = new Date(current.getTime() + getStep(bucketSize));
    }

    // Fill data
    data.forEach(item => {
        const key = formatKey(new Date(item.createdAt));
        // We might need to handle items slightly outside the initialized range (e.g. slight ms difference)
        // or just use map.set if we want to include them. 
        // But better to check if key exists to keep graph clean
        if (map.has(key)) {
            map.set(key, (map.get(key) || 0) + 1);
        } else {
            // Try searching for the closest bucket? 
            // Or just ignore. The query filtered by `gte start`, so it should be fine.
            // But `start` in query is exact time, `start` in loop is rounded.
            // If query start is 14:32, and data is 14:35.
            // Loop start (1D, hour) -> 14:00. Key 14:00.
            // Data 14:35 -> Key 14:00. It matches.
            // It should be fine.
            // Safety fallback:
            map.set(key, (map.get(key) || 0) + 1);
        }
    });

    return Array.from(map.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
