
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let versionId = searchParams.get('versionId') ? parseInt(searchParams.get('versionId')!) : undefined;

        // If no version specified, use active one
        if (!versionId) {
            const activeVersion = await prisma.fSMVersion.findFirst({ where: { isActive: true } });
            versionId = activeVersion?.id;
        }

        if (!versionId) {
            return NextResponse.json({
                stateDistribution: [],
                totalActiveUsers: 0,
                warning: 'No active version found'
            });
        }

        // 1. Get all states for this version to ensure we return 0 for empty states
        const states = await prisma.fSMState.findMany({
            where: { versionId },
            select: { id: true, name: true, isTerminal: true, isInitial: true }
        });

        // 2. Aggregate users by state
        const userCounts = await prisma.userFSMState.groupBy({
            by: ['stateId'],
            where: { versionId },
            _count: { userId: true }
        });

        // 3. Map counts to states
        const stateDistribution = states.map(state => {
            const match = userCounts.find(c => c.stateId === state.id);
            return {
                stateId: state.id,
                name: state.name,
                isTerminal: state.isTerminal,
                isInitial: state.isInitial,
                count: match ? match._count.userId : 0
            };
        });

        // 4. Calculate total
        const totalActiveUsers = stateDistribution.reduce((sum, item) => sum + item.count, 0);

        return NextResponse.json({
            versionId,
            totalActiveUsers,
            stateDistribution
        });

    } catch (error) {
        console.error('Failed to fetch FSM stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
