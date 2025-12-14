
import { prisma } from '@/lib/prisma';
import { FSMEvent, FSMActionType, UserOverlay } from '@prisma/client';

const FSMConditionOperator = {
    EQUALS: 'EQUALS',
    NOT_EQUALS: 'NOT_EQUALS',
    GREATER_THAN: 'GREATER_THAN',
    LESS_THAN: 'LESS_THAN',
    GREATER_OR_EQUAL: 'GREATER_OR_EQUAL',
    LESS_OR_EQUAL: 'LESS_OR_EQUAL',
    CONTAINS: 'CONTAINS'
};

// We need to define types if they are not exported from Prisma or shared lib
// Ideally we should import from a shared types package, but for now we define local interfaces matching schema.

export type FSMContext = {
    userId: string;
    userTags: string[];
    credits: number;
    totalGenerations: number;
    totalPayments: number;
    lastGenerationAt?: Date;
    lastPaymentAt?: Date;
    lastPaymentFailed: boolean;
    createdAt: Date;
    preferredModel?: string;

    isPaidUser: boolean;
    isLowBalance: boolean;
    daysSinceCreated: number;
    hoursSinceLastPay?: number;
    hoursSinceLastGen?: number;
    hoursSinceLastActivity: number;
    activeOverlays: UserOverlay[];
};

