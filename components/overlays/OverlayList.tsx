'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Overlay } from '@prisma/client';
import { deleteOverlay } from '@/app/actions/overlay-actions';

interface OverlayListProps {
    overlays: (Overlay & { variants: any[], _count?: { activations: number, events: number } })[];
}

export default function OverlayList({ overlays }: OverlayListProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this overlay?')) return;
        setIsDeleting(id);
        const res = await deleteOverlay(id);
        if (res.success) {
            router.refresh();
        } else {
            alert('Failed to delete: ' + res.error);
        }
        setIsDeleting(null);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code / Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {overlays.map((overlay) => (
                        <tr key={overlay.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{overlay.code}</div>
                                <div className="text-xs text-gray-500">{overlay.variants.length} variants</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${overlay.type === 'TRIPWIRE' ? 'bg-red-100 text-red-800' :
                                        overlay.type === 'BONUS' ? 'bg-green-100 text-green-800' :
                                            overlay.type === 'SPECIAL_OFFER' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                    {overlay.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {overlay.priority}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${overlay.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {overlay.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                <div>Activations: {overlay._count?.activations || 0}</div>
                                <div>Events: {overlay._count?.events || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/overlays/${overlay.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                    Edit
                                </Link>
                                <button
                                    onClick={() => handleDelete(overlay.id)}
                                    disabled={isDeleting === overlay.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                    {isDeleting === overlay.id ? '...' : 'Delete'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {overlays.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                No overlays found. Create one to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
