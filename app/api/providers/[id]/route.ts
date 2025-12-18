import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const data = await request.json();
        const provider = await prisma.provider.update({
            where: { id },
            data: {
                slug: data.slug,
                name: data.name,
                baseUrl: data.baseUrl,
                authType: data.authType,
                authHeaderName: data.authHeaderName,
                authHeaderPrefix: data.authHeaderPrefix,
                authQueryParam: data.authQueryParam,
                authTokenUrl: data.authTokenUrl,
                authScope: data.authScope,
            },
        });
        return NextResponse.json(provider);
    } catch (error) {
        console.error('Error updating provider:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        await prisma.provider.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting provider:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
