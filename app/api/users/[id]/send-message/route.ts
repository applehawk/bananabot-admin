import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { handleDatabaseError } from '@/lib/db-error-handler';
import { createHmac } from 'crypto';

// Helper to sign params matching the NestJS implementation
function signParams(params: Record<string, string | number>, secret: string): string {
    const sortedKeys = Object.keys(params).sort();
    const dataString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    return createHmac('sha256', secret).update(dataString).digest('hex');
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let telegramOptions: any = {};

        const { id: userId } = await params;
        const body = await request.json();
        const { message, customPackage, packageId } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramId: true, id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Handle Package Attachment
        let pkgToUse = null;

        if (customPackage) {
            const { name, price, credits } = customPackage;
            // Create inactive package
            pkgToUse = await prisma.creditPackage.create({
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
                    description: 'Personal Offer'
                }
            });
        } else if (packageId) {
            pkgToUse = await prisma.creditPackage.findUnique({
                where: { id: packageId }
            });
        }

        if (pkgToUse) {
            const secret = process.env.YOOMONEY_SECRET || process.env.NEXT_PUBLIC_YOOMONEY_SECRET || 'default_secret';
            const domain = process.env.DOMAIN || process.env.NEXT_PUBLIC_APP_URL || 'https://t.me/your_bot_name';

            const tariffId = pkgToUse.id;
            const timestamp = Math.floor(Date.now() / 1000);
            const tid = Number(user.telegramId);

            const paramsToSign = {
                userId: tid,
                chatId: tid,
                tariffId,
                timestamp
            };

            const sign = signParams(paramsToSign, secret);
            const paymentUrl = `${domain}/payment/init?userId=${tid}&chatId=${tid}&tariffId=${tariffId}&timestamp=${timestamp}&sign=${sign}`;

            telegramOptions.reply_markup = {
                inline_keyboard: [[
                    { text: `${pkgToUse.name} - ${pkgToUse.price}₽`, url: paymentUrl }
                ]]
            };
        }

        // Attaching package info to message text (optional, but good for history)
        const finalMessage = pkgToUse
            ? `${message}\n[Attached Package: ${pkgToUse.name} - ${pkgToUse.price}RUB]`
            : message;

        // Attempt to send to Telegram
        const telegramResult = await sendTelegramMessage(user.telegramId.toString(), message, telegramOptions);

        // Record in DB
        const adminMessage = await prisma.adminMessage.create({
            data: {
                userId: user.id,
                message: finalMessage,
                status: telegramResult.success ? 'SENT' : 'FAILED',
                error: telegramResult.error,
                isBroadcast: false,
            }
        });

        if (!telegramResult.success) {
            return NextResponse.json({
                success: false,
                error: telegramResult.error,
                record: adminMessage
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, record: adminMessage });

    } catch (error) {
        console.error('Error sending message:', error);
        const dbError = handleDatabaseError(error);
        return NextResponse.json(dbError, { status: dbError.status });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        const messages = await prisma.adminMessage.findMany({
            where: { userId },
            orderBy: { sentAt: 'desc' },
            take: 50,
            include: {
                broadcast: {
                    select: { id: true, status: true }
                }
            }
        });

        return NextResponse.json(messages);

    } catch (error) {
        return NextResponse.json(handleDatabaseError(error), { status: 500 });
    }
}
