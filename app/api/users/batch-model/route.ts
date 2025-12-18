import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function POST(req: NextRequest) {
    try {
        const { userIds, modelId } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
        }

        if (!modelId) {
            return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
        }

        // Verify model exists
        const model = await prisma.modelTariff.findUnique({
            where: { modelId },
        });

        if (!model) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }

        // Update settings for selected users
        const result = await prisma.userSettings.updateMany({
            where: {
                userId: {
                    in: userIds,
                },
            },
            data: {
                selectedModelId: modelId,
            },
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully updated model to ${model.name} for ${result.count} selected users.`
        });

    } catch (error) {
        console.error('Error updating batch users model:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
