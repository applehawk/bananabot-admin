'use client';

import { useState, useEffect } from 'react';

interface Broadcast {
    id: string;
    message: string;
    status: string;
    scheduledFor: string | null;
    startedAt: string | null;
    completedAt: string | null;
    totalUsers: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
}

export default function BroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [targetNotSubscribed, setTargetNotSubscribed] = useState(false);

    useEffect(() => {
        fetchBroadcasts();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchBroadcasts, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch('/admin/api/broadcasts');
            if (res.ok) {
                const data = await res.json();
                setBroadcasts(data);
            }
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!message.trim()) return;

        try {
            setIsCreating(true);
            const res = await fetch('/admin/api/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    targetNotSubscribed
                }),
            });

            if (res.ok) {
                setMessage('');
                setTargetNotSubscribed(false);
                fetchBroadcasts();
            } else {
                alert('Failed to create broadcast');
            }
        } catch (error) {
            alert('Error creating broadcast');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">📢 Broadcasts</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Create Broadcast */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">New Broadcast</h2>
                    <div className="space-y-4">
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            placeholder="Message to all users..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <div className="flex items-center">
                            <input
                                id="targetNotSubscribed"
                                type="checkbox"
                                checked={targetNotSubscribed}
                                onChange={(e) => setTargetNotSubscribed(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="targetNotSubscribed" className="ml-2 block text-sm text-gray-900">
                                Send ONLY to users who are NOT subscribed to the channel
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || !message.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Launch Broadcast'}
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Broadcast History</h3>
                    </div>

                    {loading ? (
                        <div className="p-6 text-center text-gray-500">Loading...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timing</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {broadcasts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No broadcasts found.</td>
                                    </tr>
                                ) : (
                                    broadcasts.map((b) => (
                                        <tr key={b.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(b.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={b.message}>
                                                {b.message}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(b.status)}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>Sent: {b.sentCount}</span>
                                                    {b.failedCount > 0 && <span className="text-red-500">Failed: {b.failedCount}</span>}
                                                    <span className="text-xs text-gray-400">Total: ~{b.totalUsers}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {b.startedAt && <div>Stats: {new Date(b.startedAt).toLocaleTimeString()}</div>}
                                                {b.completedAt && <div>End: {new Date(b.completedAt).toLocaleTimeString()}</div>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
