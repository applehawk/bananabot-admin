import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTINGS_KEY = 'global';

export async function GET() {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { key: SETTINGS_KEY },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    key: SETTINGS_KEY,
                    usdRubRate: 100.0,
                    hostingCost: 0.0,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { usdRubRate, hostingCost } = body;

        const settings = await prisma.systemSettings.upsert({
            where: { key: SETTINGS_KEY },
            update: {
                usdRubRate: parseFloat(usdRubRate) || 0,
                hostingCost: parseFloat(hostingCost) || 0,
            },
            create: {
                key: SETTINGS_KEY,
                usdRubRate: parseFloat(usdRubRate) || 0,
                hostingCost: parseFloat(hostingCost) || 0,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
