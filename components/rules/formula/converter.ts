import { ASTNode, ConditionNode, LogicalNode } from './parser';

export interface Condition {
    field: string;
    operator: string;
    value: string;
    groupId: number;
}

/**
 * Convert AST to groupId-based conditions
 * Algorithm: Assign same groupId to AND conditions, different groupId to OR conditions
 */
export function astToConditions(ast: ASTNode): Condition[] {
    const conditions: Condition[] = [];
    let groupId = 0;

    function traverse(node: ASTNode, currentGroupId: number) {
        if (node.type === 'condition') {
            conditions.push({
                field: node.field,
                operator: node.operator,
                value: node.value,
                groupId: currentGroupId
            });
        } else if (node.type === 'and') {
            // Same group for AND
            traverse(node.left, currentGroupId);
            traverse(node.right, currentGroupId);
        } else if (node.type === 'or') {
            // Different groups for OR
            traverse(node.left, currentGroupId);
            groupId++;
            traverse(node.right, groupId);
        }
    }

    traverse(ast, groupId);
    return conditions;
}

/**
 * Convert groupId-based conditions to AST
 */
export function conditionsToAst(conditions: Condition[]): ASTNode | null {
    if (conditions.length === 0) return null;
    if (conditions.length === 1) {
        return {
            type: 'condition',
            field: conditions[0].field,
            operator: conditions[0].operator,
            value: conditions[0].value
        };
    }

    // Group conditions by groupId
    const groups = new Map<number, ConditionNode[]>();
    for (const condition of conditions) {
        if (!groups.has(condition.groupId)) {
            groups.set(condition.groupId, []);
        }
        groups.get(condition.groupId)!.push({
            type: 'condition',
            field: condition.field,
            operator: condition.operator,
            value: condition.value
        });
    }

    // Build AND nodes for each group
    const groupNodes: ASTNode[] = [];
    for (const groupConditions of groups.values()) {
        if (groupConditions.length === 1) {
            groupNodes.push(groupConditions[0]);
        } else {
            // Combine with AND
            let andNode: ASTNode = groupConditions[0];
            for (let i = 1; i < groupConditions.length; i++) {
                andNode = {
                    type: 'and',
                    left: andNode,
                    right: groupConditions[i]
                };
            }
            groupNodes.push(andNode);
        }
    }

    // Combine groups with OR
    if (groupNodes.length === 1) {
        return groupNodes[0];
    }

    let orNode: ASTNode = groupNodes[0];
    for (let i = 1; i < groupNodes.length; i++) {
        orNode = {
            type: 'or',
            left: orNode,
            right: groupNodes[i]
        };
    }

    return orNode;
}

/**
 * Convert AST to formula string
 */
export function astToFormula(ast: ASTNode): string {
    // Map internal operators to display operators
    const operatorMap: Record<string, string> = {
        'EQUALS': '==',
        'NOT_EQUALS': '!=',
        'GT': '>',
        'GTE': '>=',
        'LT': '<',
        'LTE': '<=',
        'IN': 'in',
        'NOT_IN': '!in',
        'EXISTS': 'exists',
        'NOT_EXISTS': '!exists'
    };

    function nodeToString(node: ASTNode, parentType?: 'and' | 'or'): string {
        if (node.type === 'condition') {
            const op = operatorMap[node.operator] || node.operator;
            // Quote string values
            const value = isNaN(Number(node.value)) && node.value !== 'true' && node.value !== 'false'
                ? `"${node.value}"`
                : node.value;
            return `${node.field} ${op} ${value}`;
        } else if (node.type === 'and') {
            const left = nodeToString(node.left, 'and');
            const right = nodeToString(node.right, 'and');
            const result = `${left} AND ${right}`;
            // Add parentheses if parent is OR
            return parentType === 'or' ? `(${result})` : result;
        } else if (node.type === 'or') {
            const left = nodeToString(node.left, 'or');
            const right = nodeToString(node.right, 'or');
            return `${left} OR ${right}`;
        }
        return '';
    }

    return nodeToString(ast);
}

/**
 * Convert groupId-based conditions to formula string
 */
export function conditionsToFormula(conditions: Condition[]): string {
    const ast = conditionsToAst(conditions);
    return ast ? astToFormula(ast) : '';
}
