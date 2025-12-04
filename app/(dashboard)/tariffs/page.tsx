'use client';

import { useState, useEffect } from 'react';

// Simple Icons
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
);

type Provider = {
    id: string;
    name: string;
    slug: string;
};

type ModelTariff = {
    id: string;
    modelId: string;
    providerId: string;
    provider?: Provider;
    name: string;
    displayName?: string;
    description?: string;
    inputPrice?: number;
    outputPrice?: number;
    outputImagePrice?: number;
    outputVideoPrice?: number;
    outputAudioPrice?: number;
    priceUnit?: string;
    creditsPerSecond?: number;
    creditsPerGeneration?: number;
    creditPriceUsd?: number;
    inputImageTokens?: number; // Tokens for input image
    imageTokensLowRes?: number;
    imageTokensHighRes?: number;
    videoTokensPerSecond?: number;
    audioTokensPerMinute?: number;
    maxTokens?: number;
    maxVideoDuration?: number;
    maxImageResolution?: string;
    supportedResolutions?: string[];
    hasNativeAudio: boolean;
    hasImageGeneration: boolean;
    hasVideoGeneration: boolean;
    modelNameOnProvider?: string;
    endpoints?: { url?: string } | null;
    modelMargin: number;
    isActive: boolean;
    isPreview: boolean;
    isSelfHosted: boolean;
};

type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

