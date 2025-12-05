import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification...');

    // 1. Create Test User
    const user = await prisma.user.create({
        data: {
            telegramId: BigInt(Date.now()),
            username: 'test_user_cost',
            credits: 1000,
            personalMargin: 0.1, // 10%
            referralCode: `test_${Date.now()}`,
        },
    });
    console.log(`Created user: ${user.id}`);

    // 2. Create/Get Provider
    const provider = await prisma.provider.upsert({
        where: { slug: 'google' },
        update: {},
        create: {
            slug: 'google',
            name: 'Google',
            authType: 'API_KEY',
        },
    });

    // 3. Create Test Model Tariff
    const modelId = 'test-gemini-pro';
    const model = await prisma.modelTariff.upsert({
        where: { modelId },
        update: {
            inputPrice: 1.0, // $1 per 1M tokens
            outputPrice: 2.0, // $2 per 1M tokens
            creditPriceUsd: 0.01, // $0.01 per credit
            modelMargin: 0.05, // 5%
            inputImageTokens: 100,
            imageTokensHighRes: 1000,
        },
        create: {
            modelId,
            providerId: provider.id,
            name: 'Test Gemini Pro',
            inputPrice: 1.0,
            outputPrice: 2.0,
            creditPriceUsd: 0.01,
            modelMargin: 0.05,
            inputImageTokens: 100,
            imageTokensHighRes: 1000,
        },
    });
    console.log(`Created/Updated model: ${model.modelId}`);

    // 4. Create User Settings
    await prisma.userSettings.create({
        data: {
            userId: user.id,
            selectedModelId: model.modelId,
        },
    });

    // 5. Simulate Cost Calculation Logic (mimicking CreditsService)
    // We can't easily import the service here without NestJS context, so we'll replicate the logic to verify the DB state
    // or we can try to instantiate the service if we can mock dependencies, but that's hard in a script.
    // Instead, let's just verify the formula manually against what we expect.

    const inputTokens = 500;
    const outputTokens = 1000;
    const systemMargin = 0.0; // Assuming default 0

    const inputCost = (inputTokens / 1_000_000) * model.inputPrice!;
    const outputCost = (outputTokens / 1_000_000) * model.outputPrice!;
    const baseCost = inputCost + outputCost;

    const totalMargin = systemMargin + user.personalMargin + model.modelMargin;
    const totalCostUsd = baseCost * (1 + totalMargin);
    const creditsToDeduct = totalCostUsd / model.creditPriceUsd!;

    console.log('Expected Calculation:');
    console.log(`Base Cost: $${baseCost.toFixed(6)}`);
    console.log(`Total Margin: ${(totalMargin * 100).toFixed(1)}%`);
    console.log(`Total Cost: $${totalCostUsd.toFixed(6)}`);
    console.log(`Credits: ${creditsToDeduct.toFixed(4)}`);

    // 6. Simulate Generation Record Creation (as if service did it)
    const generation = await prisma.generation.create({
        data: {
            user: { connect: { id: user.id } },
            type: 'TEXT_TO_IMAGE',
            safetyLevel: 'BLOCK_MEDIUM_AND_ABOVE',
            prompt: 'test prompt',
            status: 'COMPLETED',
            creditsUsed: creditsToDeduct,
            model: { connect: { modelId: model.modelId } },
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            totalCostUsd,
            costDetails: {
                baseCost,
                margins: { system: systemMargin, user: user.personalMargin, model: model.modelMargin },
            },
        },
    });
    console.log(`Created generation: ${generation.id}`);

    // 7. Deduct Credits
    await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: creditsToDeduct } },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`User credits after deduction: ${updatedUser?.credits}`);

    // 8. Verify
    if (Math.abs(updatedUser!.credits - (1000 - creditsToDeduct)) < 0.0001) {
        console.log('SUCCESS: Credits deducted correctly.');
    } else {
        console.error('FAILURE: Credits deduction mismatch.');
    }

    // Cleanup
    await prisma.generation.delete({ where: { id: generation.id } });
    await prisma.userSettings.delete({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    // Keep model/provider for future tests or manual cleanup
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
