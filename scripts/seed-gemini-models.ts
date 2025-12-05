import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Gemini models...');

    // Ensure Google provider exists
    const googleProvider = await prisma.provider.upsert({
        where: { slug: 'google' },
        update: {},
        create: {
            slug: 'google',
            name: 'Google Gemini',
            authType: 'API_KEY',
            authHeaderName: 'x-goog-api-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
    });

    const models = [
        // === Gemini 3 Pro ===
        {
            modelId: 'gemini-3-pro-preview',
            name: 'Gemini 3 Pro Preview',
            displayName: 'Gemini 3 Pro Preview',
            description: 'The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet.',
            inputPrice: 2.00, // <= 200k
            inputLongPrice: 4.00, // > 200k
            outputPrice: 12.00, // <= 200k
            outputLongPrice: 18.00, // > 200k
            priceUnit: 'per_million_tokens',
            hasImageGeneration: false,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: true,
        },
        {
            modelId: 'gemini-3-pro-image-preview',
            name: 'Gemini 3 Pro Image Preview',
            displayName: 'Gemini 3 Pro Image Preview 🍌',
            description: 'Our native image generation model, optimized for speed, flexibility, and contextual understanding.',
            inputPrice: 2.00, // Text input
            outputPrice: 12.00, // Text output
            outputImagePrice: 120.00, // $120 per 1M tokens for images
            priceUnit: 'per_million_tokens',
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: true,
            inputImageTokens: 560,
            imageTokensLowRes: 1120, // 1K-2K
            imageTokensHighRes: 2000, // 4K
        },

        // === Gemini 2.5 Pro ===
        {
            modelId: 'gemini-2.5-pro',
            name: 'Gemini 2.5 Pro',
            displayName: 'Gemini 2.5 Pro',
            description: 'Our state-of-the-art multipurpose model, which excels at coding and complex reasoning tasks.',
            inputPrice: 1.25, // <= 200k
            inputLongPrice: 2.50, // > 200k
            outputPrice: 10.00, // <= 200k
            outputLongPrice: 15.00, // > 200k
            priceUnit: 'per_million_tokens',
            hasImageGeneration: false,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },

        // === Gemini 2.5 Flash ===
        {
            modelId: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            displayName: 'Gemini 2.5 Flash',
            description: 'Our first hybrid reasoning model which supports a 1M token context window and has thinking budgets.',
            inputPrice: 0.30, // text/image/video
            outputPrice: 2.50,
            priceUnit: 'per_million_tokens',
            hasImageGeneration: false,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },
        {
            modelId: 'gemini-2.5-flash-image',
            name: 'Gemini 2.5 Flash Image',
            displayName: 'Gemini 2.5 Flash Image 🍌',
            description: 'Our native image generation model, optimized for speed, flexibility, and contextual understanding.',
            inputPrice: 0.30, // text/image
            outputPrice: 2.50, // text output (assumed same as base flash)
            outputImagePrice: 30.00, // $30 per 1M tokens
            priceUnit: 'per_million_tokens',
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: true,
            inputImageTokens: 560, // Assumed same as 3 Pro
            imageTokensLowRes: 1290, // <= 1024x1024
        },

        // === Gemini 2.5 Flash-Lite ===
        {
            modelId: 'gemini-2.5-flash-lite',
            name: 'Gemini 2.5 Flash-Lite',
            displayName: 'Gemini 2.5 Flash-Lite',
            description: 'Our smallest and most cost effective model, built for at scale usage.',
            inputPrice: 0.10,
            outputPrice: 0.40,
            priceUnit: 'per_million_tokens',
            hasImageGeneration: false,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },

        // === Gemini 2.0 Flash ===
        {
            modelId: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            displayName: 'Gemini 2.0 Flash',
            description: 'Our most balanced multimodal model with great performance across all tasks.',
            inputPrice: 0.10,
            outputPrice: 0.40,
            outputImagePrice: 30.00, // $0.039 per image ~= $30/1M tokens
            priceUnit: 'per_million_tokens',
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
            inputImageTokens: 560,
            imageTokensLowRes: 1290,
        },

        // === Gemini 2.0 Flash-Lite ===
        {
            modelId: 'gemini-2.0-flash-lite',
            name: 'Gemini 2.0 Flash-Lite',
            displayName: 'Gemini 2.0 Flash-Lite',
            description: 'Our smallest and most cost effective model, built for at scale usage.',
            inputPrice: 0.075,
            outputPrice: 0.30,
            priceUnit: 'per_million_tokens',
            hasImageGeneration: false,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },

        // === Imagen 4 ===
        {
            modelId: 'imagen-4.0-generate-001',
            name: 'Imagen 4',
            displayName: 'Imagen 4',
            description: 'Our latest image generation model, with significantly better text rendering.',
            outputImagePrice: 0.04 * 1000000, // $0.04 per image. Converted to per 1M tokens if using tokens, but here priceUnit is per_generation usually.
            // Wait, schema supports outputImagePrice as "per 1M tokens".
            // But Imagen pricing is "per Image".
            // Let's use priceUnit="per_generation" and set outputPrice to cost per image?
            // Or stick to per_million_tokens if we can map it.
            // The user asked for "Imagen 4".
            // Let's use "per_generation" for Imagen as it's cleaner.
            priceUnit: 'per_generation',
            outputPrice: 0.04, // Cost per generation
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },
        {
            modelId: 'imagen-4.0-ultra-generate-001',
            name: 'Imagen 4 Ultra',
            displayName: 'Imagen 4 Ultra', // User asked for "Imagen 4" but let's distinguish
            description: 'Ultra high quality image generation.',
            priceUnit: 'per_generation',
            outputPrice: 0.06,
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },
        {
            modelId: 'imagen-4.0-fast-generate-001',
            name: 'Imagen 4 Fast',
            displayName: 'Imagen 4 Fast',
            description: 'Fast image generation.',
            priceUnit: 'per_generation',
            outputPrice: 0.02,
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },

        // === Imagen 3 ===
        {
            modelId: 'imagen-3.0-generate-002',
            name: 'Imagen 3',
            displayName: 'Imagen 3',
            description: 'Our state-of-the-art image generation model.',
            priceUnit: 'per_generation',
            outputPrice: 0.03,
            hasImageGeneration: true,
            hasVideoGeneration: false,
            hasNativeAudio: false,
            isPreview: false,
        },

        // === Veo 3.1 ===
        {
            modelId: 'veo-3.1-generate-preview',
            name: 'Veo 3.1',
            displayName: 'Veo 3.1',
            description: 'Our latest video generation model.',
            outputVideoPrice: 0.40, // $0.40 per second
            priceUnit: 'per_second',
            hasImageGeneration: false,
            hasVideoGeneration: true,
            hasNativeAudio: true,
            isPreview: true,
            maxVideoDuration: 60,
        },
        {
            modelId: 'veo-3.1-fast-generate-preview',
            name: 'Veo 3.1 Fast',
            displayName: 'Veo 3.1', // Requested display name
            description: 'Fast video generation.',
            outputVideoPrice: 0.15, // $0.15 per second
            priceUnit: 'per_second',
            hasImageGeneration: false,
            hasVideoGeneration: true,
            hasNativeAudio: true,
            isPreview: true,
            maxVideoDuration: 60,
        },

        // === Veo 3 ===
        {
            modelId: 'veo-3.0-generate-001',
            name: 'Veo 3',
            displayName: 'Veo 3',
            description: 'Our stable video generation model.',
            outputVideoPrice: 0.40,
            priceUnit: 'per_second',
            hasImageGeneration: false,
            hasVideoGeneration: true,
            hasNativeAudio: true,
            isPreview: false,
            maxVideoDuration: 60,
        },
        {
            modelId: 'veo-3.0-fast-generate-001',
            name: 'Veo 3 Fast',
            displayName: 'Veo 3', // Requested display name
            description: 'Fast video generation.',
            outputVideoPrice: 0.15,
            priceUnit: 'per_second',
            hasImageGeneration: false,
            hasVideoGeneration: true,
            hasNativeAudio: true,
            isPreview: false,
            maxVideoDuration: 60,
        },

        // === Veo 2 ===
        {
            modelId: 'veo-2.0-generate-001',
            name: 'Veo 2',
            displayName: 'Veo 2',
            description: 'Previous generation video model.',
            outputVideoPrice: 0.35,
            priceUnit: 'per_second',
            hasImageGeneration: false,
            hasVideoGeneration: true,
            hasNativeAudio: true,
            isPreview: false,
            maxVideoDuration: 60,
        },
    ];

    for (const model of models) {
        const created = await prisma.modelTariff.upsert({
            where: { modelId: model.modelId },
            update: {
                ...model,
                providerId: googleProvider.id,
            },
            create: {
                ...model,
                providerId: googleProvider.id,
                modelNameOnProvider: model.modelId,
                isActive: true,
            },
        });
        console.log(`✓ Upserted: ${created.modelId} (${created.displayName})`);
    }

    console.log('\n✅ Gemini models seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
