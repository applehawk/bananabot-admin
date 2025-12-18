import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const data = await request.json();
        const tariff = await prisma.modelTariff.update({
            where: { id },
            data: {
                modelId: data.modelId,
                providerId: data.providerId,
                name: data.name,
                displayName: data.displayName,
                description: data.description,
                inputPrice: data.inputPrice,
                inputLongPrice: data.inputLongPrice,
                outputPrice: data.outputPrice,
                outputLongPrice: data.outputLongPrice,
                outputImagePrice: data.outputImagePrice,
                outputVideoPrice: data.outputVideoPrice,
                outputAudioPrice: data.outputAudioPrice,
                priceUnit: data.priceUnit,
                creditsPerSecond: data.creditsPerSecond,
                creditsPerGeneration: data.creditsPerGeneration,
                creditPriceUsd: data.creditPriceUsd,
                imageTokensLowRes: data.imageTokensLowRes,
                imageTokensHighRes: data.imageTokensHighRes,
                videoTokensPerSecond: data.videoTokensPerSecond,
                audioTokensPerMinute: data.audioTokensPerMinute,
                maxTokens: data.maxTokens,
                maxVideoDuration: data.maxVideoDuration,
                maxImageResolution: data.maxImageResolution,
                supportedResolutions: data.supportedResolutions,
                hasNativeAudio: data.hasNativeAudio,
                hasImageGeneration: data.hasImageGeneration,
                hasVideoGeneration: data.hasVideoGeneration,
                modelNameOnProvider: data.modelNameOnProvider,
                endpoints: data.endpoints,
                modelMargin: data.modelMargin,
                isActive: data.isActive,
                isPreview: data.isPreview,
                isSelfHosted: data.isSelfHosted,
                inputImagesLimit: data.inputImagesLimit,
                inputImageTokens: data.inputImageTokens,
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
        await prisma.modelTariff.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting tariff:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
