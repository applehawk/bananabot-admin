import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 50;
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    try {
        const where = userId ? { userId } : {};

        const [messages, total] = await Promise.all([
            prisma.chatMessage.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            telegramId: true
                        }
                    }
                }
            }),
            prisma.chatMessage.count({ where })
        ]);

        return NextResponse.json({
            messages,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
