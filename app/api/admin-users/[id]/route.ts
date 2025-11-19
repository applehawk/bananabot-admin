import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const admin = await prisma.adminUser.update({
      where: { id },
      data: {
        role: body.role,
      },
    });
    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error updating admin user:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  try {
    await prisma.adminUser.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
