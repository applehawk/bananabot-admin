import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            telegramId: true,
          },
        },
      },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Convert BigInt to string for JSON serialization
    const serializedSettings = {
      ...settings,
      user: {
        ...settings.user,
        telegramId: settings.user.telegramId.toString(),
      },
    };

    return NextResponse.json(serializedSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  try {
    const data = await request.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId: id },
      update: {
        aspectRatio: data.aspectRatio,
        numberOfImages: data.numberOfImages,
        safetyLevel: data.safetyLevel,
        language: data.language,
        hdQuality: data.hdQuality,
        autoEnhance: data.autoEnhance,
        useNegativePrompt: data.useNegativePrompt,
        notifyOnComplete: data.notifyOnComplete,
        notifyOnBonus: data.notifyOnBonus,
        geminiModelId: data.geminiModelId,
      },
      create: {
        userId: id,
        aspectRatio: data.aspectRatio,
        numberOfImages: data.numberOfImages,
        safetyLevel: data.safetyLevel,
        language: data.language,
        hdQuality: data.hdQuality,
        autoEnhance: data.autoEnhance,
        useNegativePrompt: data.useNegativePrompt,
        notifyOnComplete: data.notifyOnComplete,
        notifyOnBonus: data.notifyOnBonus,
        geminiModelId: data.geminiModelId,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
