'use client';

import { useState, useEffect } from 'react';

interface Tariff {
    id: string;
    modelId: string;
    name: string;
    inputPrice: number;
    outputPrice: number;
    outputImagePrice: number;
    imageTokens1K: number;
    imageTokens4K: number;
    isActive: boolean;
}

interface Settings {
    usdRubRate: number;
    hostingCost: number;
}

export default function TariffsPage() {
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [settings, setSettings] = useState<Settings>({ usdRubRate: 100, hostingCost: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New Tariff Form State
    const [newTariff, setNewTariff] = useState({
        modelId: '',
        name: '',
        inputPrice: 0,
        outputPrice: 0,
        outputImagePrice: 0,
        imageTokens1K: 1120,
        imageTokens4K: 2000,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tariffsRes, settingsRes, exchangeRateRes] = await Promise.all([
                fetch('/admin/api/tariffs'),
                fetch('/admin/api/settings'),
                fetch('/admin/api/exchange-rate'),
            ]);

            if (tariffsRes.ok) {
                setTariffs(await tariffsRes.json());
            }

            let currentSettings = { usdRubRate: 100, hostingCost: 0 };
            if (settingsRes.ok) {
                currentSettings = await settingsRes.json();
            }

            // Auto-populate with current exchange rate if fetch succeeds
            if (exchangeRateRes.ok) {
                const exchangeData = await exchangeRateRes.json();
                currentSettings.usdRubRate = exchangeData.usdRubRate;
            }

            setSettings(currentSettings);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTariff = async () => {
        if (!newTariff.modelId || !newTariff.name) return;
        setSaving(true);
        try {
            const res = await fetch('/admin/api/tariffs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTariff),
            });
            if (res.ok) {
                setNewTariff({
                    modelId: '',
                    name: '',
                    inputPrice: 0,
                    outputPrice: 0,
                    outputImagePrice: 0,
                    imageTokens1K: 1120,
                    imageTokens4K: 2000,
                });
                fetchData();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTariff = async (id: string, data: Partial<Tariff>) => {
        try {
            await fetch(`/admin/api/tariffs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            // Optimistic update or refetch
            setTariffs(tariffs.map(t => t.id === id ? { ...t, ...data } : t));
        } catch (error) {
            console.error('Failed to update tariff', error);
        }
    };

    const handleDeleteTariff = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/admin/api/tariffs/${id}`, {
                method: 'DELETE',
            });
            setTariffs(tariffs.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete tariff', error);
        }
    };

    const handleUpdateSettings = async () => {
        setSaving(true);
        try {
            await fetch('/admin/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
        } finally {
            setSaving(false);
        }
    };

    const calculateRubPrice = (usdPrice: number) => {
        return (usdPrice * settings.usdRubRate).toFixed(2);
    };

    const calculatePriceFromTokens = (tokens: number, outputPricePerMillion: number) => {
        // tokens - количество токенов для генерации
        // outputPricePerMillion - цена за 1M токенов в USD
        // Формула: (tokens / 1,000,000) × цена за 1M токенов
        return ((tokens / 1_000_000) * outputPricePerMillion).toFixed(3);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Tariffs & Pricing</h1>
                <button onClick={fetchData} className="px-3 py-2 hover:bg-gray-100 rounded-lg">
                    🔄 Refresh
                </button>
            </div>

            {/* Global Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <h2 className="text-xl font-semibold">Global Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">USD/RUB Rate</label>
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    value={settings.usdRubRate}
                                    onChange={(e) => setSettings({ ...settings, usdRubRate: parseFloat(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/admin/api/exchange-rate');
                                        const data = await res.json();
                                        setSettings({ ...settings, usdRubRate: data.usdRubRate });
                                        alert(`Rate updated: ${data.usdRubRate} RUB (from ${data.source})`);
                                    } catch (error) {
                                        alert('Failed to fetch exchange rate');
                                    }
                                }}
                                className="mt-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                                title="Fetch current exchange rate"
                            >
                                🌐 Fetch
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Current market rate will be fetched from exchangerate-api.com</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hosting Cost (Monthly/Base)</label>
                        <input
                            type="number"
                            value={settings.hostingCost}
                            onChange={(e) => setSettings({ ...settings, hostingCost: parseFloat(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleUpdateSettings}
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {saving ? '⏳ Updating...' : '� Update Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create New Tariff */}
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <h2 className="text-xl font-semibold">Add New Model Tariff</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        placeholder="Model ID (e.g. gemini-2.5-flash)"
                        value={newTariff.modelId}
                        onChange={(e) => setNewTariff({ ...newTariff, modelId: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <input
                        placeholder="Display Name"
                        value={newTariff.name}
                        onChange={(e) => setNewTariff({ ...newTariff, name: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Input Price ($/1M tokens)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={newTariff.inputPrice}
                                onChange={(e) => setNewTariff({ ...newTariff, inputPrice: parseFloat(e.target.value) })}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Output Text Price ($/1M tokens)</label>
                            <p className="text-xs text-gray-400 mb-1">текст и размышления</p>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="12.00"
                                value={newTariff.outputPrice}
                                onChange={(e) => setNewTariff({ ...newTariff, outputPrice: parseFloat(e.target.value) })}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Output Image Price ($/1M tokens)</label>
                            <p className="text-xs text-gray-400 mb-1">изображения</p>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="120.00"
                                value={newTariff.outputImagePrice}
                                onChange={(e) => setNewTariff({ ...newTariff, outputImagePrice: parseFloat(e.target.value) })}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Image 1K/2K Tokens</label>
                            <p className="text-xs text-gray-400 mb-1">токенов на генерацию</p>
                            <input
                                type="number"
                                step="1"
                                placeholder="1120"
                                value={newTariff.imageTokens1K}
                                onChange={(e) => setNewTariff({ ...newTariff, imageTokens1K: parseInt(e.target.value) || 0 })}
                                className="border p-2 rounded w-full"
                            />
                            {newTariff.outputImagePrice > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    ≈ ${calculatePriceFromTokens(newTariff.imageTokens1K, newTariff.outputImagePrice)}/изобр.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Image 4K Tokens</label>
                            <p className="text-xs text-gray-400 mb-1">токенов на генерацию</p>
                            <input
                                type="number"
                                step="1"
                                placeholder="2000"
                                value={newTariff.imageTokens4K}
                                onChange={(e) => setNewTariff({ ...newTariff, imageTokens4K: parseInt(e.target.value) || 0 })}
                                className="border p-2 rounded w-full"
                            />
                            {newTariff.outputImagePrice > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    ≈ ${calculatePriceFromTokens(newTariff.imageTokens4K, newTariff.outputImagePrice)}/изобр.
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleCreateTariff}
                        disabled={saving || !newTariff.modelId}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 w-fit"
                    >
                        ➕ Add Tariff
                    </button>
                </div>
            </div>

            {/* Tariff List & Calculator */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Active Tariffs</h2>
                <div className="grid gap-6">
                    {tariffs.map((tariff) => (
                        <div key={tariff.id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold">{tariff.name}</h3>
                                    <code className="text-sm text-gray-500 bg-gray-100 px-1 rounded">{tariff.modelId}</code>
                                </div>
                                <button
                                    onClick={() => handleDeleteTariff(tariff.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                >
                                    🗑️ Delete
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                {/* Input Price */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Input ($/1M tokens)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tariff.inputPrice}
                                        onChange={(e) => handleUpdateTariff(tariff.id, { inputPrice: parseFloat(e.target.value) })}
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="text-xs text-gray-400">
                                        ≈ {calculateRubPrice(tariff.inputPrice)} RUB/1M
                                    </div>
                                </div>

                                {/* Output Text Price */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Output Text ($/1M tokens)</label>
                                    <p className="text-xs text-gray-400 mb-1">текст и размышления</p>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tariff.outputPrice}
                                        onChange={(e) => handleUpdateTariff(tariff.id, { outputPrice: parseFloat(e.target.value) })}
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="text-xs text-gray-400">
                                        ≈ {calculateRubPrice(tariff.outputPrice)} RUB/1M
                                    </div>
                                </div>

                                {/* Output Image Price */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Output Image ($/1M tokens)</label>
                                    <p className="text-xs text-gray-400 mb-1">изображения</p>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tariff.outputImagePrice}
                                        onChange={(e) => handleUpdateTariff(tariff.id, { outputImagePrice: parseFloat(e.target.value) })}
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="text-xs text-gray-400">
                                        ≈ {calculateRubPrice(tariff.outputImagePrice)} RUB/1M
                                    </div>
                                </div>

                                {/* Image 1K Tokens */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Image 1K/2K Tokens</label>
                                    <p className="text-xs text-gray-400 mb-1">токенов на генерацию</p>
                                    <input
                                        type="number"
                                        step="1"
                                        value={tariff.imageTokens1K}
                                        onChange={(e) => handleUpdateTariff(tariff.id, { imageTokens1K: parseInt(e.target.value) || 0 })}
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="text-xs text-gray-400">
                                        ≈ ${calculatePriceFromTokens(tariff.imageTokens1K, tariff.outputImagePrice)}/изобр.
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        ≈ {calculateRubPrice(parseFloat(calculatePriceFromTokens(tariff.imageTokens1K, tariff.outputImagePrice)))} RUB
                                    </div>
                                </div>

                                {/* Image 4K Tokens */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Image 4K Tokens</label>
                                    <p className="text-xs text-gray-400 mb-1">токенов на генерацию</p>
                                    <input
                                        type="number"
                                        step="1"
                                        value={tariff.imageTokens4K}
                                        onChange={(e) => handleUpdateTariff(tariff.id, { imageTokens4K: parseInt(e.target.value) || 0 })}
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="text-xs text-gray-400">
                                        ≈ ${calculatePriceFromTokens(tariff.imageTokens4K, tariff.outputImagePrice)}/изобр.
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        ≈ {calculateRubPrice(parseFloat(calculatePriceFromTokens(tariff.imageTokens4K, tariff.outputImagePrice)))} RUB
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
