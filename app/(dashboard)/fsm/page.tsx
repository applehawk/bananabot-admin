'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Copy, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface FSMVersion {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        states: number;
        transitions: number;
    }
}

export default function FSMPage() {
    const [versions, setVersions] = useState<FSMVersion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVersions = async () => {
        try {
            const res = await fetch('/api/fsm/versions');
            if (res.ok) {
                const data = await res.json();
                setVersions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, []);

    const handleCreate = async () => {
        // TODO: Implement Create Modal
        const name = prompt("Enter version name (e.g. v1.1.0):");
        if (!name) return;

        try {
            const res = await fetch('/api/fsm/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) fetchVersions();
        } catch (e) { console.error(e); }
    };

    const handleActivate = async (id: number) => {
        if (!confirm("Are you sure you want to activate this version? This will deactivate all others.")) return;

        try {
            const res = await fetch(`/api/fsm/versions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true })
            });
            if (res.ok) fetchVersions();
        } catch (e) { console.error(e); }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">FSM Architecture</h1>
                    <p className="text-muted-foreground">Manage bot behavior states and transitions</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Version
                </button>
            </div>

            <div className="grid gap-6">
                {versions.map((version) => (
                    <Card key={version.id} className={version.isActive ? "border-blue-500" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {version.name}
                                    {version.isActive && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Created {format(new Date(version.createdAt), 'PP')}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {!version.isActive && (
                                    <button
                                        onClick={() => handleActivate(version.id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Set Active
                                    </button>
                                )}
                                <Link href={`/fsm/${version.id}`}>
                                    <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-900 hover:bg-gray-800">
                                        <Edit className="mr-2 h-4 w-4" /> Editor
                                    </button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-8 text-sm text-gray-400 mt-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-2xl text-foreground">{version._count.states}</span>
                                    <span>States</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-2xl text-foreground">{version._count.transitions}</span>
                                    <span>Transitions</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {versions.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">
                        No versions found. Create one directly or run seed script.
                    </div>
                )}
            </div>
        </div>
    );
}
