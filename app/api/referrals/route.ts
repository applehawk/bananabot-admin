import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to serialize BigInt
function serializeBigInt(obj: unknown): unknown {
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (obj && typeof obj === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            out[k] = serializeBigInt(v);
        }
        return out;
    }
    return obj;
}

export async function GET(req: NextRequest) {
    try {
        // Find all users who have referred at least one person
        // We can find this by querying the Referral table directly or User where referralsGiven is not empty

        // Let's get top referrers
        const usersWithReferrals = await prisma.user.findMany({
            where: {
                referralsGiven: {
                    some: {}
                }
            },
            include: {
                referralsGiven: {
                    include: {
                        referred: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        referralsGiven: true
                    }
                }
            },
            orderBy: {
                referralsGiven: {
                    _count: 'desc'
                }
            }
        });

        const formattedData = await Promise.all(usersWithReferrals.map(async (user) => {
            // Calculate total earned from referrals
            // We assume Transaction type 'REFERRAL' is used for this
            const earnedStats = await prisma.transaction.aggregate({
                where: {
                    userId: user.id,
                    type: 'REFERRAL',
                    status: 'COMPLETED'
                },
                _sum: {
                    creditsAdded: true,
                    amount: true
                }
            });

            return {
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                referralCode: user.referralCode,
                joinedAt: user.createdAt,
                stats: {
                    referralsCount: user._count.referralsGiven,
                    payingReferralsCount: user.referralsGiven.filter(r => r.firstPurchase).length,
                    totalEarnedCredits: earnedStats._sum.creditsAdded || 0,
                    totalEarnedUsd: earnedStats._sum.amount || 0
                },
                referrals: user.referralsGiven.map(ref => ({
                    id: ref.referred.id,
                    telegramId: ref.referred.telegramId,
                    username: ref.referred.username,
                    firstName: ref.referred.firstName,
                    lastName: ref.referred.lastName,
                    joinedAt: ref.referred.createdAt,
                    bonusGranted: ref.bonusGranted,
                    firstPurchase: ref.firstPurchase,
                    dateReferred: ref.createdAt
                }))
            };
        }));

        return NextResponse.json(serializeBigInt(formattedData));
    } catch (error) {
        console.error("Error fetching referrals:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
