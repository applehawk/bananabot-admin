import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, scheduledFor, targetNotSubscribed, botToken, customPackage, packageId, targetUserIds } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let creditPackageId = null;

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
                    description: 'Broadcast attached package'
                }
            });
            creditPackageId = pkg.id;
        } else if (packageId) {
            creditPackageId = packageId;
        }

        const broadcast = await prisma.broadcast.create({
            data: {
                message,
                status: 'PENDING',
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
                targetNotSubscribed: targetNotSubscribed || false,
                botToken: botToken || null,
                creditPackageId: creditPackageId || null,
                targetUserIds: targetUserIds || [],
            }
        });

        return NextResponse.json(broadcast);
    } catch (error) {
        return NextResponse.json(handleDatabaseError(error), { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const broadcasts = await prisma.broadcast.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json(broadcasts);
    } catch (error) {
        return NextResponse.json(handleDatabaseError(error), { status: 500 });
    }
}
