
export class RuleSimulator {
    static evaluate(rules: any[], context: any): any[] {
        const matches: any[] = [];

        for (const rule of rules) {
            if (this.evaluateRule(rule, context)) {
                matches.push(rule);
            }
        }
        return matches;
    }

    private static evaluateRule(rule: any, context: any): boolean {
        const conditions = rule.conditions || [];
        if (conditions.length === 0) return true;

        // Group conditions
        const groups: Record<number, any[]> = {};
        for (const c of conditions) {
            const gid = c.groupId || 0;
            if (!groups[gid]) groups[gid] = [];
            groups[gid].push(c);
        }

        // Check Groups (OR)
        for (const gid in groups) {
            const groupConditions = groups[gid];
            let groupPassed = true;

            // Check Conditions in Group (AND)
            for (const c of groupConditions) {
                if (!this.checkCondition(c, context)) {
                    groupPassed = false;
                    break;
                }
            }

            if (groupPassed) return true;
        }

        return false;
    }

    private static checkCondition(condition: any, context: any): boolean {
        const { field, operator, value } = condition;
        const actualValue = this.resolveValue(field, context);
        return this.compare(actualValue, operator, value);
    }

    private static resolveValue(field: string, context: any): any {
        // Direct mapping or fallback to direct property access
        // Based on fsm.logic.ts mappings
        switch (field) {
            case 'credits': return context.credits;
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
            case 'to_state_name': return context.toStateName;
            case 'from_state_id': return context.fromStateId;
            case 'trigger_event': return context.triggerEvent;
            case 'lifecycle': return context.lifecycle;
            default:
                // Fallback: Check if context has this exact key
                return context[field];
        }
    }

    private static compare(current: any, operator: string, target: string): boolean {
        let targetVal: any = target;
        // Basic type coercion
        if (target === 'true') targetVal = true;
        if (target === 'false') targetVal = false;
        if (!isNaN(Number(target)) && target !== '' && target !== null) targetVal = Number(target);

        // Current value coercion if needed
        const numCurrent = Number(current);
        const numTarget = Number(targetVal); // Attempt strict number comparison if possible
        const isNumeric = !isNaN(numCurrent) && !isNaN(numTarget) && typeof current !== 'boolean' && typeof targetVal === 'number';

        switch (operator) {
            case 'EQUALS': return current == targetVal;
            case 'NOT_EQUALS': return current != targetVal;
            case 'GT': return isNumeric ? numCurrent > numTarget : false;
            case 'GTE': return isNumeric ? numCurrent >= numTarget : false;
            case 'LT': return isNumeric ? numCurrent < numTarget : false;
            case 'LTE': return isNumeric ? numCurrent <= numTarget : false;
            case 'IN':
                if (typeof targetVal === 'string') return targetVal.split(',').includes(String(current));
                return false;
            case 'NOT_IN':
                if (typeof targetVal === 'string') return !targetVal.split(',').includes(String(current));
                return true;
            case 'EXISTS': return current !== null && current !== undefined;
            case 'NOT_EXISTS': return current === null || current === undefined;
            default: return false;
        }
    }
}
