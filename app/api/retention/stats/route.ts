import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';



export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const stageParam = searchParams.get('stage');

    try {
        if (stageParam !== null) {
            const stageOrder = parseInt(stageParam);
            const users = await prisma.user.findMany({
                where: {
                    retentionStage: stageOrder,
                    totalGenerated: 0, // Keeping consistent with the count logic in stats (only count 0-generator users?)
                    // The count logic above used: where: { retentionStage: stage.order, totalGenerated: 0 }
                    // So we should probably filter similarly, OR show all?
                    // The user prompt said: "view filtered by chosen Retention Stage users list"
                    // The stats counts were strictly for `totalGenerated: 0` users (churned users). 
                    // Let's keep that filter for consistency with the numbers shown on the card.
                },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    lastActiveAt: true,
                    lastRetentionMessageAt: true,
                    retentionStage: true,
                    totalGenerated: true,
                    credits: true,
                    generations: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: { createdAt: true }
                    },
                    transactions: {
                        where: { type: 'PURCHASE' }, // Fetch ALL purchases to check for failed attempts
                        select: { amount: true, createdAt: true, status: true }
                    },
                    settings: {
                        select: {
                            selectedModel: {
                                select: { creditsPerGeneration: true }
                            }
                        }
                    }
                },
                orderBy: { lastActiveAt: 'desc' },
                take: 100 // Safety limit
            });

            // Handle BigInt serialization & Calculate totals
            const serializedUsers = users.map(user => {
                const allTransactions = user.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const completedPayments = allTransactions.filter(t => t.status === 'COMPLETED');

                const totalPayments = completedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                const paymentAttempts = allTransactions.length;
                const hasFailedPayment = allTransactions.some(t => t.status !== 'COMPLETED');
                const lastPaymentStatus = allTransactions.length > 0 ? allTransactions[0].status : null;

                // Find last SUCCESSFUL payment date
                const lastPaymentAt = completedPayments.length > 0 ? completedPayments[0].createdAt : null;

                const lastGenerationAt = user.generations[0]?.createdAt || null;
                const selectedModelCost = user.settings?.selectedModel?.creditsPerGeneration || 0;

                // Remove nested arrays from output
                const { transactions, generations, settings, ...userData } = user;

                return {
                    ...userData,
                    telegramId: user.telegramId.toString(),
                    totalPayments,
                    paymentAttempts,
                    hasFailedPayment,
                    lastPaymentStatus,
                    lastPaymentAt,
                    lastGenerationAt,
                    selectedModelCost
                };
            });

            return NextResponse.json({ users: serializedUsers });
        }

        const stages = await prisma.retentionStage.findMany({
            orderBy: { order: 'asc' },
        });

        const stats = [];

        // Count for Stage 0 (Not yet processed)
        const stage0Count = await prisma.user.count({
            where: { retentionStage: 0, totalGenerated: 0 }
        });

        stats.push({
            stageName: 'Stage 0 (Initial)',
            order: 0,
            count: stage0Count
        });

        for (const stage of stages) {
            const count = await prisma.user.count({
                where: { retentionStage: stage.order, totalGenerated: 0 }
            });
            stats.push({
                stageName: stage.name,
                order: stage.order,
                count
            });
        }

        // Get settings and packages
        const [settings, packages] = await Promise.all([
            prisma.systemSettings.findUnique({
                where: { key: 'singleton' },
                select: { isRetentionEnabled: true, tripwirePackageId: true }
            }),
            prisma.creditPackage.findMany({
                orderBy: { price: 'asc' },
                select: { id: true, name: true, price: true, credits: true, active: true }
            })
        ]);

        return NextResponse.json({
            stats,
            isRetentionEnabled: settings?.isRetentionEnabled ?? false,
            tripwirePackageId: settings?.tripwirePackageId || null,
            packages
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
