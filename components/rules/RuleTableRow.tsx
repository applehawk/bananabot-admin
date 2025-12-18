'use client';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, PlayCircle, PauseCircle, GripVertical, Copy, Mail, Tag, Zap, Activity, FileJson } from 'lucide-react';

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

interface RuleTableRowProps {
    rule: Rule;
    index: number;
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
    onDuplicate?: (rule: Rule) => void;

    // DnD Props
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent, index: number) => void;
    onDragOver?: (e: React.DragEvent, index: number) => void;
    onDrop?: (e: React.DragEvent, index: number) => void;
}

const ACTION_ICONS: Record<string, any> = {
    'SEND_MESSAGE': Mail,
    'TAG_USER': Tag,
    'ACTIVATE_OVERLAY': Zap,
    'DEACTIVATE_OVERLAY': Zap,
    'EMIT_EVENT': Activity,
    'LOG_EVENT': FileJson
};

export function RuleTableRow({
    rule,
    index,
    onEdit,
    onDelete,
    onDuplicate,
    draggable,
    onDragStart,
    onDragOver,
    onDrop
}: RuleTableRowProps) {
    return (
        <TableRow
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, index)}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver?.(e, index);
            }}
            onDrop={(e) => onDrop?.(e, index)}
            className={draggable ? "cursor-move hover:bg-gray-50 transition-colors" : ""}
        >
            <TableCell>
                <div className="flex items-center gap-2">
                    {draggable && (
                        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab active:cursor-grabbing" />
                    )}
                    {rule.isActive ? (
                        <PlayCircle className="text-green-500 h-5 w-5" />
                    ) : (
                        <PauseCircle className="text-gray-300 h-5 w-5" />
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="font-semibold text-sm">{rule.code}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{rule.description}</div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="font-mono text-[10px]">{rule.trigger}</Badge>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    {rule.conditions?.length ? rule.conditions.map((c) => {
                        const key = `${c.field}-${c.operator}-${String(c.value)}`;
                        return (
                            <span key={key} className="text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 inline-block w-fit font-mono text-gray-600">
                                <span className="font-semibold">{c.field}</span> {c.operator === 'EQUALS' ? '=' : c.operator} <span className="text-blue-600">{c.value}</span>
                            </span>
                        );
                    }) : <span className="text-xs text-gray-300 italic">Always</span>}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[250px]">
                    {rule.actions?.map((a) => {
                        const Icon = ACTION_ICONS[a.type] || Activity;
                        const key = `${a.type}-${JSON.stringify(a.params)}`;
                        return (
                            <div key={key} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" title={JSON.stringify(a.params)}>
                                <Icon className="h-3 w-3" />
                                <span>{a.type.replace('ACTIVATE_', '').replace('DEACTIVATE_', '').replace('_OVERLAY', '')}</span>
                            </div>
                        )
                    })}
                </div>
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-gray-500">
                {rule.priority}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate Rule" onClick={() => onDuplicate?.(rule)}>
                        <Copy className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(rule)}>
                        <Edit className="h-4 w-4 text-gray-700" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
