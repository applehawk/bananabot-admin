import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const userId = params.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        generations: true,
                        transactions: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 1. Generations Statistics
        // Get generations for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const generations = await prisma.generation.findMany({
            where: {
                userId: userId,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                createdAt: true,
                creditsUsed: true,
                status: true,
                type: true,
            },
        });

        // 2. Transactions Statistics
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                createdAt: true,
                amount: true, // Amount in USD (usually)
                creditsAdded: true,
                type: true,
                status: true,
                currency: true
            },
        });

        // 3. Aggregate Daily Stats
        const dailyStatsMap = new Map<string, {
            date: string;
            generationsCount: number;
            spendingCredits: number;
            topupsCredits: number;
            topupsUsd: number;
        }>();

        // Initialize last 30 days
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyStatsMap.set(dateStr, {
                date: dateStr,
                generationsCount: 0,
                spendingCredits: 0,
                topupsCredits: 0,
                topupsUsd: 0
            });
        }

        // Process Generations
        generations.forEach(gen => {
            const dateStr = new Date(gen.createdAt).toISOString().split('T')[0];
            const stat = dailyStatsMap.get(dateStr);
            if (stat) {
                stat.generationsCount += 1;
                if (gen.status === 'COMPLETED') {
                    stat.spendingCredits += gen.creditsUsed || 0;
                }
            }
        });

        // Process Transactions
        transactions.forEach(tx => {
            const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];
            const stat = dailyStatsMap.get(dateStr);
            if (stat && tx.status === 'COMPLETED') {
                if (['PURCHASE', 'BONUS', 'REFERRAL', 'DAILY_BONUS', 'ADMIN_ADJUSTMENT'].includes(tx.type)) {
                    stat.topupsCredits += tx.creditsAdded || 0;
                }
                if (tx.type === 'PURCHASE' && tx.amount) {
                    stat.topupsUsd += tx.amount;
                }
                if (tx.type === 'GENERATION_COST') {
                    // Normally handled via generations table, but if we track distinct transactions for cost:
                    // stat.spendingCredits += Math.abs(tx.creditsAdded); // creditsAdded is usually negative for costs
                }
            }
        });

        const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // 4. Aggregated Totals (All time)
        // We can use aggregate queries for better performance on large datasets
        const totalSpend = await prisma.generation.aggregate({
            where: { userId: userId, status: 'COMPLETED' },
            _sum: {
                creditsUsed: true,
                totalCostUsd: true
            }
        });

        // Total Payments
        const totalPayments = await prisma.transaction.aggregate({
            where: {
                userId: userId,
                status: 'COMPLETED',
                type: 'PURCHASE'
            },
            _sum: {
                amount: true,
                creditsAdded: true
            }
        });

        return NextResponse.json({
            user,
            stats: {
                daily: dailyStats,
                totals: {
                    creditsUsed: totalSpend._sum.creditsUsed || 0,
                    usdUsed: totalSpend._sum.totalCostUsd || 0,
                    creditsPurchased: totalPayments._sum.creditsAdded || 0,
                    usdPurchased: totalPayments._sum.amount || 0
                }
            },
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
