import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { RuleTrigger } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { code, description, trigger, priority, isActive, conditions, actions } = body;

        // Check existence
        const existing = await prisma.rule.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Validate Trigger
        if (trigger && !Object.values(RuleTrigger).includes(trigger)) {
            return NextResponse.json({ error: 'Invalid Trigger' }, { status: 400 });
        }

        // Transactional Update: Delete nested, recreate new
        const updatedRule = await prisma.$transaction(async (tx) => {
            // Update Rule fields
            await tx.rule.update({
                where: { id },
                data: {
                    code,
                    description,
                    trigger,
                    priority: Number(priority),
                    isActive
                }
            });

            // Replace Conditions
            if (conditions) {
                await tx.ruleCondition.deleteMany({ where: { ruleId: id } });
                await tx.ruleCondition.createMany({
                    data: conditions.map((c: any) => ({
                        ruleId: id,
                        field: c.field,
                        operator: c.operator,
                        value: String(c.value),
                        groupId: Number(c.groupId) || 0
                    }))
                });
            }

            // Replace Actions
            if (actions) {
                await tx.ruleAction.deleteMany({ where: { ruleId: id } });
                await tx.ruleAction.createMany({
                    data: actions.map((a: any, index: number) => ({
                        ruleId: id,
                        type: a.type,
                        params: a.params || {},
                        order: index
                    }))
                });
            }

            return await tx.rule.findUnique({
                where: { id },
                include: { conditions: true, actions: { orderBy: { order: 'asc' } } }
            });
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error('Failed to update rule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.rule.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete rule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
