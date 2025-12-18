import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { RuleTrigger } from '@prisma/client';

export async function GET() {
    try {
        const rules = await prisma.rule.findMany({
            include: {
                conditions: true,
                actions: { orderBy: { order: 'asc' } }
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        });
        return NextResponse.json(rules);
    } catch (error) {
        console.error('Failed to fetch rules:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, description, trigger, priority, isActive, conditions, actions } = body;

        if (!code || !trigger) {
            return NextResponse.json({ error: 'Code and Trigger are required' }, { status: 400 });
        }

        // Validate Trigger
        if (!Object.values(RuleTrigger).includes(trigger)) {
            return NextResponse.json({ error: 'Invalid Trigger' }, { status: 400 });
        }

        // Check Unique Code
        const existing = await prisma.rule.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'Rule code must be unique' }, { status: 400 });
        }

        const rule = await prisma.rule.create({
            data: {
                code,
                description,
                trigger,
                priority: Number(priority) || 0,
                isActive: isActive ?? true,
                conditions: {
                    create: conditions?.map((c: any) => ({
                        field: c.field,
                        operator: c.operator,
                        value: String(c.value),
                        groupId: Number(c.groupId) || 0
                    }))
                },
                actions: {
                    create: actions?.map((a: any, index: number) => ({
                        type: a.type,
                        params: a.params || {},
                        order: index
                    }))
                }
            },
            include: {
                conditions: true,
                actions: true
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error('Failed to create rule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
