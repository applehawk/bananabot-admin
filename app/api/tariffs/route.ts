import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function GET() {
    try {
        const tariffs = await prisma.modelTariff.findMany({
            orderBy: { name: 'asc' },
            include: {
                provider: {
                    select: { name: true, slug: true },
                },
            },
        });
        return NextResponse.json(tariffs);
    } catch (error) {
        console.error('Error fetching tariffs:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const tariff = await prisma.modelTariff.create({
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
        console.error('Error creating tariff:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
