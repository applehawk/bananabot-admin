import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const data = await request.json();
        const tariff = await prisma.geminiModelTariff.update({
            where: { id },
            data: {
                modelId: data.modelId,
                name: data.name,
                inputPrice: data.inputPrice,
                outputPrice: data.outputPrice,
                outputImagePrice: data.outputImagePrice,
                imageTokens1K: data.imageTokens1K,
                imageTokens4K: data.imageTokens4K,
                isActive: data.isActive,
            },
        });
        return NextResponse.json(tariff);
    } catch (error) {
        console.error('Error updating tariff:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        await prisma.geminiModelTariff.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting tariff:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
