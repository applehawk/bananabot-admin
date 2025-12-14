import { NextResponse } from 'next/server';
import { FSMServiceHelper } from '@/lib/fsm';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const context = await FSMServiceHelper.getUserContext(userId);

        if (!context) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(context);
    } catch (error) {
        console.error('Get FSM context error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
