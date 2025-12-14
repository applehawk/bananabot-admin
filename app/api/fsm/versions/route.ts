
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const versions = await prisma.fSMVersion.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { states: true, transitions: true },
                },
            },
        });
        return NextResponse.json(versions);
    } catch (error) {
        console.error('Failed to fetch FSM versions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, cloneFromId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Logic to clone version if cloneFromId is provided (Future improvement)
        // For now, simple creation

        const version = await prisma.fSMVersion.create({
            data: {
                name,
                isActive: false, // Default to inactive
            },
        });

        return NextResponse.json(version);
    } catch (error) {
        console.error('Failed to create FSM version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
