'use client';

import { useState, useEffect } from 'react';
import { getOverlayAnalytics, getOverlayEvents } from '@/app/actions/overlay-actions';

export default function OverlayAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [statsData, eventsData] = await Promise.all([
                getOverlayAnalytics(),
                getOverlayEvents()
            ]);
            setStats(statsData);
            setEvents(eventsData);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-xs uppercase font-bold">Impressions</h3>
                    <p className="text-2xl font-bold">{stats.totalImpressions}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-xs uppercase font-bold">Clicks</h3>
                    <p className="text-2xl font-bold">{stats.totalClicks}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-xs uppercase font-bold">Conversions</h3>
                    <p className="text-2xl font-bold">{stats.totalConversions}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                    <h3 className="text-gray-500 text-xs uppercase font-bold">CTR</h3>
                    <p className="text-2xl font-bold">{stats.ctr.toFixed(1)}%</p>
                </div>
            </div>

            {/* Recent Events Table */}
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-800">Recent Events</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overlay</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.map((e) => (
                            <tr key={e.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(e.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${e.event === 'DELIVERED' ? 'bg-blue-100 text-blue-800' :
                                            e.event === 'CLICKED' ? 'bg-yellow-100 text-yellow-800' :
                                                e.event === 'CONVERTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {e.event}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {e.overlay?.code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {e.variant?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                    {e.userId.substring(0, 8)}...
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-400">No events found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
