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
    // New fields
    isSpecialOffer?: boolean;
    creditPackageId?: string;
    creditPackage?: any;
    specialOfferLabel?: string;
    isRandomGenerationEnabled?: boolean;
    randomGenerationLabel?: string;
    conditionGenerations?: number;
    conditionPaymentPresent?: boolean;
    hoursSinceFirstPayment?: number;
    activeHoursStart?: number;
    activeHoursEnd?: number;
    isActive: boolean;
    buttons?: any;
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

    // Tripwire state
    const [packages, setPackages] = useState<any[]>([]);
    const [tripwireId, setTripwireId] = useState<string>('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<RetentionStage | null>(null);

    // Form UI State
    const [isSpecialOffer, setIsSpecialOffer] = useState(false);
    const [packageMode, setPackageMode] = useState<'existing' | 'custom'>('existing');
    const [isRandomGen, setIsRandomGen] = useState(false);

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
            setPackages(statsData.packages || []);
            setTripwireId(statsData.tripwirePackageId || '');

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

    const handleTripwireChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setTripwireId(newId);
        await fetch('/admin/api/retention/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripwirePackageId: newId })
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

        // Parse buttons if present
        if (data.buttons) {
            try {
                // validation check
                const parsed = JSON.parse(data.buttons);
                if (!Array.isArray(parsed)) throw new Error("Buttons must be an array");
                data.buttons = parsed;
            } catch (e) {
                alert('Invalid JSON for buttons. Must be valid JSON array.');
                return;
            }
        } else {
            data.buttons = null;
        }

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
        setIsSpecialOffer(false);
        setPackageMode('existing');
        setIsRandomGen(false);
        setIsModalOpen(true);
    }

    const openEditStageModal = (stage: RetentionStage) => {
        setEditingStage(stage);
        setIsSpecialOffer(stage.isSpecialOffer || false);
        setPackageMode('existing'); // Default, as we don't know if it was custom originally without more logic, but user can just select existing or create new custom
        setIsRandomGen(stage.isRandomGenerationEnabled || false);
        setIsModalOpen(true);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Retention & Marketing</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage automated "Burn Down" campaigns and retention messaging.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {/* Tripwire Select */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="tripwire-select" className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Tripwire Package:</label>
                                <select
                                    id="tripwire-select"
                                    value={tripwireId}
                                    onChange={handleTripwireChange}
                                    className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5"
                                >
                                    <option value="">-- None --</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({pkg.credits} cr / {pkg.price}₽) {!pkg.active && '(Inactive)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="retention-mode" className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">System Active:</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="retention-mode"
                                        className="sr-only peer"
                                        checked={isEnabled}
                                        onChange={toggleRetention}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Stats Grid */}
                {stats.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.order} className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.stageName}</h3>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">{stat.count}</div>
                                    <p className="text-xs text-gray-400 mt-1">Users currently in this stage</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">Retention Stages</h3>
                        <button
                            onClick={openNewStageModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buttons</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stages.map((stage) => (
                                    <tr key={stage.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{stage.order}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stage.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {stage.hoursSinceRegistration !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Reg +{stage.hoursSinceRegistration}h</span>}
                                                {stage.hoursSinceLastActivity !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active +{stage.hoursSinceLastActivity}h</span>}
                                                {stage.hoursSinceLastStage !== null && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Stage +{stage.hoursSinceLastStage}h</span>}
                                                {!stage.hoursSinceRegistration && !stage.hoursSinceLastActivity && !stage.hoursSinceLastStage && <span className="text-red-500 text-xs italic">No triggers set</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={stage.message}>{stage.message}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {stage.buttons ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    {Array.isArray(stage.buttons) ? stage.buttons.length : 0} buttons
                                                </span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stage.isActive
                                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                                                : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => openEditStageModal(stage)} className="text-blue-600 hover:text-blue-900 transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteStage(stage.id)} className="text-red-600 hover:text-red-900 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {stages.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No retention stages defined.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit/Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900">{editingStage ? 'Edit Stage' : 'Create New Stage'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors bg-gray-50 rounded-full p-1">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                    Configure when this message should be sent. Triggers use <b>AND</b> logic if multiple are set (e.g., must be registered X hours AND inactive for Y hours).
                                </p>

                                <form onSubmit={handleSaveStage} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
                                            <input
                                                id="name"
                                                name="name"
                                                defaultValue={editingStage?.name}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                                                placeholder="e.g. Day 1 Welcome"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">Sequence Order</label>
                                            <input
                                                id="order"
                                                name="order"
                                                type="number"
                                                defaultValue={editingStage?.order || (stages.length > 0 ? Math.max(...stages.map(s => s.order)) + 1 : 1)}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message Text</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            defaultValue={editingStage?.message}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border font-sans"
                                            required
                                            rows={5}
                                            placeholder="Hello! We missed you..."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="buttons" className="block text-sm font-medium text-gray-700 mb-1">Buttons (JSON Array)</label>
                                        <textarea
                                            id="buttons"
                                            name="buttons"
                                            defaultValue={editingStage?.buttons ? JSON.stringify(editingStage.buttons, null, 2) : ''}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border font-mono text-xs bg-gray-50"
                                            rows={4}
                                            placeholder='[{"text": "🔥 Get Bonus", "callback_data": "bonus_1"}]'
                                        />
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                            Engagement & Special Offers
                                        </h4>

                                        {/* Special Offer Toggle */}
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isSpecialOffer"
                                                    checked={isSpecialOffer}
                                                    onChange={(e) => setIsSpecialOffer(e.target.checked)}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span>Attach Special Offer (Credit Package)</span>
                                            </label>

                                            {isSpecialOffer && (
                                                <div className="ml-6 p-4 bg-white rounded-md border border-gray-200">
                                                    <div className="flex space-x-4 mb-3">
                                                        <label className="inline-flex items-center text-sm">
                                                            <input
                                                                type="radio"
                                                                className="form-radio text-purple-600"
                                                                checked={packageMode === 'existing'}
                                                                onChange={() => setPackageMode('existing')}
                                                            />
                                                            <span className="ml-2">Existing Package</span>
                                                        </label>
                                                        <label className="inline-flex items-center text-sm">
                                                            <input
                                                                type="radio"
                                                                className="form-radio text-purple-600"
                                                                checked={packageMode === 'custom'}
                                                                onChange={() => setPackageMode('custom')}
                                                            />
                                                            <span className="ml-2">Create Custom</span>
                                                        </label>
                                                    </div>

                                                    {packageMode === 'existing' ? (
                                                        <div className="space-y-2">
                                                            <select
                                                                name="packageId"
                                                                defaultValue={editingStage?.creditPackageId || ''}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                                            >
                                                                <option value="">-- Select Package --</option>
                                                                {packages.map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} - {p.price}₽ ({p.credits} cr)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-2">
                                                                <input type="text" name="customPackage[name]" placeholder="Package Name" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
                                                            </div>
                                                            <div>
                                                                <input type="number" name="customPackage[price]" placeholder="Price (RUB)" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
                                                            </div>
                                                            <div>
                                                                <input type="number" name="customPackage[credits]" placeholder="Credits" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mt-3">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Button Label (Optional)</label>
                                                        <input
                                                            name="specialOfferLabel"
                                                            defaultValue={editingStage?.specialOfferLabel || ''}
                                                            placeholder="e.g. 🔥 Get 50% Off"
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Random Generation Toggle */}
                                        <div className="space-y-3 pt-2 border-t border-gray-100">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isRandomGenerationEnabled"
                                                    checked={isRandomGen}
                                                    onChange={(e) => setIsRandomGen(e.target.checked)}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span>Add "Random Generation" Button</span>
                                            </label>

                                            {isRandomGen && (
                                                <div className="ml-6">
                                                    <input
                                                        name="randomGenerationLabel"
                                                        defaultValue={editingStage?.randomGenerationLabel || ''}
                                                        placeholder="Button Label (default: Surprise Me! 🎲)"
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                            Audience Conditions (AND Logic)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Min. Generations</label>
                                                <input name="conditionGenerations" type="number" defaultValue={editingStage?.conditionGenerations || ''} placeholder="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Payment History</label>
                                                <select name="conditionPaymentPresent"
                                                    defaultValue={editingStage?.conditionPaymentPresent === true ? 'true' : (editingStage?.conditionPaymentPresent === false ? 'false' : '')}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                                                >
                                                    <option value="">Any</option>
                                                    <option value="true">Must have paid</option>
                                                    <option value="false">Must NEVER have paid</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                            Trigger Conditions (Hours)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500 uppercase">Since Registration</label>
                                                <input name="hoursSinceRegistration" type="number" defaultValue={editingStage?.hoursSinceRegistration || ''} placeholder="e.g. 2" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500 uppercase">Since Last Activity</label>
                                                <input name="hoursSinceLastActivity" type="number" defaultValue={editingStage?.hoursSinceLastActivity || ''} placeholder="e.g. 24" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500 uppercase">Since Previous Stage</label>
                                                <input name="hoursSinceLastStage" type="number" defaultValue={editingStage?.hoursSinceLastStage || ''} placeholder="e.g. 12" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500 uppercase">Since First Payment</label>
                                                <input name="hoursSinceFirstPayment" type="number" defaultValue={editingStage?.hoursSinceFirstPayment || ''} placeholder="e.g. 1" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">Active Hours Logic (Server Time)</h5>
                                            <div className="flex items-center gap-2">
                                                <input name="activeHoursStart" type="number" min="0" max="23" defaultValue={editingStage?.activeHoursStart || ''} placeholder="Start (0-23)" className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                                <span className="text-gray-400">-</span>
                                                <input name="activeHoursEnd" type="number" min="0" max="23" defaultValue={editingStage?.activeHoursEnd || ''} placeholder="End (0-23)" className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                                <span className="text-xs text-gray-500 ml-2">If set, messages only send during these hours.</span>
                                            </div>
                                        </div>
                                    </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg border border-transparent bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
                                    <Save className="mr-2 h-4 w-4" /> Save Stage
                                </button>
                            </div>
                        </form>
                    </div>
                        </div>
                    </div >
                )
}
            </main >
        </div >
    );
}
