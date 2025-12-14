
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface FSMTransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    fromStateId?: string;
    toStateId?: string;
}

const EVENTS = [
    'BOT_START', 'FIRST_GENERATION', 'GENERATION', 'GENERATION_PENDING', 'GENERATION_FAILED',
    'PAYMENT_CLICKED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
    'CREDITS_CHANGED', 'CREDITS_ZERO', 'TIMEOUT', 'REFERRAL_INVITE', 'REFERRAL_PAID'
];

const ACTION_TYPES = [
    'SEND_MESSAGE', 'SEND_SPECIAL_OFFER', 'GRANT_BURNABLE_BONUS', 'TAG_USER', 'NO_ACTION'
];

export default function FSMTransitionModal({ isOpen, onClose, onSave, initialData, fromStateId, toStateId }: FSMTransitionModalProps) {
    const [triggerType, setTriggerType] = useState('EVENT');
    const [triggerEvent, setTriggerEvent] = useState('');
    const [timeoutMinutes, setTimeoutMinutes] = useState('');

    // Simple state for actions/conditions (JSON string for MVP, or simplified list)
    // Let's do a simplified list for Actions
    const [actions, setActions] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            setTriggerType(initialData.triggerType || 'EVENT');
            setTriggerEvent(initialData.triggerEvent || '');
            setTimeoutMinutes(initialData.timeoutMinutes || '');
            setActions(initialData.actions || []);
        } else {
            setTriggerType('EVENT');
            setTriggerEvent('GENERATION');
            setTimeoutMinutes('');
            setActions([]);
        }
    }, [initialData, isOpen]);

    const addAction = () => {
        setActions([...actions, { type: 'SEND_MESSAGE', config: {}, order: actions.length }]);
    };

    const updateAction = (index: number, field: string, value: any) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], [field]: value };
        setActions(newActions);
    };

    const updateActionConfig = (index: number, configStr: string) => {
        const newActions = [...actions];
        try {
            // Just store string temporarily? No, try to parse if valid
            // Ideally we need a JSON editor or specific fields.
            // For now let's just assume valid JSON input or simple string
            newActions[index].config = JSON.parse(configStr);
        } catch (e) {
            // Handle error visual?
        }
        setActions(newActions);
    }

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave({
            fromStateId,
            toStateId,
            triggerType,
            triggerEvent: triggerType === 'EVENT' ? triggerEvent : null,
            timeoutMinutes: triggerType === 'TIME' ? parseInt(timeoutMinutes) : null,
            actions
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold">{initialData ? 'Edit Transition' : 'Create Transition'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Trigger Type</label>
                            <select
                                value={triggerType}
                                onChange={(e) => setTriggerType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="EVENT">System Event</option>
                                <option value="TIME">Time Delay</option>
                            </select>
                        </div>

                        {triggerType === 'EVENT' ? (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Event</label>
                                <select
                                    value={triggerEvent}
                                    onChange={(e) => setTriggerEvent(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    {EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Minutes after Entry</label>
                                <input
                                    type="number"
                                    value={timeoutMinutes}
                                    onChange={(e) => setTimeoutMinutes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="e.g. 60"
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-900">Actions</label>
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

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-1">
                                            <label className="text-xs text-gray-500 block mb-1">Type</label>
                                            <select
                                                value={action.type}
                                                onChange={(e) => updateAction(idx, 'type', e.target.value)}
                                                className="w-full text-sm border-gray-300 rounded-md"
                                            >
                                                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 block mb-1">Config (JSON)</label>
                                            <input
                                                type="text"
                                                defaultValue={JSON.stringify(action.config)}
                                                onBlur={(e) => updateActionConfig(idx, e.target.value)}
                                                className="w-full text-xs font-mono border-gray-300 rounded-md bg-gray-50"
                                                placeholder='{"text": "Hello"}'
                                            />
                                        </div>
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
