'use client';

import { useState, useEffect } from 'react';
// Card imports removed
import { Plus, Edit, Copy, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import UserDistributionChart from '@/components/fsm/UserDistributionChart';

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
            const res = await fetch('/admin/api/fsm/versions');
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
            const res = await fetch('/admin/api/fsm/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                fetchVersions();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Failed to create version", res.status, errData);
                alert(`Failed to create version: ${errData.error || res.statusText}`);
            }
        } catch (e) {
            console.error("Error creating version:", e);
            alert(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleActivate = async (id: number) => {
        if (!confirm("Are you sure you want to activate this version? This will deactivate all others.")) return;

        try {
            const res = await fetch(`/admin/api/fsm/versions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true })
            });
            if (res.ok) fetchVersions();
        } catch (e) { console.error(e); }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this version? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/admin/api/fsm/versions/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchVersions();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to delete version: ${errData.error || res.statusText}`);
            }
        } catch (e) {
            console.error("Error deleting version:", e);
            alert("Failed to delete version");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">FSM Architecture</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage bot behavior states and transitions</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Version
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 bg-white p-6 rounded-lg shadow border border-gray-200">
                    <UserDistributionChart />
                </div>

                <div className="grid gap-6">
                    {versions.map((version) => (
                        <div key={version.id} className={`bg-white rounded-lg shadow overflow-hidden border ${version.isActive ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                            <div className="px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                        {version.name}
                                        {version.isActive && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Created {format(new Date(version.createdAt), 'PP')}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!version.isActive && (
                                        <>
                                            <button
                                                onClick={() => handleActivate(version.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Set Active
                                            </button>
                                            <button
                                                onClick={() => handleDelete(version.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </button>
                                        </>
                                    )}
                                    <Link href={`/fsm/${version.id}`}>
                                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                                            <Edit className="mr-2 h-4 w-4" /> Editor
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <div className="flex gap-12 text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-3xl text-gray-900">{version._count.states}</span>
                                        <span className="uppercase tracking-wider text-xs font-medium">States</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-3xl text-gray-900">{version._count.transitions}</span>
                                        <span className="uppercase tracking-wider text-xs font-medium">Transitions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {versions.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <Plus className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No versions</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new FSM version.</p>
                            <div className="mt-6">
                                <button
                                    onClick={handleCreate}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    New Version
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
