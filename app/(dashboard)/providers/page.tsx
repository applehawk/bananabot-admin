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

import { Prisma } from '@prisma/client';

type Provider = Prisma.ProviderGetPayload<{
    include: {
        _count: {
            select: {
                models: true;
            };
        };
    };
}>;

export default function ProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [formData, setFormData] = useState<Partial<Provider>>({
        authType: 'API_KEY',
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const res = await fetch('/admin/api/providers');
            const data = await res.json();
            setProviders(data);
        } catch (error) {
            alert('Failed to fetch providers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingProvider
                ? `/admin/api/providers/${editingProvider.id}`
                : '/admin/api/providers';
            const method = editingProvider ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to save provider');

            setIsModalOpen(false);
            fetchProviders();
        } catch (error) {
            alert('Failed to save provider');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all associated models.')) return;

        try {
            const res = await fetch(`/admin/api/providers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete provider');

            fetchProviders();
        } catch (error) {
            alert('Failed to delete provider');
        }
    };

    const openModal = (provider?: Provider) => {
        if (provider) {
            setEditingProvider(provider);
            setFormData(provider);
        } else {
            setEditingProvider(null);
            setFormData({ authType: 'API_KEY' });
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
                <h1 className="text-3xl font-bold">Providers</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon />
                    Add Provider
                </button>
            </div>

            <div className="bg-white border rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Slug</th>
                            <th className="p-4 font-semibold text-gray-600">Auth Type</th>
                            <th className="p-4 font-semibold text-gray-600">Base URL</th>
                            <th className="p-4 font-semibold text-gray-600">Models</th>
                            <th className="p-4 font-semibold text-gray-600 w-[100px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {providers.map((provider) => (
                            <tr key={provider.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{provider.name}</td>
                                <td className="p-4 text-gray-600">{provider.slug}</td>
                                <td className="p-4 text-gray-600">{provider.authType}</td>
                                <td className="p-4 text-gray-600 max-w-[200px] truncate">
                                    {provider.baseUrl || '-'}
                                </td>
                                <td className="p-4 text-gray-600">{provider._count?.models || 0}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openModal(provider)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <PencilIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(provider.id)}
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {editingProvider ? 'Edit Provider' : 'Add Provider'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        required
                                        value={formData.name || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Google Gemini"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                                    <input
                                        required
                                        value={formData.slug || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, slug: e.target.value })
                                        }
                                        placeholder="e.g. google"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Base URL</label>
                                <input
                                    value={formData.baseUrl || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, baseUrl: e.target.value })
                                    }
                                    placeholder="https://api.example.com"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Auth Type</label>
                                    <select
                                        value={formData.authType}
                                        onChange={(e: any) =>
                                            setFormData({ ...formData, authType: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="API_KEY">API Key</option>
                                        <option value="BEARER_TOKEN">Bearer Token</option>
                                        <option value="X_API_KEY">X-API-Key Header</option>
                                        <option value="GOOGLE_OAUTH">Google OAuth</option>
                                        <option value="NONE">None</option>
                                    </select>
                                </div>
                                {formData.authType !== 'NONE' && formData.authType !== 'GOOGLE_OAUTH' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Auth Header Name</label>
                                        <input
                                            value={formData.authHeaderName || ''}
                                            onChange={(e) =>
                                                setFormData({ ...formData, authHeaderName: e.target.value })
                                            }
                                            placeholder="Authorization"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.authType !== 'NONE' && formData.authType !== 'GOOGLE_OAUTH' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Auth Header Prefix</label>
                                        <input
                                            value={formData.authHeaderPrefix || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    authHeaderPrefix: e.target.value,
                                                })
                                            }
                                            placeholder="Bearer "
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Auth Query Param</label>
                                        <input
                                            value={formData.authQueryParam || ''}
                                            onChange={(e) =>
                                                setFormData({ ...formData, authQueryParam: e.target.value })
                                            }
                                            placeholder="key"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

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
                </div>
            )}
        </div>
    );
}
