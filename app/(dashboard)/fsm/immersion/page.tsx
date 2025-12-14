'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, Users, Play, Info, Eye } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface StateStat {
    stateId: string;
    name: string;
    count: number;
    isTerminal: boolean;
    isInitial: boolean;
}

interface UserDetail {
    userId: string;
    username: string;
    fullName: string;
    credits: number;
    lastActiveAt: string;
    enteredStateAt: string;
    activeOverlays: string[];
}

export default function FSMImmersionPage() {
    const [stats, setStats] = useState<StateStat[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [versionId, setVersionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [immersionLoading, setImmersionLoading] = useState(false);
    const [processLoading, setProcessLoading] = useState<string | null>(null); // stateId

    // Global Toggle
    const [isFsmEnabled, setIsFsmEnabled] = useState(false);

    // Modal State
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [modalUsers, setModalUsers] = useState<UserDetail[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Context Modal
    const [contextUser, setContextUser] = useState<any>(null);
    const [contextLoading, setContextLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchSettings();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/api/fsm/stats');
            const data = await res.json();
            if (data.stateDistribution) {
                setStats(data.stateDistribution);
                setTotalUsers(data.totalActiveUsers);
                setVersionId(data.versionId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        // We assume we can get this from a general settings endpoint, or we assume default.
        // For now, let's treat the toggle state as optimistic or fetched if possible.
        // Since we don't have a GET for toggle yet, we might need one.
        // Let's assume false initially.
    };

    const handleImmersion = async () => {
        if (!confirm("This will replay history for users and reset their FSM state. Continue?")) return;
        setImmersionLoading(true);
        try {
            const res = await fetch('/admin/api/fsm/immersion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Immersion started/completed. Processed: ${data.processed}`);
                fetchStats();
            }
        } catch (e) {
            alert('Error during immersion');
        } finally {
            setImmersionLoading(false);
        }
    };

    const handleProcessState = async (stateId: string) => {
        if (!confirm("Force transition checks for all users in this state?")) return;
        setProcessLoading(stateId);
        try {
            const res = await fetch(`/admin/api/fsm/states/${stateId}/process`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Processed. ${data.message || ''}`);
                fetchStats();
            }
        } catch (e) {
            alert('Error processing state');
        } finally {
            setProcessLoading(null);
        }
    };

    const handleToggleFsm = async (enabled: boolean) => {
        setIsFsmEnabled(enabled); // Optimistic
        try {
            await fetch('/admin/api/settings/fsm-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
        } catch (e) {
            console.error(e);
            setIsFsmEnabled(!enabled); // Revert
        }
    };

    const openUsersModal = async (stateId: string) => {
        setSelectedState(stateId);
        setModalLoading(true);
        try {
            // For now limit to 50
            const res = await fetch(`/admin/api/fsm/states/${stateId}/users?limit=50`);
            const data = await res.json();
            setModalUsers(data.users || []);
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">FSM Live View</h1>
                            <p className="mt-1 text-sm text-gray-500">Monitor and control user flow via FSM</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2 border p-2 rounded-lg bg-gray-50">
                                <Switch id="fsm-mode" checked={isFsmEnabled} onCheckedChange={handleToggleFsm} />
                                <label htmlFor="fsm-mode" className="text-sm font-medium text-gray-700">Global FSM Enable</label>
                            </div>

                            <Button onClick={handleImmersion} disabled={immersionLoading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                {immersionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Run Immersion
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stats.map(state => (
                            <Card key={state.stateId} className={`relative overflow-hidden bg-white border ${state.isTerminal ? 'bg-gray-50' : ''} ${state.isInitial ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-semibold flex justify-between text-gray-900">
                                        <span>{state.name}</span>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">{state.count}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between mt-4">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => openUsersModal(state.stateId)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                                    <Users className="mr-2 h-4 w-4" /> Users
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Users in {state.name}</DialogTitle>
                                                </DialogHeader>
                                                {modalLoading ? (
                                                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>User</TableHead>
                                                                <TableHead>Credits</TableHead>
                                                                <TableHead>Active</TableHead>
                                                                <TableHead>Overlays</TableHead>
                                                                <TableHead>Entered</TableHead>
                                                                <TableHead>Action</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {modalUsers.map(u => (
                                                                <TableRow key={u.userId}>
                                                                    <TableCell>
                                                                        <div className="font-medium">{u.username}</div>
                                                                        <div className="text-xs text-muted-foreground">{u.userId}</div>
                                                                    </TableCell>
                                                                    <TableCell>{u.credits}</TableCell>
                                                                    <TableCell>{new Date(u.lastActiveAt).toLocaleDateString()}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {u.activeOverlays?.length ? u.activeOverlays.map(o => (
                                                                                <Badge key={o} variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-800">
                                                                                    {o}
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
                                        </Dialog>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleProcessState(state.stateId)}
                                            disabled={processLoading === state.stateId}
                                            className="bg-gray-100 text-gray-900 hover:bg-gray-200"
                                        >
                                            {processLoading === state.stateId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {!loading && stats.length === 0 && (
                        <Alert className="bg-white border-blue-200">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertTitle className="text-blue-700">No FSM Data</AlertTitle>
                            <AlertDescription className="text-blue-600">No active version or users found. Try running Immersion.</AlertDescription>
                        </Alert>
                    )}
                </div>
            </main>
        </div>
    );
}
