import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
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
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
