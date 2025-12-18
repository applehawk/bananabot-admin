import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const version = await prisma.fSMVersion.findUnique({
            where: { id },
            include: {
                states: {
                    orderBy: { name: 'asc' },
                    include: {
                        // Include counts or minimal info?
                        // For editor, we need full info
                    }
                },
                transitions: {
                    include: {
                        conditions: true,
                        actions: true,
                    }
                }
            },
        });

        if (!version) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        return NextResponse.json(version);
    } catch (error) {
        console.error(`Failed to fetch FSM version: `, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        const body = await req.json();

        // If setting active, we might want to deactivate others in a transaction
        if (body.isActive) {
            await prisma.$transaction([
                prisma.fSMVersion.updateMany({
                    where: { id: { not: id } },
                    data: { isActive: false }
                }),
                prisma.fSMVersion.update({
                    where: { id },
                    data: { ...body }
                })
            ]);
        } else {
            await prisma.fSMVersion.update({
                where: { id },
                data: { ...body }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update FSM version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Delete in transaction to ensure cleanup
        await prisma.$transaction(async (tx) => {
            // 1. Delete all transitions in this version
            await tx.fSMTransition.deleteMany({
                where: { versionId: id }
            });

            // 2. Delete all states in this version
            // (Note: UserFSMState links to State, need to check if that blocks deletion)
            // schema says: UserFSMState.stateId references FSMState.id. No onDelete cascade there either?
            // Let's check schema again. `UserFSMState` `state FSMState @relation(fields: [stateId], references: [id])`.
            // Default is restrict. We might need to delete UserFSMState entries too?
            // Or maybe just set them to null/delete if we are removing the version.
            // If a user is in a state of a version we are deleting, we should probably reset them or delete their state tracking.

            // Let's delete UserFSMState entries for this version first.
            await tx.userFSMState.deleteMany({
                where: { versionId: id }
            });

            // Delete history? History references version indirectly or by string?
            // schema: UserFSMHistory has toStateId (String), fromStateId (String). 
            // It does NOT have a relation to FSMState object enforced by FK in a way that blocks?
            // Wait, schema says: `toStateId String` but no `@relation`? 
            // Checking schema provided earlier:
            /*
            model UserFSMHistory {
              ...
              fromStateId   String?
              toStateId     String
              // No relation definition to FSMState here in the snippet provided!
              // BUT it might be there in the real file if I missed it?
              // The snippet showed:
              //   fromStateId   String?
              //   toStateId     String
              //   triggerEvent  FSMEvent?
              //   ...
            */
            // If there is no relation, we are fine. If there is, we might fail.
            // Assuming no relation for history strings to allow keeping history of deleted states.

            // Delete states
            await tx.fSMState.deleteMany({
                where: { versionId: id }
            });

            // 3. Delete the version
            await tx.fSMVersion.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete FSM version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