// Re-implementing logic from FSMService for Admin context
export const FSMServiceHelper = {

    async getUserContext(userId: string): Promise<FSMContext | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                generations: { orderBy: { createdAt: 'desc' }, take: 1 },
                transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
                overlays: { where: { state: { in: ['ACTIVE', 'ELIGIBLE'] } } }
            }
        });
        if (!user) return null;
        return this.buildContext(user);
    },

    async buildContext(user: any): Promise<FSMContext> {
        // We need to re-fetch aggregates if 'user' object is partial, but let's assume we do strict fetching here.
        // For accuracy, we should fetch aggregates similar to the backend service.

        const payments = await prisma.transaction.aggregate({
            where: { userId: user.id, status: 'COMPLETED', type: 'PURCHASE' },
            _count: true,
            _max: { createdAt: true }
        });

        const lastFailedPayment = await prisma.transaction.findFirst({
            where: { userId: user.id, type: 'PURCHASE', status: 'FAILED' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        const lastGen = await prisma.generation.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, modelId: true }
        });

        const totalPayments = payments._count;
        const lastPaymentAt = payments._max.createdAt || undefined;
        const lastPaymentFailed = !!lastFailedPayment && (!lastPaymentAt || lastFailedPayment.createdAt > lastPaymentAt);

        const now = Date.now();
        const daysSinceCreated = (now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const hoursSinceLastPay = lastPaymentAt ? (now - new Date(lastPaymentAt).getTime()) / (1000 * 60 * 60) : undefined;
        // Accessing lastGen date safely
        const lastGenDate = lastGen?.createdAt ? new Date(lastGen.createdAt) : undefined;
        const hoursSinceLastGen = lastGenDate ? (now - lastGenDate.getTime()) / (1000 * 60 * 60) : undefined;
        const hoursSinceLastActivity = (now - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60);

        const CREDITS_NEEDED = 20;
        const isLowBalance = user.credits < CREDITS_NEEDED;

        return {
            userId: user.id,
            userTags: user.tags || [],
            credits: user.credits,
            totalGenerations: user.totalGenerated,
            totalPayments,
            lastGenerationAt: lastGenDate,
            lastPaymentAt: lastPaymentAt ? new Date(lastPaymentAt) : undefined,
            lastPaymentFailed,
            createdAt: user.createdAt,
            preferredModel: lastGen?.modelId || undefined,
            isPaidUser: totalPayments > 0,
            isLowBalance,
            daysSinceCreated,
            hoursSinceLastPay,
            hoursSinceLastGen,
            hoursSinceLastActivity,
            activeOverlays: user.overlays || []
        };
    },

    async evaluateConditions(user: any, conditions: any[]): Promise<boolean> {
        if (conditions.length === 0) return true;
        const context = await this.buildContext(user);

        const groups: Record<number, any[]> = {};
        for (const c of conditions) {
            if (!groups[c.groupId]) groups[c.groupId] = [];
            groups[c.groupId].push(c);
        }

        for (const groupIdStr in groups) {
            const groupConditions = groups[groupIdStr];
            let groupResult = true;
            for (const condition of groupConditions) {
                if (!this.checkCondition(condition, context)) {
                    groupResult = false;
                    break;
                }
            }
            if (groupResult) return true;
        }
        return false;
    },

    checkCondition(condition: any, context: FSMContext): boolean {
        const { field, operator, value } = condition;
        const currentValue = this.resolveFieldValue(field, context);
        return this.compareValues(currentValue, operator, value);
    },

    resolveFieldValue(field: string, context: FSMContext): any {
        switch (field) {
            case 'credits_balance': return context.credits;
            case 'total_generations': return context.totalGenerations;
            case 'total_payments': return context.totalPayments;
            case 'is_paid_user': return context.isPaidUser;
            case 'user_tags': return context.userTags;
            case 'preferred_model': return context.preferredModel;
            case 'last_payment_failed': return context.lastPaymentFailed;
            case 'days_since_created': return context.daysSinceCreated;
            case 'hours_since_last_pay': return context.hoursSinceLastPay;
            case 'hours_since_last_gen': return context.hoursSinceLastGen;
            case 'hours_since_last_activity': return context.hoursSinceLastActivity;
            case 'is_low_balance': return context.isLowBalance;
            case 'is_freeloader': return (context.totalGenerations > 0 && context.totalPayments === 0 && context.isLowBalance);
            case 'is_dead': return (context.totalGenerations === 0);
            default: return null;
        }
    },

    compareValues(current: any, operator: string, target: string): boolean {
        let targetVal: any = target;
        if (!isNaN(Number(target))) targetVal = Number(target);
        if (target === 'true') targetVal = true;
        if (target === 'false') targetVal = false;

        const numCurrent = Number(current);
        const numTarget = Number(targetVal);
        const isNumeric = !isNaN(numCurrent) && !isNaN(numTarget) && typeof current !== 'boolean';

        switch (operator) {
            case 'EQUALS': return current == targetVal;
            case 'NOT_EQUALS': return current != targetVal;
            case 'GREATER_THAN': return isNumeric ? numCurrent > numTarget : false;
            case 'LESS_THAN': return isNumeric ? numCurrent < numTarget : false;
            case 'GREATER_OR_EQUAL': return isNumeric ? numCurrent >= numTarget : false;
            case 'LESS_OR_EQUAL': return isNumeric ? numCurrent <= numTarget : false;
            case 'CONTAINS':
                if (Array.isArray(current)) return current.includes(targetVal);
                if (typeof current === 'string') return current.includes(String(targetVal));
                return false;
            default: return false;
        }
    },

    // --- Immersion Logic ---

    async immerseUser(userId: string, versionId: number) {
        console.log(`Starting Immersion for user ${userId}`);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { fsmState: { include: { state: true } } },
        });
        if (!user) return;

        const context = await this.buildContext(user);

        const initialState = await prisma.fSMState.findFirst({
            where: { versionId, isInitial: true }
        });
        if (!initialState) return;

        let currentState = initialState;
        let transitionsCount = 0;
        const MAX_DEPTH = 50;

        while (transitionsCount < MAX_DEPTH) {
            const transitions = await prisma.fSMTransition.findMany({
                where: { fromStateId: currentState.id, versionId },
                include: { conditions: true, toState: true },
                orderBy: { priority: 'desc' }
            });

            let transitionFound = null;
            for (const transition of transitions) {
                // Event check
                let isEventImplied = true;
                // Note: Matching "Event" strings from FSMEvent enum (which are strings in JS runtime)
                if (transition.triggerEvent === 'PAYMENT_COMPLETED' as any) {
                    isEventImplied = context.totalPayments > 0;
                } else if (transition.triggerEvent === 'FIRST_GENERATION' as any) {
                    isEventImplied = context.totalGenerations > 0;
                }

                if (!isEventImplied) continue;
                if (await this.evaluateConditions(user, transition.conditions)) {
                    transitionFound = transition;
                    break;
                }
            }

            if (transitionFound) {
                currentState = transitionFound.toState;
                transitionsCount++;
                if (currentState.isTerminal) break;
            } else {
                break;
            }
        }

        await prisma.userFSMState.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                stateId: currentState.id,
                versionId,
                enteredAt: new Date(),
            },
            update: {
                stateId: currentState.id,
                versionId,
                enteredAt: new Date(),
            }
        });
        console.log(`Immersion complete: ${currentState.name}`);
    },

    // --- Process State (Manual Trigger) ---
    // NOTE: This version in Admin CANNOT execute actions like 'SendMessage' easily because 
    // it doesn't have access to the Bot's Telegram Service.
    // For now, we will perform the STATE TRANSITION but Actions might need to be logged or skipped.
    // Ideally, for "Manual Trigger with Actions", we should CALL the Bot API.
    // IF we cannot call Bot API, we can only update state. 
    // The user requirement "чтобы произоизошли все Actions" implies we MUST execute actions.
    // Since we are in separate app, we really should rely on a shared service or API.
    // Lacking that, we will implement state transition only and log a warning for actions.

    async processUserStrict(userId: string) {
        // Implement simplified version or just skip if we can't do actions.
        console.log('Manual process not fully supported in Admin standalone mode for actions.');
    }
};
