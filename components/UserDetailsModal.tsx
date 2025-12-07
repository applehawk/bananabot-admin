'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import SendMessageModal from './SendMessageModal';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface UserDetailsModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void; // Callback to refresh parent list
}

export default function UserDetailsModal({ userId, isOpen, onClose, onUpdate }: UserDetailsModalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserStats();
        } else {
            setData(null);
        }
    }, [isOpen, userId]);

    const fetchUserStats = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/admin/api/users/${userId}/stats`);
            if (!res.ok) throw new Error('Failed to fetch user stats');
            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            console.error(err);
            setError('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCredits = async () => {
        if (!userId) return;
        const amountStr = prompt('Enter amount of credits to add:');
        if (!amountStr) return;
        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive number');
            return;
        }
        try {
            const res = await fetch(`/admin/api/users/${userId}/add-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits: amount }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || `Failed to add credits (${res.status})`;
                throw new Error(errorMessage);
            }

            alert(`✅ Successfully added ${amount} credits`);
            fetchUserStats(); // Refresh local stats
            if (onUpdate) onUpdate(); // Refresh parent
        } catch (err) {
            console.error('Error adding credits:', err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            alert(`❌ Error: ${errorMessage}`);
        }
    };

    const handleDeductCredits = async () => {
        if (!userId) return;
        const amountStr = prompt('Enter amount of credits to DEDUCT:');
        if (!amountStr) return;
        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive number');
            return;
        }
        try {
            const res = await fetch(`/admin/api/users/${userId}/deduct-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits: amount }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || `Failed to deduct credits (${res.status})`;
                throw new Error(errorMessage);
            }

            alert(`✅ Successfully deducted ${amount} credits`);
            fetchUserStats(); // Refresh local stats
            if (onUpdate) onUpdate(); // Refresh parent
        } catch (err) {
            console.error('Error deducting credits:', err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            alert(`❌ Error: ${errorMessage}`);
        }
    };

    if (!isOpen) return null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none bg-black/50 backdrop-blur-sm">

            {/* Nested Message Modal */}
            {data?.user && (
                <SendMessageModal
                    userId={data.user.id}
                    username={data.user.username || data.user.firstName}
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                />
            )}

            <div className="relative z-50 w-full max-w-6xl mx-auto my-6 px-4">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none max-h-[90vh]">

                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                        <div>
                            <h3 className="text-2xl font-semibold">User Details</h3>
                            {loading && <span className="text-sm text-gray-500">Loading...</span>}
                            {!loading && data?.user && (
                                <div className="mt-1">
                                    <span className="font-bold text-lg">{data.user.firstName || data.user.username || 'Unknown'}</span>
                                    <span className="ml-2 text-gray-500">@{data.user.username}</span>
                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ID: {data.user.id}</span>
                                </div>
                            )}
                        </div>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-black text-3xl leading-none font-semibold outline-none focus:outline-none opacity-50 hover:opacity-100"
                            onClick={onClose}
                        >
                            <span className="text-black h-6 w-6 block">×</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative p-6 flex-auto overflow-y-auto bg-gray-50">
                        {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

                        {data && data.user && (
                            <div className="space-y-6">

                                {/* Action Bar */}
                                <div className="flex flex-wrap gap-2 p-4 bg-white rounded shadow-sm">
                                    <button
                                        onClick={() => setIsMessageModalOpen(true)}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium transition"
                                    >
                                        ✉️ Message
                                    </button>
                                    <Link
                                        href={`/generations?userId=${data.user.id}`}
                                        className="px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 font-medium transition flex items-center"
                                        target="_blank"
                                    >
                                        Generations history
                                    </Link>
                                    <Link
                                        href={`/transactions?userId=${data.user.id}`}
                                        className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 font-medium transition flex items-center"
                                        target="_blank"
                                    >
                                        Transactions history
                                    </Link>
                                    <Link
                                        href={`/users/${data.user.id}/settings`}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 font-medium transition flex items-center"
                                        target="_blank"
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleAddCredits}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition ml-auto"
                                    >
                                        + Add Credits
                                    </button>
                                    <button
                                        onClick={handleDeductCredits}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition ml-2"
                                    >
                                        - Deduct Credits
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <div className="text-gray-500 text-xs uppercase font-bold">Balance</div>
                                        <div className="text-2xl font-bold text-green-600">{data.user.credits.toFixed(1)} <span className="text-sm text-gray-400">Cr</span></div>
                                    </div>
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <div className="text-gray-500 text-xs uppercase font-bold">Total Spent</div>
                                        <div className="text-2xl font-bold text-gray-800">{data.stats.totals.creditsUsed.toFixed(1)} <span className="text-sm text-gray-400">Cr</span></div>
                                        <div className="text-xs text-gray-400 mt-1">${data.stats.totals.usdUsed.toFixed(4)} USD</div>
                                    </div>
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <div className="text-gray-500 text-xs uppercase font-bold">Total Deposited</div>
                                        <div className="text-2xl font-bold text-gray-800">{data.stats.totals.creditsPurchased.toFixed(1)} <span className="text-sm text-gray-400">Cr</span></div>
                                        <div className="text-xs text-gray-400 mt-1">${data.stats.totals.usdPurchased.toFixed(2)} USD</div>
                                    </div>
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <div className="text-gray-500 text-xs uppercase font-bold">Generations Count</div>
                                        <div className="text-2xl font-bold text-purple-600">{data.user._count.generations}</div>
                                        <div className="text-xs text-gray-400 mt-1">{data.user.totalGenerated} total tracked</div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Daily Activity */}
                                    <div className="bg-white p-4 rounded shadow-sm min-h-[300px]">
                                        <h4 className="font-semibold text-gray-700 mb-4">Daily Activity (Generations)</h4>
                                        <div className="h-64">
                                            <Line
                                                data={{
                                                    labels: data.stats.daily.map((d: any) => new Date(d.date).toLocaleDateString()),
                                                    datasets: [{
                                                        label: 'Generations',
                                                        data: data.stats.daily.map((d: any) => d.generationsCount),
                                                        borderColor: 'rgb(147, 51, 234)',
                                                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                                                        fill: true,
                                                        tension: 0.3
                                                    }]
                                                }}
                                                options={chartOptions}
                                            />
                                        </div>
                                    </div>

                                    {/* Daily Spending */}
                                    <div className="bg-white p-4 rounded shadow-sm min-h-[300px]">
                                        <h4 className="font-semibold text-gray-700 mb-4">Daily Spending (Credits)</h4>
                                        <div className="h-64">
                                            <Bar
                                                data={{
                                                    labels: data.stats.daily.map((d: any) => new Date(d.date).toLocaleDateString()),
                                                    datasets: [{
                                                        label: 'Credits Spent',
                                                        data: data.stats.daily.map((d: any) => d.spendingCredits),
                                                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                                    }]
                                                }}
                                                options={chartOptions}
                                            />
                                        </div>
                                    </div>

                                    {/* Top-ups */}
                                    <div className="bg-white p-4 rounded shadow-sm min-h-[300px] lg:col-span-2">
                                        <h4 className="font-semibold text-gray-700 mb-4">Daily Top-ups (Activity)</h4>
                                        <div className="h-64">
                                            <Bar
                                                data={{
                                                    labels: data.stats.daily.map((d: any) => new Date(d.date).toLocaleDateString()),
                                                    datasets: [
                                                        {
                                                            label: 'Credits Purchased',
                                                            data: data.stats.daily.map((d: any) => d.topupsCredits),
                                                            backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                                            yAxisID: 'y',
                                                        },
                                                        {
                                                            label: 'USD Value',
                                                            data: data.stats.daily.map((d: any) => d.topupsUsd),
                                                            backgroundColor: 'rgba(234, 179, 8, 0.6)',
                                                            yAxisID: 'y1',
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    ...chartOptions,
                                                    scales: {
                                                        y: {
                                                            type: 'linear',
                                                            display: true,
                                                            position: 'left',
                                                            title: { display: true, text: 'Credits' }
                                                        },
                                                        y1: {
                                                            type: 'linear',
                                                            display: true,
                                                            position: 'right',
                                                            grid: {
                                                                drawOnChartArea: false,
                                                            },
                                                            title: { display: true, text: 'USD' }
                                                        },
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata / Details */}
                                <div className="bg-white p-4 rounded shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-2">Technical Details</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Registered:</span>
                                            <div>{new Date(data.user.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Last Active:</span>
                                            <div>{new Date(data.user.lastActiveAt).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Free Credits Used:</span>
                                            <div>{data.user.freeCreditsUsed}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Is Subscribed:</span>
                                            <div>{data.user.isSubscribed ? 'Yes' : 'No'}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Telegram ID:</span>
                                            <div>{data.user.telegramId.toString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Referral Code:</span>
                                            <div>{data.user.referralCode}</div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
                        <button
                            className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 hover:text-gray-700"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={onClose}></div>
        </div>
    );
}
