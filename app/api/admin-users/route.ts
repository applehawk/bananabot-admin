import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Convert BigInt to string for JSON serialization
    const serializedAdmins = admins.map((admin: any) => ({
      ...admin,
      telegramId: admin.telegramId.toString(),
    }));

    return NextResponse.json(serializedAdmins);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = await prisma.adminUser.create({
      data: {
        telegramId: BigInt(body.telegramId),
        username: body.username || null,
        role: body.role || 'ADMIN',
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedAdmin = {
      ...admin,
      telegramId: admin.telegramId.toString(),
    };

    return NextResponse.json(serializedAdmin, { status: 201 });
  } catch (error) {
    console.error('Error creating admin user:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
