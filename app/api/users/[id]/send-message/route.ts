import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { handleDatabaseError } from '@/lib/db-error-handler';
import { getServerSession } from 'next-auth';
// You might need to import your auth options if you want strict checking, but basic session check works often
// import { authOptions } from "@/lib/auth"; 

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Basic Auth Check (optional, but good practice)
        // const session = await getServerSession(); 
        // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id: userId } = await params;
        const body = await request.json();
        const { message } = body;

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

        // Attempt to send to Telegram
        const telegramResult = await sendTelegramMessage(user.telegramId.toString(), message);

        // Record in DB
        const adminMessage = await prisma.adminMessage.create({
            data: {
                userId: user.id,
                message,
                status: telegramResult.success ? 'SENT' : 'FAILED',
                error: telegramResult.error,
                isBroadcast: false,
                // adminId: session?.user?.id // If we had the admin ID
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
