import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Users } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserDetail } from './types';
import { ActionExecutionModal } from './ActionExecutionModal';

interface UsersListModalProps {
    users: UserDetail[];
    loading: boolean;
    stateName: string;
    availablePackages: any[];
    children?: React.ReactNode; // Trigger
}

export function UsersListModal({
    users,
    loading,
    stateName,
    availablePackages,
    children
}: UsersListModalProps) {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    // Action Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<string>('SEND_MESSAGE');
    const [actionConfig, setActionConfig] = useState<any>({});
    const [actionLoading, setActionLoading] = useState(false);

    // Context Modal State
    const [contextUser, setContextUser] = useState<any>(null);
    const [contextLoading, setContextLoading] = useState(false);

    // Reset selection when modal might close / reopen? 
    // Ideally we'd reset when the parent Dialog opens/closes, but we don't have that signal easily here unless we check 'users' change.
    useEffect(() => {
        setSelectedUserIds(new Set());
    }, [users]);

    const toggleUser = (userId: string) => {
        const next = new Set(selectedUserIds);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        setSelectedUserIds(next);
    };

    const toggleAll = () => {
        if (selectedUserIds.size === users.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(users.map(u => u.userId)));
        }
    };

    const handleExecuteAction = async () => {
        if (selectedUserIds.size === 0) return;
        if (!confirm(`Execute ${actionType} for ${selectedUserIds.size} users?`)) return;

        setActionLoading(true);
        try {
            // Extract and Parse Conditions
            let conditions = undefined;
            const configToSend = { ...actionConfig };
            if (configToSend.conditions) {
                try {
                    conditions = typeof configToSend.conditions === 'string'
                        ? JSON.parse(configToSend.conditions)
                        : configToSend.conditions;
                    delete configToSend.conditions;
                } catch (e) {
                    alert('Invalid JSON in Conditions field');
                    setActionLoading(false);
                    return;
                }
            }

            const res = await fetch('/admin/api/fsm/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: Array.from(selectedUserIds),
                    action: actionType,
                    config: configToSend,
                    conditions
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Action executed! Success: ${data.successCount}, Failed: ${data.failCount}`);
                setActionModalOpen(false);
                setSelectedUserIds(new Set());
                setActionConfig({});
            } else {
                alert('Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to execute action');
        } finally {
            setActionLoading(false);
        }
    };

    const openContextModal = async (userId: string) => {
        setContextLoading(true);
        setContextUser(null);
        try {
            const res = await fetch(`/admin/api/fsm/users/${userId}/context`);
            const data = await res.json();
            setContextUser(data);
        } catch (e) {
            console.error(e);
        } finally {
            setContextLoading(false);
        }
    };

    return (
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row justify-between items-center">
                <DialogTitle>Users in {stateName}</DialogTitle>

                <div className="flex gap-2">
                    {selectedUserIds.size > 0 && (
                        <ActionExecutionModal
                            open={actionModalOpen}
                            onOpenChange={setActionModalOpen}
                            trigger={
                                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                                    Actions ({selectedUserIds.size})
                                </Button>
                            }
                            selectedCount={selectedUserIds.size}
                            actionType={actionType}
                            setActionType={setActionType}
                            actionConfig={actionConfig}
                            setActionConfig={setActionConfig}
                            availablePackages={availablePackages}
                            loading={actionLoading}
                            onExecute={handleExecuteAction}
                        />
                    )}
                </div>
            </DialogHeader>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <input type="checkbox" onChange={toggleAll} checked={users.length > 0 && selectedUserIds.size === users.length} />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Overlays</TableHead>
                            <TableHead>Entered</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.userId}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.has(u.userId)}
                                        onChange={() => toggleUser(u.userId)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{u.username}</div>
                                    <div className="text-xs text-muted-foreground">{u.userId}</div>
                                </TableCell>
                                <TableCell>{u.credits}</TableCell>
                                <TableCell>{new Date(u.lastActiveAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {u.activeOverlays?.length ? u.activeOverlays.map((o: any) => (
                                            <Badge key={typeof o === 'string' ? o : o.type} variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-800">
                                                {typeof o === 'string' ? o : o.type}
                                            </Badge>
                                        )) : <span className="text-muted-foreground text-xs">-</span>}
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(u.enteredStateAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => openContextModal(u.userId)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>User Context</DialogTitle>
                                            </DialogHeader>
                                            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[60vh]">
                                                {contextLoading ? <Loader2 className="animate-spin" /> : (
                                                    <pre className="text-xs">{JSON.stringify(contextUser, null, 2)}</pre>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </DialogContent>
    );
}
