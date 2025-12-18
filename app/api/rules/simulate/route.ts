
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RuleSimulator } from '@/lib/rule-simulator';
import { RuleTrigger } from '@prisma/client';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { trigger, context } = body;

        if (!trigger || !context) {
            return NextResponse.json({ error: 'Trigger and Context are required' }, { status: 400 });
        }

        // 1. Fetch Active Rules for this Trigger
        const rules = await prisma.rule.findMany({
            where: {
                isActive: true,
                trigger: trigger as RuleTrigger
            },
            include: {
                conditions: true,
                actions: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: {
                priority: 'desc'
            }
        });

        // 2. Simulate
        const matchedRules = RuleSimulator.evaluate(rules, context);

        return NextResponse.json({
            totalRules: rules.length,
            matchedRules: matchedRules
        });

    } catch (error) {
        console.error('Simulation Failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
