'use client';
import { useState, useEffect } from 'react';
import { RuleEditorModal } from '@/components/rules/RuleEditorModal';
import { RulesPageHeader } from '@/components/rules/RulesPageHeader';
import { RulesTable } from '@/components/rules/RulesTable';
import { RuleSimulatorModal } from '@/components/rules/RuleSimulatorModal';

interface Rule {
    id: string;
    code: string;
    trigger: string;
    description: string;
    priority: number;
    isActive: boolean;
    group?: { id: string; name: string } | null;
    conditions: any[];
    actions: any[];
}

export default function RulesPage() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [simulatorOpen, setSimulatorOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | undefined>(undefined);

    // Filtering State
    const [searchText, setSearchText] = useState('');
    const [triggerFilter, setTriggerFilter] = useState('');

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/api/rules');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort by priority (descending usually, or ascending depending on rule engine logic)
                // Assuming higher priority executes first or overrides. 
                // Let's assume Descending Priority (100 -> 1).
                setRules(data.sort((a: Rule, b: Rule) => b.priority - a.priority));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const filteredRules = rules.filter(r => {
        const matchesSearch = searchText === '' ||
            r.code.toLowerCase().includes(searchText.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(searchText.toLowerCase()));

        const matchesTrigger = triggerFilter === '' || r.trigger === triggerFilter;

        return matchesSearch && matchesTrigger;
    });

    const handleCreate = () => {
        setSelectedRule(undefined);
        setModalOpen(true);
    };

    const handleEdit = (rule: Rule) => {
        setSelectedRule(rule);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await fetch(`/admin/api/rules/${id}`, { method: 'DELETE' });
            fetchRules();
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const handleDuplicate = (rule: Rule) => {
        const duplicatedRule = {
            ...rule,
            id: '', // Empty ID signals creation
            code: `${rule.code}_COPY_${Date.now().toString().slice(-4)}`,
            description: rule.description ? `${rule.description} (Copy)` : '(Copy)'
        };
        setSelectedRule(duplicatedRule);
        setModalOpen(true);
    };

    const handleSave = async (ruleData: any) => {
        // Updated logic to check if ID exists (handling empty string for Duplicate/Create)
        const isEdit = selectedRule && selectedRule.id;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/admin/api/rules/${selectedRule.id}` : '/admin/api/rules';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ruleData)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save');
        }
        fetchRules();
    };

    const handleReorder = async (reorderedRules: Rule[]) => {
        // Calculate new priorities (Top = Highest = Length of array)
        const updatedRules = reorderedRules.map((r, index) => ({
            ...r,
            priority: reorderedRules.length - index
        }));

        // Optimistic UI Update with new priorities
        setRules(updatedRules);

        try {
            // Bulk update via Promise.all
            // Bulk update via Promise.all
            await Promise.all(updatedRules.map(u => {
                const isTempGroup = u.group?.id?.startsWith('temp');
                const body: any = { priority: u.priority };

                if (isTempGroup) {
                    body.group = u.group?.name;
                } else {
                    body.groupId = u.group?.id ?? null;
                }

                return fetch(`/admin/api/rules/${u.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }));
        } catch (e) {
            console.error("Failed to reorder", e);
            alert("Failed to save new order");
            fetchRules(); // Revert to server state on error
        }
    };

    // Calculate unique groups for autocomplete
    const uniqueGroups = Array.from(new Set(rules.map(r => r.group?.name || 'General'))).sort();

    const handleRenameGroup = async (groupId: string, newName: string) => {
        try {
            await fetch(`/admin/api/groups/${groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            fetchRules();
        } catch (e) {
            console.error("Failed to rename group", e);
            alert("Failed to rename group");
        }
    };

    const handleCreateGroup = async (ruleId: string, groupName: string) => {
        try {
            // Implicitly create group via Rule update
            await fetch(`/admin/api/rules/${ruleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group: groupName })
            });
            fetchRules();
        } catch (e) {
            console.error("Failed to create group", e);
            alert("Failed to create group");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <RulesPageHeader
                onCreateRule={handleCreate}
                onSimulate={() => setSimulatorOpen(true)}
                searchText={searchText}
                onSearchChange={setSearchText}
                triggerFilter={triggerFilter}
                onTriggerFilterChange={setTriggerFilter}
            />
            <RulesTable
                rules={filteredRules}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
                onDuplicate={handleDuplicate}
                onRenameGroup={handleRenameGroup}
                onCreateGroup={handleCreateGroup}
            />
            <RuleEditorModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                rule={selectedRule}
                onSave={handleSave}
                existingGroups={uniqueGroups}
            />
            <RuleSimulatorModal
                open={simulatorOpen}
                onOpenChange={setSimulatorOpen}
            />
        </div>
    );
}
