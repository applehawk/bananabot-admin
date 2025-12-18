import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ACTION_TYPES } from './constants';
import { ActionForm } from './ActionForm';

interface RuleActionsSectionProps {
    actions: any[];
    onAdd: () => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onUpdateParam: (index: number, paramKey: string, paramValue: any) => void;
    onUpdateParamsJSON: (index: number, jsonString: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onRemove: (index: number) => void;
    availablePackages: any[];
}

export function RuleActionsSection({
    actions,
    onAdd,
    onUpdate,
    onUpdateParam,
    onUpdateParamsJSON,
    onMove,
    onRemove,
    availablePackages
}: RuleActionsSectionProps) {
    return (
        <div className="col-span-2 space-y-2 mt-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Actions (Executed in Order)</h3>
                <Button size="sm" variant="outline" onClick={onAdd}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
            </div>
            <div className="space-y-4">
                {actions.map((a: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2 bg-white p-3 border rounded shadow-sm relative transition-all duration-200">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-4 w-4"
                                        disabled={i === 0}
                                        onClick={() => onMove(i, 'up')}
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-4 w-4"
                                        disabled={i === actions.length - 1}
                                        onClick={() => onMove(i, 'down')}
                                    >
                                        <ArrowDown className="h-3 w-3" />
                                    </Button>
                                </div>
                                <span className="bg-gray-100 text-xs px-2 py-1 rounded font-mono">#{i + 1}</span>
                                <select
                                    className="border rounded p-1 text-xs bg-white font-medium min-w-[150px]"
                                    value={a.type}
                                    onChange={e => onUpdate(i, 'type', e.target.value)}
                                >
                                    {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => onRemove(i)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* DYNAMIC FORM */}
                        <div className="pl-8">
                            <ActionForm
                                action={a}
                                index={i}
                                availablePackages={availablePackages}
                                onUpdateParam={onUpdateParam}
                                onUpdateParamsJSON={onUpdateParamsJSON}
                            />
                        </div>

                    </div>
                ))}
                {actions.length === 0 && <p className="text-xs text-muted-foreground italic">No actions defined.</p>}
            </div>
        </div>
    );
}
