import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { CONDITION_OPERATORS, FSM_CONTEXT_VARIABLES } from './constants';
import { ConditionValueInput } from './ConditionValueInput';

interface RuleConditionsSectionProps {
    conditions: any[];
    onAdd: () => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onRemove: (index: number) => void;
    fsmStates: any[];
}

export function RuleConditionsSection({
    conditions,
    onAdd,
    onUpdate,
    onRemove,
    fsmStates
}: RuleConditionsSectionProps) {
    return (
        <div className="col-span-2 space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Conditions (AND within Group, OR between Groups)</h3>
                <Button size="sm" variant="outline" onClick={onAdd}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
            </div>
            <div className="space-y-2">
                {conditions.map((c: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center bg-white p-2 border rounded shadow-sm">
                        <select
                            className="border rounded p-1 text-xs w-48 bg-white"
                            value={c.field}
                            onChange={e => onUpdate(i, 'field', e.target.value)}
                        >
                            <option value="">-- Field --</option>
                            {FSM_CONTEXT_VARIABLES.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                        <select
                            className="border rounded p-1 text-xs w-28 bg-white"
                            value={c.operator}
                            onChange={e => onUpdate(i, 'operator', e.target.value)}
                        >
                            {CONDITION_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
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
        </div>
    );
}
