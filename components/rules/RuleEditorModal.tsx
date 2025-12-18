'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { RuleBasicInfoSection } from './RuleBasicInfoSection';
import { RuleConditionsSection } from './RuleConditionsSection';
import { RuleActionsSection } from './RuleActionsSection';

interface RuleEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule?: any; // If null, create mode
    onSave: (ruleData: any) => Promise<void>;
    existingGroups?: string[];
}

export function RuleEditorModal({ open, onOpenChange, rule, onSave, existingGroups = [] }: RuleEditorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        code: '',
        description: '',
        group: 'General',
        trigger: 'GENERATION_COMPLETED',
        priority: 0,
        isActive: true,
        conditions: [],
        actions: []
    });
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    const [fsmStates, setFsmStates] = useState<any[]>([]);
    const [overlayCodes, setOverlayCodes] = useState<string[]>([]);

    useEffect(() => {
        fetchPackages();
        fetchFSMStates();
        fetchOverlayCodes();
    }, []);

    const fetchFSMStates = async () => {
        try {
            const res = await fetch('/admin/api/fsm/states');
            if (res.ok) {
                const data = await res.json();
                setFsmStates(data);
            }
        } catch (e) {
            console.error("Failed to load FSM states", e);
        }
    };

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/credits/packages');
            if (res.ok) {
                const data = await res.json();
                setAvailablePackages(data);
            }
        } catch (e) {
            console.error("Failed to load packages", e);
        }
    };

    const fetchOverlayCodes = async () => {
        try {
            const res = await fetch('/admin/api/overlays/codes');
            if (res.ok) {
                const data = await res.json();
                setOverlayCodes(data.codes);
            }
        } catch (e) {
            console.error("Failed to load overlay codes", e);
        }
    };

    useEffect(() => {
        if (open) {
            if (rule) {
                setFormData({
                    code: rule.code,
                    description: rule.description || '',
                    group: rule.group || 'General',
                    trigger: rule.trigger,
                    priority: rule.priority,
                    isActive: rule.isActive,
                    conditions: rule.conditions || [],
                    actions: rule.actions ? [...rule.actions].sort((a: any, b: any) => a.order - b.order) : []
                });
            } else {
                setFormData({
                    code: `RULE_${Date.now()}`, // Default unique code
                    description: '',
                    group: 'General',
                    trigger: 'GENERATION_COMPLETED',
                    priority: 0,
                    isActive: true,
                    conditions: [],
                    actions: []
                });
            }
        }
    }, [open, rule]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Re-assign orders based on array index before saving
            const actionsWithOrder = formData.actions.map((a: any, index: number) => ({
                ...a,
                order: index
            }));
            await onSave({ ...formData, actions: actionsWithOrder });
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            alert('Failed to save rule');
        } finally {
            setLoading(false);
        }
    };

    // --- Conditions Helper ---
    const addCondition = () => {
        setFormData({
            ...formData,
            conditions: [...formData.conditions, { field: 'credits', operator: 'EQUALS', value: '', groupId: 0 }]
        });
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...formData.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setFormData({ ...formData, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        setFormData({
            ...formData,
            conditions: formData.conditions.filter((_: any, i: number) => i !== index)
        });
    };

    // --- Actions Helper ---
    const addAction = () => {
        setFormData({
            ...formData,
            actions: [...formData.actions, { type: 'ACTIVATE_OVERLAY', params: { type: 'TRIPWIRE' }, order: formData.actions.length }]
        });
    };

    const moveAction = (index: number, direction: 'up' | 'down') => {
        const newActions = [...formData.actions];
        if (direction === 'up' && index > 0) {
            [newActions[index], newActions[index - 1]] = [newActions[index - 1], newActions[index]];
        } else if (direction === 'down' && index < newActions.length - 1) {
            [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
        }
        setFormData({ ...formData, actions: newActions });
    };

    const updateAction = (index: number, field: string, value: any) => {
        const newActions = [...formData.actions];

        // When type changes, reset params to reasonable defaults
        if (field === 'type') {
            let defaultParams = {};
            switch (value) {
                case 'ACTIVATE_OVERLAY': defaultParams = { type: 'TRIPWIRE' }; break;
                case 'DEACTIVATE_OVERLAY': defaultParams = { type: 'TRIPWIRE' }; break;
                case 'EMIT_EVENT': defaultParams = { event: 'CUSTOM_EVENT', payload: {} }; break;
                case 'TAG_USER': defaultParams = { tag: '' }; break;
                case 'LOG_EVENT': defaultParams = { message: '' }; break;
                case 'NO_OP': defaultParams = { comment: '' }; break;
            }
            newActions[index] = { ...newActions[index], type: value, params: defaultParams };
        } else {
            newActions[index] = { ...newActions[index], [field]: value };
        }

        setFormData({ ...formData, actions: newActions });
    };

    const updateActionParam = (index: number, paramKey: string, paramValue: any) => {
        const newActions = [...formData.actions];
        const currentParams = newActions[index].params || {};
        newActions[index].params = { ...currentParams, [paramKey]: paramValue };
        setFormData({ ...formData, actions: newActions });
    };

    const updateActionParamsJSON = (index: number, jsonString: string) => {
        try {
            const params = JSON.parse(jsonString);
            updateAction(index, 'params', params);
        } catch (e) {
            // ignore invalid json during typing
        }
    };

    const removeAction = (index: number) => {
        const newActions = formData.actions.filter((_: any, idx: number) => idx !== index);
        setFormData({ ...formData, actions: newActions });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Basic Info */}
                    <RuleBasicInfoSection
                        formData={formData}
                        setFormData={setFormData}
                        existingGroups={existingGroups}
                    />

                    {/* Conditions */}
                    <RuleConditionsSection
                        conditions={formData.conditions}
                        onAdd={addCondition}
                        onUpdate={updateCondition}
                        onRemove={removeCondition}
                        fsmStates={fsmStates}
                        overlayCodes={overlayCodes}
                    />

                    {/* Actions */}
                    <RuleActionsSection
                        actions={formData.actions}
                        onAdd={addAction}
                        onUpdate={updateAction}
                        onUpdateParam={updateActionParam}
                        onUpdateParamsJSON={updateActionParamsJSON}
                        onMove={moveAction}
                        onRemove={removeAction}
                        availablePackages={availablePackages}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? 'Saving...' : 'Save Rule'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
