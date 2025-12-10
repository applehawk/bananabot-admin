
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function POST(req: NextRequest) {
    try {
        const { modelId } = await req.json();

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

        // Update all user settings
        const result = await prisma.userSettings.updateMany({
            data: {
                selectedModelId: modelId,
            },
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully updated model to ${model.name} for ${result.count} users.`
        });

    } catch (error) {
        console.error('Error updating all users model:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
