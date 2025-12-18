'use client';
import { useRef, useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Folder, GripVertical, Plus, Check, X, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RuleTableRow } from './RuleTableRow';

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

interface RulesTableProps {
    rules: Rule[];
    loading: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
    onReorder?: (rules: Rule[]) => void;
    onDuplicate?: (rule: Rule) => void;
    onRenameGroup?: (groupId: string, newName: string) => Promise<void>;
    onCreateGroup?: (ruleId: string, groupName: string) => Promise<void>;
}

export function RulesTable({ rules, loading, onEdit, onDelete, onReorder, onDuplicate, onRenameGroup, onCreateGroup }: RulesTableProps) {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Group Renaming State
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [tempGroupName, setTempGroupName] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when editing starts
    useEffect(() => {
        if (editingGroupId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingGroupId]);

    // Grouping
    const groupedRules = useMemo(() => {
        const groups: Record<string, { id: string; name: string; rules: Rule[] }> = {};

        rules.forEach(rule => {
            const id = rule.group?.id ?? 'general';
            const name = rule.group?.name ?? 'General';

            if (!groups[id]) {
                groups[id] = { id, name, rules: [] };
            }

            groups[id].rules.push(rule);
        });

        // Sort groups: General last, others alphabetically
        return Object.values(groups).sort((a, b) => {
            if (a.id === 'general') return 1;
            if (b.id === 'general') return -1;
            return a.name.localeCompare(b.name);
        });
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

    const handleDropOnNewGroup = (e: React.DragEvent) => {
        e.preventDefault();
        if (dragItem.current === null) return;

        const draggedItemIndex = dragItem.current;
        const _rules = [...rules];
        const draggedItem = _rules[draggedItemIndex];

        // Create new group
        const newGroupName = "New Group";
        const tempGroupId = 'temp-new-' + Date.now(); // Ensure unique ID for optimistic update

        // Optimistic UI - Immutable update
        const updatedRule = {
            ...draggedItem,
            group: { id: tempGroupId, name: newGroupName }
        };

        _rules[draggedItemIndex] = updatedRule;

        // Trigger Parent Action
        if (onCreateGroup) {
            onCreateGroup(draggedItem.id, newGroupName);
        }

        onReorder?.(_rules);

        // Start editing immediately
        setEditingGroupId(tempGroupId);
        setTempGroupName(newGroupName);
        dragItem.current = null;
    };

    const saveGroupName = (groupId: string, oldName: string) => {
        if (!tempGroupName.trim() || tempGroupName === oldName) {
            setEditingGroupId(null);
            return;
        }

        if (groupId && onRenameGroup && !groupId.startsWith('temp')) {
            onRenameGroup(groupId, tempGroupName);
        }

        // Immutable update for UI
        const _rules = rules.map(r => {
            if (r.group?.id === groupId) {
                return { ...r, group: { ...r.group!, name: tempGroupName } };
            }
            return r;
        });

        onReorder?.(_rules);
        setEditingGroupId(null);
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
            {groupedRules.map((group) => (
                <div key={group.id} className="bg-white rounded-md border shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2 group/header">
                        <Folder className="h-4 w-4 text-gray-500" />

                        {editingGroupId === group.id ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={editInputRef}
                                    value={tempGroupName}
                                    onChange={(e) => setTempGroupName(e.target.value)}
                                    className="h-7 w-[200px] text-sm rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveGroupName(group.id, group.name);
                                        if (e.key === 'Escape') setEditingGroupId(null);
                                    }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => saveGroupName(group.id, group.name)}>
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setEditingGroupId(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span
                                    className="font-semibold text-sm text-gray-700 cursor-pointer hover:underline decoration-dashed"
                                    onClick={() => {
                                        if (group.id !== 'general') {
                                            setEditingGroupId(group.id);
                                            setTempGroupName(group.name);
                                        }
                                    }}
                                >
                                    {group.name}
                                </span>
                                {group.id !== 'general' && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 opacity-0 group-hover/header:opacity-100 transition-opacity"
                                        onClick={() => {
                                            setEditingGroupId(group.id);
                                            setTempGroupName(group.name);
                                        }}
                                    >
                                        <Pencil className="h-3 w-3 text-gray-400" />
                                    </Button>
                                )}
                            </div>
                        )}

                        <span className="text-xs text-gray-400">({group.rules.length})</span>
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
                            {group.rules.map((rule) => {
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

            {/* Drop Zone for New Group */}
            {onReorder && (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnNewGroup}
                    className="border-2 border-dashed border-gray-200 rounded-md p-4 flex items-center justify-center gap-3 text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-colors cursor-default"
                >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">Drop rule here to create a new group</span>
                </div>
            )}
        </div >
    );
}

