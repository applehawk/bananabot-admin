import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


// GET all stages
export async function GET() {
    try {
        const stages = await prisma.retentionStage.findMany({
            orderBy: { order: 'asc' },
            include: {
                creditPackage: true,
                burnableBonus: true,
            }
        });
        return NextResponse.json(stages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
    }
}

// Helper to manage custom package creation
async function handlePackageCreation(customPackage: any, packageId: string | null) {
    if (customPackage) {
        const { name, price, credits } = customPackage;
        const pkg = await prisma.creditPackage.create({
            data: {
                name,
                price: Number(price),
                credits: Number(credits),
                active: false,
                currency: 'RUB',
                popular: false,
                discount: 0,
                priceYooMoney: Number(price),
                priceCrypto: Number(price),
                priceStars: Math.ceil(Number(price) * 1.5),
                description: 'Retention attached package'
            }
        });
        return pkg.id;
    }
    return packageId;
}

// Helper to manage bonus creation/update
async function handleBonusManagement(bonusData: any, existingBonusId?: string | null) {
    if (!bonusData) return null;

    const data = {
        amount: Number(bonusData.amount),
        expiresInHours: Number(bonusData.expiresInHours),
        conditionGenerations: bonusData.conditionGenerations ? Number(bonusData.conditionGenerations) : null,
        conditionTopUpAmount: bonusData.conditionTopUpAmount ? Number(bonusData.conditionTopUpAmount) : null,
    };

    if (existingBonusId) {
        const updated = await prisma.burnableBonus.update({
            where: { id: existingBonusId },
            data
        });
        return updated.id;
    } else {
        const created = await prisma.burnableBonus.create({
            data
        });
        return created.id;
    }
}

// POST create stage
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, message, order, isActive, buttons,
            hoursSinceRegistration, hoursSinceLastActivity, hoursSinceLastStage,
            // New fields
            isSpecialOffer, customPackage, packageId, specialOfferLabel,
            isRandomGenerationEnabled, randomGenerationLabel,
            conditionGenerations, conditionPaymentPresent, hoursSinceFirstPayment,
            activeHoursStart, activeHoursEnd,
            burnableBonus // Bonus Data object
        } = body;

        const creditPackageId = await handlePackageCreation(customPackage, packageId);
        const burnableBonusId = await handleBonusManagement(burnableBonus);

        const stage = await prisma.retentionStage.create({
            data: {
                name,
                message,
                order: Number(order),
                hoursSinceRegistration: hoursSinceRegistration ? parseInt(hoursSinceRegistration) : null,
                hoursSinceLastActivity: hoursSinceLastActivity ? parseInt(hoursSinceLastActivity) : null,
                hoursSinceLastStage: hoursSinceLastStage ? parseInt(hoursSinceLastStage) : null,
                isActive: isActive ?? true,
                buttons: buttons || null,

                // New fields
                isSpecialOffer: !!isSpecialOffer,
                creditPackageId: creditPackageId || null,
                specialOfferLabel: specialOfferLabel || null,

                isRandomGenerationEnabled: !!isRandomGenerationEnabled,
                randomGenerationLabel: randomGenerationLabel || null,

                conditionGenerations: conditionGenerations ? parseInt(conditionGenerations) : null,
                conditionPaymentPresent: conditionPaymentPresent === 'true' ? true : (conditionPaymentPresent === 'false' ? false : null),
                hoursSinceFirstPayment: hoursSinceFirstPayment ? parseInt(hoursSinceFirstPayment) : null,

                activeHoursStart: activeHoursStart ? parseInt(activeHoursStart) : null,
                activeHoursEnd: activeHoursEnd ? parseInt(activeHoursEnd) : null,

                burnableBonusId: burnableBonusId || null,
            },
        });
        return NextResponse.json(stage);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 });
    }
}

// PUT update stage
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, customPackage, packageId, burnableBonus, ...data } = body;

        // Clean up integers
        if (data.hoursSinceRegistration !== undefined) data.hoursSinceRegistration = data.hoursSinceRegistration ? parseInt(data.hoursSinceRegistration) : null;
        if (data.hoursSinceLastActivity !== undefined) data.hoursSinceLastActivity = data.hoursSinceLastActivity ? parseInt(data.hoursSinceLastActivity) : null;
        if (data.hoursSinceLastStage !== undefined) data.hoursSinceLastStage = data.hoursSinceLastStage ? parseInt(data.hoursSinceLastStage) : null;

        // New integer fields
        if (data.conditionGenerations !== undefined) data.conditionGenerations = data.conditionGenerations ? parseInt(data.conditionGenerations) : null;
        if (data.hoursSinceFirstPayment !== undefined) data.hoursSinceFirstPayment = data.hoursSinceFirstPayment ? parseInt(data.hoursSinceFirstPayment) : null;
        if (data.activeHoursStart !== undefined) data.activeHoursStart = data.activeHoursStart ? parseInt(data.activeHoursStart) : null;
        if (data.activeHoursEnd !== undefined) data.activeHoursEnd = data.activeHoursEnd ? parseInt(data.activeHoursEnd) : null;

        // Payment condition parsing
        if (data.conditionPaymentPresent !== undefined) {
            data.conditionPaymentPresent = data.conditionPaymentPresent === 'true' ? true : (data.conditionPaymentPresent === 'false' ? false : null);
        }

        // Handle package creation if needed
        if (customPackage || packageId) {
            data.creditPackageId = await handlePackageCreation(customPackage, packageId);
        }

        // Handle Bonus
        // Need to find existing bonus id to update it, OR create new.
        // It's cleaner to fetch the stage first to see if it has a bonus.
        // But for simplicity, if burnableBonus is passed, we create/update.
        // If burnableBonus is NULL/undefined but was previously set, we might want to unset it.
        // Let's check if the client sends existing ID. Client usually sends just config.

        // We will fetch the current stage to get the current burnableBonusId
        const currentStage = await prisma.retentionStage.findUnique({ where: { id } });

        if (burnableBonus) {
            data.burnableBonusId = await handleBonusManagement(burnableBonus, currentStage?.burnableBonusId);
        } else {
            // If explicit null or not provided???? 
            // If user disabled bonus, client should send burnableBonus: null or similar?
            // "burnableBonus" in body will be generated by frontend. If disabled, frontend sends nothing or null.
            // If disabled, we should unlink.
            data.burnableBonusId = null;
            // Note: we are not deleting the old bonus record here to prevent side effects if reused, 
            // but in our logic bonuses are 1:1 for stages usually. 
            // It's fine to leave it orphaned or delete it. For now leaving it.
        }

        // Handle booleans
        if (data.isSpecialOffer !== undefined) data.isSpecialOffer = !!data.isSpecialOffer;
        if (data.isRandomGenerationEnabled !== undefined) data.isRandomGenerationEnabled = !!data.isRandomGenerationEnabled;


        const stage = await prisma.retentionStage.update({
            where: { id },
            data,
        });
        return NextResponse.json(stage);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
    }
}

// DELETE stage
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.retentionStage.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete stage' }, { status: 500 });
    }
}
