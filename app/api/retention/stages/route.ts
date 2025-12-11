import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all stages
export async function GET() {
    try {
        const stages = await prisma.retentionStage.findMany({
            orderBy: { order: 'asc' },
        });
        return NextResponse.json(stages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
    }
}

// POST create stage
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, message, order, hoursSinceRegistration, hoursSinceLastActivity, hoursSinceLastStage, isActive } = body;

        const stage = await prisma.retentionStage.create({
            data: {
                name,
                message,
                order,
                hoursSinceRegistration: hoursSinceRegistration ? parseInt(hoursSinceRegistration) : null,
                hoursSinceLastActivity: hoursSinceLastActivity ? parseInt(hoursSinceLastActivity) : null,
                hoursSinceLastStage: hoursSinceLastStage ? parseInt(hoursSinceLastStage) : null,
                isActive: isActive ?? true,
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
        const { id, ...data } = body;

        // Clean up integers
        if (data.hoursSinceRegistration !== undefined) data.hoursSinceRegistration = data.hoursSinceRegistration ? parseInt(data.hoursSinceRegistration) : null;
        if (data.hoursSinceLastActivity !== undefined) data.hoursSinceLastActivity = data.hoursSinceLastActivity ? parseInt(data.hoursSinceLastActivity) : null;
        if (data.hoursSinceLastStage !== undefined) data.hoursSinceLastStage = data.hoursSinceLastStage ? parseInt(data.hoursSinceLastStage) : null;

        const stage = await prisma.retentionStage.update({
            where: { id },
            data,
        });
        return NextResponse.json(stage);
    } catch (error) {
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
