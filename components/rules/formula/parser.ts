/**
 * Formula Parser for Condition Expressions
 * 
 * Supports syntax like:
 * - Simple: credits > 100
 * - Complex: (credits > 100 AND isPaidUser == true) OR totalGenerations < 5
 */

export interface Token {
    type: 'FIELD' | 'OPERATOR' | 'VALUE' | 'AND' | 'OR' | 'LPAREN' | 'RPAREN' | 'EOF';
    value: string;
    position: number;
}

export interface ConditionNode {
    type: 'condition';
    field: string;
    operator: string;
    value: string;
}

export interface LogicalNode {
    type: 'and' | 'or';
    left: ASTNode;
    right: ASTNode;
}

export type ASTNode = ConditionNode | LogicalNode;

const COMPARISON_OPERATORS = ['==', '!=', '>=', '<=', '>', '<', 'in', '!in', 'exists', '!exists'];

/**
 * Tokenize the formula string
 */
export function tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
        const char = formula[i];

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Parentheses
        if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(', position: i });
            i++;
            continue;
        }

        if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')', position: i });
            i++;
            continue;
        }

        // String literals (quoted values)
        if (char === '"' || char === "'") {
            const quote = char;
            let value = '';
            i++; // skip opening quote
            while (i < formula.length && formula[i] !== quote) {
                value += formula[i];
                i++;
            }
            i++; // skip closing quote
            tokens.push({ type: 'VALUE', value, position: i });
            continue;
        }

        // Numbers
        if (/\d/.test(char) || (char === '-' && i + 1 < formula.length && /\d/.test(formula[i + 1]))) {
            let value = '';
            while (i < formula.length && /[\d.\-]/.test(formula[i])) {
                value += formula[i];
                i++;
            }
            tokens.push({ type: 'VALUE', value, position: i });
            continue;
        }

        // Operators and keywords
        let word = '';
        const start = i;
        while (i < formula.length && /[a-zA-Z0-9_!<>=.]/.test(formula[i])) {
            word += formula[i];
            i++;
        }

        if (word) {
            const upperWord = word.toUpperCase();

            // Logical operators
            if (upperWord === 'AND') {
                tokens.push({ type: 'AND', value: 'AND', position: start });
            } else if (upperWord === 'OR') {
                tokens.push({ type: 'OR', value: 'OR', position: start });
            } else if (upperWord === 'TRUE' || upperWord === 'FALSE') {
                tokens.push({ type: 'VALUE', value: word.toLowerCase(), position: start });
            } else if (COMPARISON_OPERATORS.some(op => word.startsWith(op))) {
                // Check for comparison operators
                const op = COMPARISON_OPERATORS.find(op => word.startsWith(op));
                if (op) {
                    tokens.push({ type: 'OPERATOR', value: op, position: start });
                    // Put back the rest
                    i = start + op.length;
                }
            } else {
                // Field name
                tokens.push({ type: 'FIELD', value: word, position: start });
            }
            continue;
        }

        // Unknown character, skip
        i++;
    }

    tokens.push({ type: 'EOF', value: '', position: i });
    return tokens;
}

/**
 * Parse tokens into AST
 * Grammar:
 * expression := orExpr
 * orExpr := andExpr (OR andExpr)*
 * andExpr := primary (AND primary)*
 * primary := condition | '(' expression ')'
 * condition := FIELD OPERATOR VALUE
 */
export function parse(tokens: Token[]): ASTNode {
    let current = 0;

    function peek(): Token {
        return tokens[current] || { type: 'EOF', value: '', position: -1 };
    }

    function consume(expected?: Token['type']): Token {
        const token = tokens[current];
        if (expected && token.type !== expected) {
            throw new Error(`Expected ${expected} but got ${token.type} at position ${token.position}`);
        }
        current++;
        return token;
    }

    function parseCondition(): ConditionNode {
        const field = consume('FIELD').value;
        const operator = consume('OPERATOR').value;
        const value = consume('VALUE').value;

        // Map display operators back to internal format
        const operatorMap: Record<string, string> = {
            '==': 'EQUALS',
            '!=': 'NOT_EQUALS',
            '>': 'GT',
            '>=': 'GTE',
            '<': 'LT',
            '<=': 'LTE',
            'in': 'IN',
            '!in': 'NOT_IN',
            'exists': 'EXISTS',
            '!exists': 'NOT_EXISTS'
        };

        return {
            type: 'condition',
            field,
            operator: operatorMap[operator] || operator,
            value
        };
    }

    function parsePrimary(): ASTNode {
        if (peek().type === 'LPAREN') {
            consume('LPAREN');
            const expr = parseOrExpr();
            consume('RPAREN');
            return expr;
        }
        return parseCondition();
    }

    function parseAndExpr(): ASTNode {
        let left = parsePrimary();

        while (peek().type === 'AND') {
            consume('AND');
            const right = parsePrimary();
            left = { type: 'and', left, right };
        }

        return left;
    }

    function parseOrExpr(): ASTNode {
        let left = parseAndExpr();

        while (peek().type === 'OR') {
            consume('OR');
            const right = parseAndExpr();
            left = { type: 'or', left, right };
        }

        return left;
    }

    const ast = parseOrExpr();

    if (peek().type !== 'EOF') {
        throw new Error(`Unexpected token ${peek().value} at position ${peek().position}`);
    }

    return ast;
}

/**
 * Parse a formula string into AST
 */
export function parseFormula(formula: string): ASTNode {
    if (!formula.trim()) {
        throw new Error('Formula cannot be empty');
    }

    const tokens = tokenize(formula);
    return parse(tokens);
}

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string, validFields: string[] = []): {
    valid: boolean;
    error?: string;
    position?: number;
    length?: number;
} {
    try {
        const tokens = tokenize(formula);
        const ast = parse(tokens);

        // Validate field names if provided
        if (validFields.length > 0) {
            const invalidFields: { field: string; position: number }[] = [];

            function checkFields(node: ASTNode) {
                if (node.type === 'condition') {
                    if (!validFields.includes(node.field)) {
                        // Find position of this field in original formula
                        const fieldToken = tokens.find(t => t.type === 'FIELD' && t.value === node.field);
                        if (fieldToken) {
                            invalidFields.push({ field: node.field, position: fieldToken.position });
                        }
                    }
                } else if (node.type === 'and' || node.type === 'or') {
                    checkFields(node.left);
                    checkFields(node.right);
                }
            }

            checkFields(ast);

            if (invalidFields.length > 0) {
                const first = invalidFields[0];
                return {
                    valid: false,
                    error: `Unknown field "${first.field}". Use autocomplete for valid field names.`,
                    position: first.position,
                    length: first.field.length
                };
            }
        }

        return { valid: true };
    } catch (error) {
        if (error instanceof Error) {
            // Extract position from error message
            const posMatch = error.message.match(/position (\d+)/);
            const position = posMatch ? parseInt(posMatch[1]) : undefined;

            return {
                valid: false,
                error: error.message,
                position,
                length: 1
            };
        }
        return {
            valid: false,
            error: 'Unknown error',
            position: 0,
            length: 1
        };
    }
}