export default function TariffsPage() {
    const [tariffs, setTariffs] = useState<ModelTariff[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTariff, setEditingTariff] = useState<ModelTariff | null>(null);
    const [modelType, setModelType] = useState<ModelType>('TEXT');
    const [syncModelName, setSyncModelName] = useState(true); // Sync modelNameOnProvider with modelId

    // Calculated prices for image generation
    const [calculatedInputImagePrice, setCalculatedInputImagePrice] = useState<number>(0);
    const [calculatedLowResPrice, setCalculatedLowResPrice] = useState<number>(0);
    const [calculatedHighResPrice, setCalculatedHighResPrice] = useState<number>(0);

    const [formData, setFormData] = useState<Partial<ModelTariff>>({
        isActive: true,
        hasNativeAudio: false,
        hasImageGeneration: false,
        hasVideoGeneration: false,
        modelMargin: 0,
        supportedResolutions: [],
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Effect to update boolean flags based on model type
    useEffect(() => {
        const updates: Partial<ModelTariff> = {};
        switch (modelType) {
            case 'TEXT':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = false;
                break;
            case 'IMAGE':
                updates.hasImageGeneration = true;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = false;
                break;
            case 'VIDEO':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = true;
                updates.hasNativeAudio = false; // Usually video models handle audio implicitly or separately
                break;
            case 'AUDIO':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = true;
                break;
            case 'MULTIMODAL':
                // Keep existing flags or set defaults? Let's default to all enabled for now or let user toggle
                updates.hasImageGeneration = true;
                updates.hasVideoGeneration = true;
                updates.hasNativeAudio = true;
                break;
        }
        setFormData(prev => ({ ...prev, ...updates }));
    }, [modelType]);

    // Sync modelNameOnProvider with modelId when sync is enabled
    useEffect(() => {
        if (syncModelName && formData.modelId) {
            setFormData(prev => ({ ...prev, modelNameOnProvider: formData.modelId }));
        }
    }, [formData.modelId, syncModelName]);

    // Calculate image generation prices
    useEffect(() => {
        const inputPrice = formData.inputPrice || 0;
        const outputPrice = formData.outputPrice || 0;
        const inputImageTokens = formData.inputImageTokens || 0;
        const lowResTokens = formData.imageTokensLowRes || 0;
        const highResTokens = formData.imageTokensHighRes || 0;

        // Price = (tokens / 1,000,000) * price_per_million
        setCalculatedInputImagePrice((inputImageTokens / 1_000_000) * inputPrice);
        setCalculatedLowResPrice((lowResTokens / 1_000_000) * outputPrice);
        setCalculatedHighResPrice((highResTokens / 1_000_000) * outputPrice);
    }, [formData.inputPrice, formData.outputPrice, formData.inputImageTokens, formData.imageTokensLowRes, formData.imageTokensHighRes]);

    const fetchData = async () => {
        try {
            const [tariffsRes, providersRes] = await Promise.all([
                fetch('/admin/api/tariffs'),
                fetch('/admin/api/providers'),
            ]);
            const tariffsData = await tariffsRes.json();
            const providersData = await providersRes.json();
            setTariffs(tariffsData);
            setProviders(providersData);
        } catch (error) {
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingTariff
                ? `/admin/api/tariffs/${editingTariff.id}`
                : '/admin/api/tariffs';
            const method = editingTariff ? 'PUT' : 'POST';

            // Convert numeric strings to numbers, preserve undefined for empty fields
            const payload = {
                ...formData,
                inputPrice: formData.inputPrice ? Number(formData.inputPrice) : undefined,
                outputPrice: formData.outputPrice ? Number(formData.outputPrice) : undefined,
                outputImagePrice: formData.outputImagePrice ? Number(formData.outputImagePrice) : undefined,
                outputVideoPrice: formData.outputVideoPrice ? Number(formData.outputVideoPrice) : undefined,
                outputAudioPrice: formData.outputAudioPrice ? Number(formData.outputAudioPrice) : undefined,
                creditsPerSecond: formData.creditsPerSecond ? Number(formData.creditsPerSecond) : undefined,
                modelMargin: Number(formData.modelMargin) || 0,
                imageTokensLowRes: formData.imageTokensLowRes ? Number(formData.imageTokensLowRes) : undefined,
                imageTokensHighRes: formData.imageTokensHighRes ? Number(formData.imageTokensHighRes) : undefined,
                maxVideoDuration: formData.maxVideoDuration ? Number(formData.maxVideoDuration) : undefined,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save tariff');

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Failed to save tariff');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const res = await fetch(`/admin/api/tariffs/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete tariff');

            fetchData();
        } catch (error) {
            alert('Failed to delete tariff');
        }
    };

    const openModal = (tariff?: ModelTariff) => {
        if (tariff) {
            setEditingTariff(tariff);
            setFormData(tariff);
            setSyncModelName(tariff.modelId === tariff.modelNameOnProvider);
            // Infer model type from flags
            if (tariff.hasVideoGeneration) setModelType('VIDEO');
            else if (tariff.hasImageGeneration) setModelType('IMAGE');
            else if (tariff.hasNativeAudio) setModelType('AUDIO');
            else setModelType('TEXT');
        } else {
            setEditingTariff(null);
            setModelType('TEXT');
            setSyncModelName(true);
            setFormData({
                isActive: true,
                hasNativeAudio: false,
                hasImageGeneration: false,
                hasVideoGeneration: false,
                modelMargin: 0,
                priceUnit: 'per_million_tokens',
                supportedResolutions: [],
            });
        }
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoaderIcon />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen text-gray-900">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Model Tariffs</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon />
                    Add Tariff
                </button>
            </div>

            <div className="bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Model ID</th>
                            <th className="p-4 font-semibold text-gray-600">Provider</th>
                            <th className="p-4 font-semibold text-gray-600">Price Unit</th>
                            <th className="p-4 font-semibold text-gray-600">Input Price</th>
                            <th className="p-4 font-semibold text-gray-600">Output Price</th>
                            <th className="p-4 font-semibold text-gray-600">Margin</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 w-[100px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tariffs.map((tariff) => (
                            <tr key={tariff.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{tariff.name}</td>
                                <td className="p-4 text-gray-600">{tariff.modelId}</td>
                                <td className="p-4 text-gray-600">{tariff.provider?.name || '-'}</td>
                                <td className="p-4 text-gray-600">{tariff.priceUnit}</td>
                                <td className="p-4 text-gray-600">${tariff.inputPrice}</td>
                                <td className="p-4 text-gray-600">${tariff.outputPrice}</td>
                                <td className="p-4 text-gray-600">{(tariff.modelMargin * 100).toFixed(0)}%</td>
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${tariff.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {tariff.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openModal(tariff)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <PencilIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tariff.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {editingTariff ? 'Edit Tariff' : 'Add Tariff'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Top Row: Provider, Model ID, Model Type */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                                    <select
                                        value={formData.providerId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, providerId: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">Select Provider</option>
                                        {providers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Model ID</label>
                                    <input
                                        required
                                        value={formData.modelId || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, modelId: e.target.value })
                                        }
                                        placeholder="e.g. gemini-1.5-pro"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Model Type</label>
                                    <select
                                        value={modelType}
                                        onChange={(e: any) => setModelType(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="TEXT">Text Generation</option>
                                        <option value="IMAGE">Image Generation</option>
                                        <option value="VIDEO">Video Generation</option>
                                        <option value="AUDIO">Audio Generation</option>
                                        <option value="MULTIMODAL">Multimodal</option>
                                    </select>
                                </div>
                            </div>

                            {/* Name & Description */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        required
                                        value={formData.name || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Gemini 1.5 Pro"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input
                                        value={formData.displayName || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, displayName: e.target.value })
                                        }
                                        placeholder="e.g. Gemini 1.5 Pro (Preview)"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    value={formData.description || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* API Details */}
                            <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700">API Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-gray-700">Model Name on Provider</label>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={syncModelName}
                                                    onChange={(e) => {
                                                        setSyncModelName(e.target.checked);
                                                        if (e.target.checked && formData.modelId) {
                                                            setFormData({ ...formData, modelNameOnProvider: formData.modelId });
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-xs text-gray-600">Copy from Model ID</span>
                                            </label>
                                        </div>
                                        <input
                                            value={formData.modelNameOnProvider || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, modelNameOnProvider: e.target.value });
                                                setSyncModelName(false);
                                            }}
                                            placeholder="e.g. gemini-1.5-pro-002"
                                            disabled={syncModelName}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Endpoint URL</label>
                                        <input
                                            value={(formData.endpoints as any)?.url || ''}
                                            onChange={(e) =>
                                                setFormData({ ...formData, endpoints: { url: e.target.value } as any })
                                            }
                                            placeholder="https://api.example.com/v1/generate"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & Margin */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Price Unit</label>
                                    <select
                                        value={formData.priceUnit}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priceUnit: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="per_million_tokens">Per Million Tokens</option>
                                        <option value="per_second">Per Second</option>
                                        <option value="per_credit">Per Credit</option>
                                        <option value="per_generation">Per Generation</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Model Margin (0.1 = 10%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.modelMargin || 0}
                                        onChange={(e) =>
                                            setFormData({ ...formData, modelMargin: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) =>
                                                setFormData({ ...formData, isActive: e.target.checked })
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ms-3 text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            {/* Dynamic Pricing Fields based on Model Type */}
                            <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Pricing Details</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {(modelType === 'TEXT' || modelType === 'MULTIMODAL') && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Input Price ($/1M)</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={formData.inputPrice || 0}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, inputPrice: Number(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Output Price ($/1M)</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={formData.outputPrice || 0}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, outputPrice: Number(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {(modelType === 'IMAGE' || modelType === 'MULTIMODAL') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Image Price ($/1M Tokens)</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={formData.outputImagePrice || 0}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        outputImagePrice: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    {(modelType === 'VIDEO' || modelType === 'MULTIMODAL') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Video Price ($/sec)</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={formData.outputVideoPrice || 0}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        outputVideoPrice: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    {(modelType === 'AUDIO' || modelType === 'MULTIMODAL') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Audio Price ($/min)</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={formData.outputAudioPrice || 0}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        outputAudioPrice: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Multimedia Tokens & Alternative Pricing */}
                            {(modelType === 'IMAGE' || modelType === 'VIDEO' || modelType === 'AUDIO' || modelType === 'MULTIMODAL') && (
                                <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                                    <h3 className="font-semibold text-gray-700">Multimedia Tokens & Pricing</h3>

                                    {(modelType === 'IMAGE' || modelType === 'MULTIMODAL') && (
                                        <>
                                            {/* Input Image Section */}
                                            <div className="border-l-4 border-green-500 pl-4">
                                                <h4 className="font-medium text-gray-700 mb-3">📥 Input Image Processing</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Tokens per Input Image</label>
                                                        <input
                                                            type="number"
                                                            value={formData.inputImageTokens || ''}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, inputImageTokens: Number(e.target.value) || undefined })
                                                            }
                                                            placeholder="e.g. 560"
                                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">💰 Cost per Input Image</label>
                                                        <div className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-200 text-green-900 font-semibold">
                                                            ${calculatedInputImagePrice.toFixed(6)}
                                                        </div>
                                                        <p className="text-xs text-gray-500">inputImageTokens × inputPrice / 1M</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Output Image Section */}
                                            <div className="border-l-4 border-blue-500 pl-4">
                                                <h4 className="font-medium text-gray-700 mb-3">📤 Output Image Generation</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Tokens for Low-Res Output (≤2K)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.imageTokensLowRes || ''}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, imageTokensLowRes: Number(e.target.value) || undefined })
                                                            }
                                                            placeholder="e.g. 1120"
                                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Tokens for Hi-Res Output (4K+)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.imageTokensHighRes || ''}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, imageTokensHighRes: Number(e.target.value) || undefined })
                                                            }
                                                            placeholder="e.g. 2000"
                                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Output Image Price ($/1M tokens)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={formData.outputImagePrice || ''}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, outputImagePrice: Number(e.target.value) || undefined })
                                                            }
                                                            placeholder="e.g. 120.00"
                                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Calculated prices for output */}
                                                <div className="grid grid-cols-2 gap-4 mt-3">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">💰 Cost per Low-Res Output</label>
                                                        <div className="w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-900 font-semibold">
                                                            ${calculatedLowResPrice.toFixed(6)}
                                                        </div>
                                                        <p className="text-xs text-gray-500">imageTokensLowRes × outputImagePrice / 1M</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">💰 Cost per Hi-Res Output</label>
                                                        <div className="w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-900 font-semibold">
                                                            ${calculatedHighResPrice.toFixed(6)}
                                                        </div>
                                                        <p className="text-xs text-gray-500">imageTokensHighRes × outputImagePrice / 1M</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(modelType === 'VIDEO' || modelType === 'AUDIO') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Credits Per Second</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.creditsPerSecond || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, creditsPerSecond: Number(e.target.value) || undefined })
                                                }
                                                placeholder="e.g. 0.15"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Technical Parameters */}
                            <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Technical Parameters</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {(modelType === 'IMAGE' || modelType === 'MULTIMODAL') && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Max Image Resolution</label>
                                                <input
                                                    value={formData.maxImageResolution || ''}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, maxImageResolution: e.target.value })
                                                    }
                                                    placeholder="e.g. 4096x4096"
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Supported Resolutions</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['1024x1024', '1024x1792', '1792x1024', '2048x2048', '4096x4096'].map((res) => (
                                                        <button
                                                            key={res}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = formData.supportedResolutions || [];
                                                                if (current.includes(res)) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        supportedResolutions: current.filter((r) => r !== res),
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        supportedResolutions: [...current, res],
                                                                    });
                                                                }
                                                            }}
                                                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${(formData.supportedResolutions || []).includes(res)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            {res}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {(modelType === 'VIDEO' || modelType === 'MULTIMODAL') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Max Video Duration (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.maxVideoDuration || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, maxVideoDuration: Number(e.target.value) || undefined })
                                                }
                                                placeholder="e.g. 60"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capabilities Read-only View */}
                            <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Capabilities (Auto-set by Model Type)</h3>
                                <div className="flex gap-6">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasImageGeneration}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">Image Gen</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasVideoGeneration}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">Video Gen</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasNativeAudio}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">Audio</label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
