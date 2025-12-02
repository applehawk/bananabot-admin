import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const tariffs = await prisma.geminiModelTariff.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(tariffs);
    } catch (error) {
        console.error('Error fetching tariffs:', error);
        return NextResponse.json({ error: 'Failed to fetch tariffs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { modelId, name, inputPrice, outputPrice, imagePrice1K, imagePrice4K } = body;

        if (!modelId || !name) {
            return NextResponse.json({ error: 'Model ID and Name are required' }, { status: 400 });
        }

        const tariff = await prisma.geminiModelTariff.create({
            data: {
                modelId,
                name,
                inputPrice: parseFloat(inputPrice) || 0,
                outputPrice: parseFloat(outputPrice) || 0,
                imagePrice1K: parseFloat(imagePrice1K) || 0,
                imagePrice4K: parseFloat(imagePrice4K) || 0,
            },
        });

        return NextResponse.json(tariff);
    } catch (error) {
        console.error('Error creating tariff:', error);
        return NextResponse.json({ error: 'Failed to create tariff' }, { status: 500 });
    }
}
