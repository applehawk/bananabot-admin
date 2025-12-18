
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: stateId } = await params;

        if (!stateId) {
            return NextResponse.json({ error: 'Invalid State ID' }, { status: 400 });
        }

        // Fetch users currently in this state
        // We use the UserFSMState table which tracks current state
        const userStates = await prisma.userFSMState.findMany({
            where: { stateId },
            take: 50, // Limit for performance
            orderBy: { enteredAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        firstName: true,
                        username: true,
                        credits: true,
                        lastActiveAt: true,
                        overlays: {
                            where: { state: 'ACTIVE' },
                            select: {
                                type: true,
                                expiresAt: true,
                                metadata: true
                            }
                        }
                    }
                }
            }
        });

        // Flatten the structure for the frontend
        const users = userStates.map(us => ({
            ...us.user,
            telegramId: us.user.telegramId.toString(),
            lastTransitionAt: us.enteredAt,
            enteredStateAt: us.enteredAt,
            activeOverlays: us.user.overlays,
            overlays: us.user.overlays
        }));

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Failed to fetch users for state:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
