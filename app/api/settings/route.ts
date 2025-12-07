import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.systemSettings.upsert({
            where: { key: 'singleton' },
            update: {},
            create: {
                key: 'singleton',
                usdRubRate: 100,
                hostingCost: 0,
                systemMargin: 0,
                creditsPerUsd: 100,
                freeCreditsAmount: 3,
                telegramChannelId: '',
                isSubscriptionRequired: false,
                referralBonusAmount: 50,
                referralFirstPurchaseBonus: 150,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { systemMargin, creditsPerUsd, freeCreditsAmount, hostingCost, usdRubRate, telegramChannelId, isSubscriptionRequired, referralBonusAmount, referralFirstPurchaseBonus } = body;

        const settings = await prisma.systemSettings.update({
            where: { key: 'singleton' },
            data: {
                systemMargin: parseFloat(systemMargin),
                creditsPerUsd: parseFloat(creditsPerUsd),
                freeCreditsAmount: parseFloat(freeCreditsAmount),
                hostingCost: parseFloat(hostingCost),
                usdRubRate: parseFloat(usdRubRate),
                telegramChannelId: telegramChannelId,
                isSubscriptionRequired: isSubscriptionRequired,
                referralBonusAmount: parseFloat(referralBonusAmount),
                referralFirstPurchaseBonus: parseFloat(referralFirstPurchaseBonus),
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
