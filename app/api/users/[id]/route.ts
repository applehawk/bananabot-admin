
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const body = await req.json();
        // Allow updating specific fields
        const { isRuleEngineEnabled } = body;

        // Construct update data (only include fields that are present)
        const updateData: any = {};
        if (isRuleEngineEnabled !== undefined) updateData.isRuleEngineEnabled = isRuleEngineEnabled;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Delete UserOverlay manually as it does not have cascade delete in schema
            await tx.userOverlay.deleteMany({
                where: { userId: id }
            });

            // Delete User (Generations, Transactions etc should cascade if schema is correct)
            await tx.user.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
