'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Code, List } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { CONDITION_OPERATORS, FSM_CONTEXT_VARIABLES } from './constants';
import { ConditionValueInput } from './ConditionValueInput';
import { FormulaEditor } from './formula/FormulaEditor';
import { parseFormula } from './formula/parser';
import { astToConditions, conditionsToFormula } from './formula/converter';

interface RuleConditionsSectionProps {
    conditions: any[];
    onAdd: () => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onRemove: (index: number) => void;
    fsmStates: any[];
    overlayCodes?: string[];
}

export function RuleConditionsSection({
    conditions,
    onAdd,
    onUpdate,
    onRemove,
    fsmStates,
    overlayCodes = []
}: RuleConditionsSectionProps) {
    const [mode, setMode] = useState<'visual' | 'formula'>('visual');
    const [formula, setFormula] = useState('');

    const overlayVariables = overlayCodes.map(code => `overlay.${code}`);
    const fsmStateVariables = fsmStates.map(state => `state.${state.name}`);
    const allVariables = [...FSM_CONTEXT_VARIABLES, ...overlayVariables, ...fsmStateVariables];

    // Update formula when switching to formula mode or conditions change
    useEffect(() => {
        if (mode === 'formula' && conditions.length > 0) {
            // TODO: Update conversion logic if needed for new variables
            const newFormula = conditionsToFormula(conditions);
            setFormula(newFormula);
        }
    }, [mode, conditions]);

    // Handle formula change and parse to conditions
    const handleFormulaChange = (newFormula: string) => {
        setFormula(newFormula);
    };

    // Apply formula (parse and update conditions)
    const applyFormula = () => {
        try {
            const ast = parseFormula(formula);
            const newConditions = astToConditions(ast);

            // Clear existing conditions
            for (let i = conditions.length - 1; i >= 0; i--) {
                onRemove(i);
            }

            // Add new conditions
            newConditions.forEach((condition, index) => {
                if (index === 0) {
                    onAdd();
                    setTimeout(() => {
                        onUpdate(0, 'field', condition.field);
                        onUpdate(0, 'operator', condition.operator);
                        onUpdate(0, 'value', condition.value);
                        onUpdate(0, 'groupId', condition.groupId);
                    }, 0);
                } else {
                    setTimeout(() => {
                        onAdd();
                        setTimeout(() => {
                            onUpdate(index, 'field', condition.field);
                            onUpdate(index, 'operator', condition.operator);
                            onUpdate(index, 'value', condition.value);
                            onUpdate(index, 'groupId', condition.groupId);
                        }, 0);
                    }, index * 10);
                }
            });
        } catch (error) {
            console.error('Failed to parse formula:', error);
        }
    };

    return (
        <div className="col-span-2 space-y-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Conditions</h3>
                    <InfoTooltip content="Define conditions using formula mode (recommended) or visual builder" />
                </div>
                <div className="flex gap-2">
                    {/* Mode toggle */}
                    <div className="flex bg-gray-100 rounded-md p-1">
                        <button
                            onClick={() => setMode('formula')}
                            className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${mode === 'formula' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Code className="h-3 w-3" />
                            Formula
                        </button>
                        <button
                            onClick={() => setMode('visual')}
                            className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${mode === 'visual' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <List className="h-3 w-3" />
                            Visual
                        </button>
                    </div>
                    {mode === 'visual' && (
                        <Button size="sm" variant="outline" onClick={onAdd}>
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    )}
                </div>
            </div>

            {mode === 'formula' ? (
                <div className="space-y-2">
                    <FormulaEditor
                        value={formula}
                        onChange={handleFormulaChange}
                        extraVariables={overlayVariables}
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={applyFormula}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Apply Formula
                        </Button>
                    </div>
                    {conditions.length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <strong>Current conditions:</strong> {conditions.length} condition(s) defined
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {conditions.map((c: any, i: number) => (
                        <div key={i} className="flex gap-2 items-center bg-white p-2 border rounded shadow-sm">
                            <select
                                className="border rounded p-1 text-xs w-48 bg-white"
                                value={c.field}
                                onChange={e => onUpdate(i, 'field', e.target.value)}
                            >
                                <option value="">-- Field --</option>
                                {allVariables.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <select
                                className="border rounded p-1 text-xs w-20 bg-white font-mono"
                                value={c.operator}
                                onChange={e => onUpdate(i, 'operator', e.target.value)}
                            >
                                {CONDITION_OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                            </select>

                            <ConditionValueInput
                                condition={c}
                                index={i}
                                fsmStates={fsmStates}
                                onUpdate={onUpdate}
                            />

                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 font-bold flex items-center">
                                    Grp
                                    <InfoTooltip content="Logic Group ID. Conditions with the SAME Group ID are combined via AND. Different groups are combined via OR. Example: (A AND B) OR (C)." />
                                </span>
                                <input
                                    type="number"
                                    className="border rounded p-1 text-xs w-12"
                                    value={c.groupId}
                                    onChange={e => onUpdate(i, 'groupId', Number(e.target.value))}
                                />
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => onRemove(i)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {conditions.length === 0 && <p className="text-xs text-muted-foreground italic">No conditions (Always run)</p>}
                </div>
            )}
        </div>
    );
}
