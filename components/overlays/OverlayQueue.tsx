'use client';

import { useState, useEffect } from 'react';
import { getScheduledOverlays } from '@/app/actions/overlay-actions';

export default function OverlayQueue() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQ = async () => {
            const data = await getScheduledOverlays();
            setJobs(data);
            setLoading(false);
        };
        fetchQ();
    }, []);

    if (loading) return <div className="p-4">Loading queue...</div>;

    return (
        <div className="bg-white rounded shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Scheduled Deliveries</h3>
                <span className="text-xs text-gray-500">{jobs.length} items</span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled For</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overlay</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                        <tr key={job.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(job.scheduledFor).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {job.user?.username ? `@${job.user.username}` : job.user?.telegramId?.toString() || job.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                {job.overlay?.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    PENDING
                                </span>
                            </td>
                        </tr>
                    ))}
                    {jobs.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">No scheduled items found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
