import { useRef, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Folder, GripVertical } from 'lucide-react';
import { RuleTableRow } from './RuleTableRow';

interface Rule {
    id: string;
    code: string;
    trigger: string;
    description: string;
    priority: number;
    isActive: boolean;
    group?: string | null;
    conditions: any[];
    actions: any[];
}

interface RulesTableProps {
    rules: Rule[];
    loading: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
    onReorder?: (rules: Rule[]) => void;
    onDuplicate?: (rule: Rule) => void;
}

export function RulesTable({ rules, loading, onEdit, onDelete, onReorder, onDuplicate }: RulesTableProps) {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Grouping
    const groupedRules = useMemo(() => {
        const groups: Record<string, Rule[]> = {};
        rules.forEach(r => {
            const g = r.group || 'General';
            if (!groups[g]) groups[g] = [];
            groups[g].push(r);
        });
        // Sort groups alphabetically or by custom order if needed
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [rules]);


    const handleDragStart = (e: React.DragEvent, position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e: React.DragEvent, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        if (dragItem.current === null || dragOverItem.current === null) return;

        const _rules = [...rules];
        const draggedItemContent = _rules[dragItem.current];
        _rules.splice(dragItem.current, 1);
        _rules.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        onReorder?.(_rules);
    };

    // Helper to find global index
    const getGlobalIndex = (ruleId: string) => rules.findIndex(r => r.id === ruleId);

    if (loading) {
        return (
            <div className="bg-white rounded-md border shadow-sm p-8 flex justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
            </div>
        );
    }

    if (rules.length === 0) {
        return (
            <div className="bg-white rounded-md border shadow-sm p-8 text-center text-muted-foreground">
                No rules defined.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groupedRules.map(([groupName, groupRules]) => (
                <div key={groupName} className="bg-white rounded-md border shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-sm text-gray-700">{groupName}</span>
                        <span className="text-xs text-gray-400">({groupRules.length})</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Status</TableHead>
                                <TableHead>Code / Description</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Conditions</TableHead>
                                <TableHead>Actions</TableHead>
                                <TableHead className="text-right">Priority</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupRules.map((rule) => {
                                const globalIndex = getGlobalIndex(rule.id);
                                return (
                                    <RuleTableRow
                                        key={rule.id}
                                        rule={rule}
                                        index={globalIndex}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        draggable={!!onReorder}
                                        onDragStart={handleDragStart}
                                        onDragOver={(e, idx) => {
                                            handleDragOver(e);
                                            handleDragEnter(e, idx);
                                        }}
                                        onDrop={handleDrop}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            ))}
        </div>
    );
}
