import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function GET() {
    try {
        const providers = await prisma.provider.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { models: true },
                },
            },
        });
        return NextResponse.json(providers);
    } catch (error) {
        console.error('Error fetching providers:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const provider = await prisma.provider.create({
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
        console.error('Error creating provider:', error);
        const errorResponse = handleDatabaseError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
