
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import BurnableBonusForm from '../../BurnableBonusForm';

interface FSMTransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    fromStateId?: string;
    toStateId?: string;
    fromState?: any;
    toState?: any;
}

const EVENTS = [
    // System
    'BOT_START',
    // Generation
    'FIRST_GENERATION', 'GENERATION', 'GENERATION_PENDING', 'GENERATION_FAILED', 'MODEL_SELECTED',
    // Payment
    'PAYMENT_CLICKED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT',
    'PACKAGE_VIEW', 'PACKAGE_PURCHASE',
    // Credits
    'CREDITS_CHANGED', 'CREDITS_ZERO',
    // Internal
    'TIMEOUT', 'LAST_ACTIVITY', 'UNSUBSCRIBE',
    // Referral
    'REFERRAL_INVITE', 'REFERRAL_PAID',
    // Channel
    'CHANNEL_SUBSCRIPTION',
    // Offers
    'TRIPWIRE_SHOWN', 'INSUFFICIENT_CREDITS',
    // Bonus
    'BONUS_GRANTED', 'BONUS_EXPIRED'
];

const ACTION_TYPES = [
    'SEND_MESSAGE', 'SEND_SPECIAL_OFFER', 'GRANT_BURNABLE_BONUS', 'SHOW_TRIPWIRE',
    'ENABLE_REFERRAL', 'SWITCH_MODEL_HINT', 'TAG_USER', 'NO_ACTION'
];

const CONDITION_OPERATORS = [
    '==', '!=', '>', '>=', '<', '<=', 'contains', 'startsWith'
];

// Mock tags for now, or could Fetch unique tags
const SUGGESTED_TAGS = ['beta_tester', 'prefers_hd', 'high_spender', 'churn_risk', 'new_user', 'returning_user'];

