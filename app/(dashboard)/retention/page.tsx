'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

type RetentionStage = {
    id: string;
    order: number;
    name: string;
    message: string;
    hoursSinceRegistration?: number;
    hoursSinceLastActivity?: number;
    hoursSinceLastStage?: number;
    isActive: boolean;
};

type Stats = {
    stageName: string;
    order: number;
    count: number;
};

export default function RetentionPage() {
    const [loading, setLoading] = useState(true);
    const [stages, setStages] = useState<RetentionStage[]>([]);
    const [stats, setStats] = useState<Stats[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<RetentionStage | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch stats & settings
            const statsRes = await fetch('/admin/api/retention/stats');
            const statsData = await statsRes.json();
            setStats(statsData.stats || []);
            setIsEnabled(statsData.isRetentionEnabled || false);

            // Fetch stages
            const stagesRes = await fetch('/admin/api/retention/stages');
            const stagesData = await stagesRes.json();
            setStages(stagesData || []);

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRetention = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        setIsEnabled(enabled);
        await fetch('/admin/api/retention/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
    };

    const handleSaveStage = async (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to save stage
        const formData = new FormData(e.target as HTMLFormElement);
        const data: any = Object.fromEntries(formData.entries());

        // Convert to numbers or null
        data.hoursSinceRegistration = data.hoursSinceRegistration ? parseInt(data.hoursSinceRegistration) : null;
        data.hoursSinceLastActivity = data.hoursSinceLastActivity ? parseInt(data.hoursSinceLastActivity) : null;
        data.hoursSinceLastStage = data.hoursSinceLastStage ? parseInt(data.hoursSinceLastStage) : null;
        data.order = parseInt(data.order);
        data.isActive = true; // Default to true

        const method = editingStage ? 'PUT' : 'POST';
        const body = editingStage ? { ...data, id: editingStage.id } : data;

        await fetch('/admin/api/retention/stages', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        setIsModalOpen(false);
        setEditingStage(null);
        fetchData();
    };

    const handleDeleteStage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this stage?')) return;
        await fetch(`/admin/api/retention/stages?id=${id}`, { method: 'DELETE' });
        fetchData();
    }

    const openNewStageModal = () => {
        setEditingStage(null);
        setIsModalOpen(true);
    }

    const openEditStageModal = (stage: RetentionStage) => {
        setEditingStage(stage);
        setIsModalOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Retention & Marketing</h2>
                    <p className="text-gray-500">Manage automated "Burn Down" campaigns and retention messaging.</p>
                </div>
                <div className="flex items-center gap-4">
                    <label htmlFor="retention-mode" className="text-lg font-medium text-gray-700">System Enabled</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="retention-mode"
                            className="sr-only peer"
                            checked={isEnabled}
                            onChange={toggleRetention}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.order} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-gray-500">{stat.stageName}</h3>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stat.count} users</div>
                            <p className="text-xs text-gray-400">Currently in this stage</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex flex-row items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Retention Stages</h3>
                    <button
                        onClick={openNewStageModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Stage
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggers</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message Preview</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stages.map((stage) => (
                                <tr key={stage.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.order}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stage.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {stage.hoursSinceRegistration !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Reg +{stage.hoursSinceRegistration}h</span>}
                                            {stage.hoursSinceLastActivity !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active +{stage.hoursSinceLastActivity}h</span>}
                                            {stage.hoursSinceLastStage !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Stage +{stage.hoursSinceLastStage}h</span>}
                                            {!stage.hoursSinceRegistration && !stage.hoursSinceLastActivity && !stage.hoursSinceLastStage && <span className="text-red-500">No triggers</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{stage.message}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {stage.isActive
                                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditStageModal(stage)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                            <button onClick={() => handleDeleteStage(stage.id)} className="text-red-600 hover:text-red-900 flex items-center"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">{editingStage ? 'Edit Stage' : 'Create New Stage'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Configure details and triggers. Triggers use AND logic if multiple are set.</p>

                            <form onSubmit={handleSaveStage} className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="name" className="text-right text-sm font-medium text-gray-700">Name</label>
                                    <input id="name" name="name" defaultValue={editingStage?.name} className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="order" className="text-right text-sm font-medium text-gray-700">Order</label>
                                    <input id="order" name="order" type="number" defaultValue={editingStage?.order || (stages.length > 0 ? Math.max(...stages.map(s => s.order)) + 1 : 1)} className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" required />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <label htmlFor="message" className="text-right text-sm font-medium text-gray-700 pt-2">Message</label>
                                    <textarea id="message" name="message" defaultValue={editingStage?.message} className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" required rows={4} />
                                </div>

                                <div className="border-t pt-4 mt-2">
                                    <h4 className="mb-4 font-semibold text-gray-900">Triggers (Hours)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">Since Registration</label>
                                            <input name="hoursSinceRegistration" type="number" defaultValue={editingStage?.hoursSinceRegistration || ''} placeholder="e.g. 2" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">Since Last Activity</label>
                                            <input name="hoursSinceLastActivity" type="number" defaultValue={editingStage?.hoursSinceLastActivity || ''} placeholder="e.g. 24" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">Since Last Stage</label>
                                            <input name="hoursSinceLastStage" type="number" defaultValue={editingStage?.hoursSinceLastStage || ''} placeholder="e.g. 12" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm">Cancel</button>
                                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm">
                                        <Save className="mr-2 h-4 w-4" /> Save Stage
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
