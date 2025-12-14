import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // 'id' here is stateId
) {
    try {
        const { id: stateId } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            (prisma.userFSMState as any).findMany({
                where: { stateId },
                include: {
                    user: {
                        include: {
                            overlays: {
                                where: { state: { in: ['ACTIVE', 'ELIGIBLE'] } },
                                select: { type: true }
                            }
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { enteredAt: 'desc' }
            }),
            prisma.userFSMState.count({ where: { stateId } })
        ]);

        return NextResponse.json({
            users: users.map((u: any) => ({
                userId: u.userId,
                username: u.user.username || 'No Username',
                fullName: `${u.user.firstName || ''} ${u.user.lastName || ''}`.trim(),
                credits: u.user.credits,
                lastActiveAt: u.user.lastActiveAt,
                activeOverlays: u.user.overlays.map((o: any) => o.type),
            })),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch users in state error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
