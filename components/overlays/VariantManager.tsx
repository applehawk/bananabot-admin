'use client';

import { useState } from 'react';
import { OverlayVariant } from '@prisma/client';
import PayloadEditor from './PayloadEditor';
import { saveVariant, deleteVariant } from '@/app/actions/overlay-actions';

interface VariantManagerProps {
    overlayId: string;
    variants: OverlayVariant[];
}

export default function VariantManager({ overlayId, variants }: VariantManagerProps) {
    const [editingVariant, setEditingVariant] = useState<Partial<OverlayVariant> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editingVariant || !editingVariant.name) return;
        setIsSaving(true);
        const res = await saveVariant(overlayId, {
            ...editingVariant,
            payload: editingVariant.payload || {},
            weight: editingVariant.weight || 1
        });
        setIsSaving(false);
        if (res.success) {
            setEditingVariant(null);
        } else {
            alert('Failed: ' + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this variant?')) return;
        await deleteVariant(id, overlayId);
    };

    return (
        <div className="space-y-4">
            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map(v => (
                    <div key={v.id} className="border rounded p-3 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-sm">{v.name}</h3>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded-full">Weight: {v.weight}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                                {(v.payload as any)?.message?.text || 'No text'}
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2 text-xs">
                            <button
                                onClick={() => setEditingVariant(v)}
                                className="text-indigo-600 hover:underline"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(v.id)}
                                className="text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Card */}
                <button
                    onClick={() => setEditingVariant({ name: 'New Variant', weight: 1, payload: {}, isActive: true })}
                    className="border-2 border-dashed border-gray-300 rounded p-4 flex items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                >
                    + Add Variant
                </button>
            </div>

            {/* Edit Modal (Inline/Overlay) */}
            {editingVariant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="font-bold text-lg">{editingVariant.id ? 'Edit Variant' : 'New Variant'}</h2>
                            <button onClick={() => setEditingVariant(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                    <input
                                        className="w-full border rounded p-2 text-sm"
                                        value={editingVariant.name || ''}
                                        onChange={e => setEditingVariant({ ...editingVariant, name: e.target.value })}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2 text-sm"
                                        value={editingVariant.weight || 0}
                                        onChange={e => setEditingVariant({ ...editingVariant, weight: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <PayloadEditor
                                value={editingVariant.payload as any}
                                onChange={p => setEditingVariant({ ...editingVariant, payload: p as any })}
                            />
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button
                                onClick={() => setEditingVariant(null)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Variant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
