
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            versionId,
            fromStateId,
            toStateId,
            triggerType,
            triggerEvent,
            timeFrom,
            timeoutMinutes,
            priority,
            conditions, // Array of condition objects
            actions     // Array of action objects
        } = body;

        // Transactional Create
        const transition = await prisma.fSMTransition.create({
            data: {
                versionId,
                fromStateId,
                toStateId,
                triggerType,
                triggerEvent,
                timeFrom,
                timeoutMinutes: timeoutMinutes ? parseInt(timeoutMinutes) : null,
                priority: priority || 0,

                conditions: {
                    create: conditions?.map((c: any) => ({
                        field: c.field,
                        operator: c.operator,
                        value: c.value,
                        groupId: c.groupId || 0,
                    }))
                },

                actions: {
                    create: actions?.map((a: any) => ({
                        type: a.type,
                        config: a.config,
                        order: a.order || 0,
                    }))
                }
            },
            include: {
                conditions: true,
                actions: true
            }
        });

        return NextResponse.json(transition);
    } catch (error) {
        console.error('Failed to create FSM transition:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
