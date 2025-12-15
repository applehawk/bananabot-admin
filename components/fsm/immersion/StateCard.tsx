import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Users, Play, Loader2 } from 'lucide-react';
import { StateStat, UserDetail } from './types';
import { UsersListModal } from './UsersListModal';

interface StateCardProps {
    state: StateStat;
    availablePackages: any[];
    onRefreshStats: () => void;
}

export function StateCard({ state, availablePackages, onRefreshStats }: StateCardProps) {
    const [users, setUsers] = useState<UserDetail[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [processLoading, setProcessLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`/admin/api/fsm/states/${state.stateId}/users?limit=50`);
            const data = await res.json();
            setUsers(data.users || []);
        } catch (e) {
            console.error(e);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (open) {
            fetchUsers();
        }
    };

    const handleProcessState = async () => {
        if (!confirm("Force transition checks for all users in this state?")) return;
        setProcessLoading(true);
        try {
            const res = await fetch(`/admin/api/fsm/states/${state.stateId}/process`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Processed. ${data.message || ''}`);
                onRefreshStats();
            }
        } catch (e) {
            alert('Error processing state');
        } finally {
            setProcessLoading(false);
        }
    };

    return (
        <Card className={`relative overflow-hidden bg-white border ${state.isTerminal ? 'bg-gray-50' : ''} ${state.isInitial ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold flex justify-between text-gray-900">
                    <span>{state.name}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">{state.count}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between mt-4">
                    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                <Users className="mr-2 h-4 w-4" /> Users
                            </Button>
                        </DialogTrigger>

                        {/* 
                          Note: We render UsersListModal as the CONTENT logic. 
                          It renders DialogContent itself inside?
                          Wait, my UsersListModal implementation renders DialogContent.
                          Yes, correct. UsersListModal returns <DialogContent>...</DialogContent>.
                        */}
                        {dialogOpen && (
                            <UsersListModal
                                users={users}
                                loading={usersLoading}
                                stateName={state.name}
                                availablePackages={availablePackages}
                            />
                        )}
                    </Dialog>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleProcessState}
                        disabled={processLoading}
                        className="bg-gray-100 text-gray-900 hover:bg-gray-200"
                    >
                        {processLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