export default function FSMTransitionModal({ isOpen, onClose, onSave, initialData, fromStateId, toStateId, fromState, toState }: FSMTransitionModalProps) {
    const [triggerType, setTriggerType] = useState('EVENT');
    const [triggerEvent, setTriggerEvent] = useState('');
    const [timeoutMinutes, setTimeoutMinutes] = useState('');
    const [priority, setPriority] = useState(0);

    const [actions, setActions] = useState<any[]>([]);
    const [conditions, setConditions] = useState<any[]>([]);

    // Data for dropdowns
    const [packages, setPackages] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchPackages();
            fetchModels();
        }
    }, [isOpen]);

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/packages');
            if (res.ok) setPackages(await res.json());
        } catch (e) { console.error("Failed to fetch packages", e); }
    };

    const fetchModels = async () => {
        try {
            const res = await fetch('/admin/api/tariffs');
            if (res.ok) setModels(await res.json());
        } catch (e) { console.error("Failed to fetch models", e); }
    };

    useEffect(() => {
        if (initialData) {
            setTriggerType(initialData.triggerType || 'EVENT');
            setTriggerEvent(initialData.triggerEvent || '');
            setTimeoutMinutes(initialData.timeoutMinutes || '');
            setPriority(initialData.priority || 0);

            // Ensure configs are objects
            const parsedActions = (initialData.actions || []).map((a: any) => ({
                ...a,
                config: typeof a.config === 'string' ? JSON.parse(a.config) : (a.config || {})
            }));
            setActions(parsedActions);

            setConditions(initialData.conditions || []);
        } else {
            setTriggerType('EVENT');
            setTriggerEvent(EVENTS[0]); // Default to first event
            setTimeoutMinutes('');
            setPriority(0);
            setActions([]);
            setConditions([]);
        }
    }, [initialData, isOpen]);

    // --- Actions ---
    const addAction = () => {
        setActions([...actions, { type: 'SEND_MESSAGE', config: {}, order: actions.length }]);
    };

    const updateAction = (index: number, field: string, value: any) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], [field]: value };
        // Reset config if type changes
        if (field === 'type') {
            newActions[index].config = {};
        }
        setActions(newActions);
    };

    const updateActionConfigField = (index: number, field: string, value: any) => {
        const newActions = [...actions];
        newActions[index].config = { ...newActions[index].config, [field]: value };
        setActions(newActions);
    };

    // For specialized Tag Handling
    const toggleTag = (index: number, tag: string) => {
        const currentConfig = actions[index].config || {};
        const currentTags = currentConfig.tags || [];
        let newTags;
        if (currentTags.includes(tag)) {
            newTags = currentTags.filter((t: string) => t !== tag);
        } else {
            newTags = [...currentTags, tag];
        }
        updateActionConfigField(index, 'tags', newTags);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    // --- Conditions ---
    const addCondition = () => {
        setConditions([...conditions, { field: 'user.credits', operator: '>', value: '0', groupId: 0 }]);
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setConditions(newConditions);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };


    const handleSave = () => {
        onSave({
            fromStateId,
            toStateId,
            triggerType,
            triggerEvent: triggerType === 'EVENT' ? triggerEvent : null,
            timeoutMinutes: triggerType === 'TIME' ? parseInt(timeoutMinutes) : null,
            priority: Number(priority),
            actions,
            conditions
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold">
                        {initialData ? 'Edit Transition' : 'Create Transition'}
                        {fromState && toState && <span className="text-gray-400 text-sm font-normal ml-2">({fromState.name} → {toState.name})</span>}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Trigger Configuration */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Trigger Type</label>
                            <select
                                value={triggerType}
                                onChange={(e) => setTriggerType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="EVENT">System Event</option>
                                <option value="TIME">Time Delay</option>
                            </select>
                        </div>

                        {triggerType === 'EVENT' ? (
                            <div className="col-span-6">
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Event</label>
                                <select
                                    value={triggerEvent}
                                    onChange={(e) => setTriggerEvent(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                >
                                    {EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="col-span-6">
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Minutes after Entry</label>
                                <input
                                    type="number"
                                    value={timeoutMinutes}
                                    onChange={(e) => setTimeoutMinutes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    placeholder="e.g. 60"
                                />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Priority</label>
                            <input
                                type="number"
                                value={priority}
                                onChange={(e) => setPriority(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Conditions Section */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-900">Conditions (AND)</label>
                            <button onClick={addCondition} className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                                <Plus className="h-3 w-3 mr-1" /> Add Condition
                            </button>
                        </div>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                            {conditions.map((cond, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        value={cond.field}
                                        onChange={(e) => updateCondition(idx, 'field', e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs border rounded"
                                        placeholder="Field (e.g. user.credits)"
                                    />
                                    <select
                                        value={cond.operator}
                                        onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                                        className="w-24 px-2 py-1 text-xs border rounded"
                                    >
                                        {CONDITION_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        value={cond.value}
                                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs border rounded"
                                        placeholder="Value"
                                    />
                                    <button onClick={() => removeCondition(idx)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {conditions.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No conditions (always triggers if event matches)</p>}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-900">Actions (Side Effects)</label>
                            <button onClick={addAction} className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                                <Plus className="h-3 w-3 mr-1" /> Add Action
                            </button>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                            {actions.map((action, idx) => (
                                <div key={idx} className="bg-white p-3 border rounded-md shadow-sm relative group">
                                    <button onClick={() => removeAction(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="grid grid-cols-12 gap-3 mb-2">
                                        <div className="col-span-4">
                                            <label className="text-xs text-gray-500 block mb-1">Type</label>
                                            <select
                                                value={action.type}
                                                onChange={(e) => updateAction(idx, 'type', e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded-md"
                                            >
                                                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* DYNAMIC CONFIGURATION UI */}
                                    <div className="mt-2 pl-1">

                                        {action.type === 'SEND_MESSAGE' && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Message Text</label>
                                                <textarea
                                                    value={action.config.text || ''}
                                                    onChange={(e) => updateActionConfigField(idx, 'text', e.target.value)}
                                                    className="w-full text-xs border-gray-300 rounded-md p-2"
                                                    rows={2}
                                                    placeholder="Hello! Welcome to..."
                                                />
                                            </div>
                                        )}

                                        {(action.type === 'SEND_SPECIAL_OFFER' || action.type === 'SHOW_TRIPWIRE') && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Select Package</label>
                                                <select
                                                    value={action.config.creditPackageId || ''}
                                                    onChange={(e) => updateActionConfigField(idx, 'creditPackageId', e.target.value)}
                                                    className="w-full text-xs border-gray-300 rounded-md"
                                                >
                                                    <option value="">-- Select Package --</option>
                                                    {packages.map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>
                                                            {pkg.name} ({pkg.credits} credits - ${pkg.price})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {action.type === 'GRANT_BURNABLE_BONUS' && (
                                            <div className="border border-orange-100 rounded p-2 bg-orange-50/50">
                                                <BurnableBonusForm
                                                    enabled={true}
                                                    setEnabled={() => { }} // Always enabled in this context
                                                    amount={action.config.amount || ''}
                                                    setAmount={(v) => updateActionConfigField(idx, 'amount', v)}
                                                    expiresIn={action.config.expiresIn || ''}
                                                    setExpiresIn={(v) => updateActionConfigField(idx, 'expiresIn', v)}
                                                    conditionType={action.config.conditionType || 'none'}
                                                    setConditionType={(v) => updateActionConfigField(idx, 'conditionType', v)}
                                                    conditionValue={action.config.conditionValue || ''}
                                                    setConditionValue={(v) => updateActionConfigField(idx, 'conditionValue', v)}
                                                />
                                            </div>
                                        )}

                                        {action.type === 'SWITCH_MODEL_HINT' && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Select Model</label>
                                                <select
                                                    value={action.config.modelId || ''}
                                                    onChange={(e) => updateActionConfigField(idx, 'modelId', e.target.value)}
                                                    className="w-full text-xs border-gray-300 rounded-md"
                                                >
                                                    <option value="">-- Select Model --</option>
                                                    {models.map(m => (
                                                        <option key={m.id} value={m.modelId}>
                                                            {m.displayName || m.name} ({m.modelId})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {action.type === 'TAG_USER' && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Select Tags</label>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {(action.config.tags || []).map((tag: string) => (
                                                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
                                                            {tag}
                                                            <button onClick={() => toggleTag(idx, tag)} className="ml-1 hover:text-blue-900"><X className="h-3 w-3" /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {SUGGESTED_TAGS.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => toggleTag(idx, tag)}
                                                            className={`px-2 py-0.5 text-xs rounded border ${(action.config.tags || []).includes(tag)
                                                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Or type custom tag and press Enter"
                                                    className="w-full mt-2 text-xs border-gray-300 rounded-md"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                toggleTag(idx, val);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {action.type === 'NO_ACTION' && (
                                            <p className="text-xs text-gray-400 italic">No configuration needed.</p>
                                        )}

                                        {/* Fallback for other types or custom JSON */}
                                        {['ENABLE_REFERRAL'].includes(action.type) && (
                                            <p className="text-xs text-gray-400 italic">No configuration needed.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {actions.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No actions defined.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Save Transition
                    </button>
                </div>
            </div>
        </div>
    );
}
