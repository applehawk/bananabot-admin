import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteParams) {
  const { id } = await context.params;
  try {
    const pkg = await prisma.creditPackage.findUnique({ where: { id } });
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Error fetching package:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function PUT(request: Request, context: RouteParams) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const updatedPackage = await prisma.creditPackage.update({
      where: { id },
      data: {
        name: body.name,
        credits: body.credits !== undefined ? parseFloat(body.credits) : undefined,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        currency: body.currency,
        discount: body.discount !== undefined ? parseInt(body.discount) : undefined,
        popular: body.popular,
        active: body.active,
        priceYooMoney: body.priceYooMoney !== undefined ? (body.priceYooMoney ? parseFloat(body.priceYooMoney) : null) : undefined,
        priceStars: body.priceStars !== undefined ? (body.priceStars ? parseInt(body.priceStars) : null) : undefined,
        priceCrypto: body.priceCrypto !== undefined ? (body.priceCrypto ? parseFloat(body.priceCrypto) : null) : undefined,
        description: body.description !== undefined ? body.description : undefined,
      },
    });
    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const { id } = await context.params;
  try {
    await prisma.creditPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
