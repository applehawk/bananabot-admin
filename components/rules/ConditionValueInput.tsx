import { LIFECYCLE_STATES } from './constants';

interface ConditionValueInputProps {
    condition: any;
    index: number;
    fsmStates: any[];
    onUpdate: (index: number, field: string, value: any) => void;
}

export function ConditionValueInput({ condition, index, fsmStates, onUpdate }: ConditionValueInputProps) {
    // 1. Lifecycle State Dropdown
    if (condition.field === 'lifecycle' || condition.field.includes('lifecycle')) {
        return (
            <select
                className="border rounded p-1 text-xs flex-1 bg-white"
                value={condition.value}
                onChange={e => onUpdate(index, 'value', e.target.value)}
            >
                <option value="">-- Select State --</option>
                {LIFECYCLE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        );
    }

    // 2. Boolean Fields
    if (condition.field === 'isPaidUser' || condition.field === 'isLowBalance' || condition.field === 'lastPaymentFailed') {
        return (
            <select
                className="border rounded p-1 text-xs flex-1 bg-white"
                value={condition.value}
                onChange={e => onUpdate(index, 'value', e.target.value)}
            >
                <option value="">-- Select --</option>
                <option value="true">TRUE</option>
                <option value="false">FALSE</option>
            </select>
        );
    }

    // 3. FSM State Selectors
    if (condition.field === 'toStateName') {
        return (
            <select
                className="border rounded p-1 text-xs flex-1 bg-white"
                value={condition.value}
                onChange={e => onUpdate(index, 'value', e.target.value)}
            >
                <option value="">-- Select State name --</option>
                {fsmStates.map(s => (
                    <option key={s.id} value={s.name}>
                        {s.name} ({s.version?.name || 'VN'})
                    </option>
                ))}
            </select>
        );
    }

    if (condition.field === 'fromStateId') {
        return (
            <select
                className="border rounded p-1 text-xs flex-1 bg-white"
                value={condition.value}
                onChange={e => onUpdate(index, 'value', e.target.value)}
            >
                <option value="">-- Select State ID --</option>
                {fsmStates.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.name} ({s.version?.name || 'VN'})
                    </option>
                ))}
            </select>
        );
    }

    // 4. Default Text Input
    return (
        <input
            placeholder="Value"
            className="border rounded p-1 text-xs flex-1"
            value={condition.value}
            onChange={e => onUpdate(index, 'value', e.target.value)}
        />
    );
}
