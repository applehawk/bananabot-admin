'use client';

import { useState, useEffect } from 'react';
import UserDetailsModal from '@/components/UserDetailsModal';

interface ReferralUser {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    joinedAt: string;
    bonusGranted: boolean;
    firstPurchase: boolean;
    dateReferred: string;
}

interface ReferrerStats {
    referralsCount: number;
    payingReferralsCount: number;
    totalEarnedCredits: number;
    totalEarnedUsd: number;
}

interface Referrer {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    referralCode: string;
    joinedAt: string;
    stats: ReferrerStats;
    referrals: ReferralUser[];
}

export default function ReferralsPage() {
    const [data, setData] = useState<Referrer[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        try {
            const res = await fetch('/admin/api/referrals');
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            } else {
                console.error('Failed to fetch referrals');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (userId: string) => {
        setExpandedRow(expandedRow === userId ? null : userId);
    };

    const openUserModal = (userId: string) => {
        setSelectedUserId(userId);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <div className="mt-2 text-gray-500">Loading referrals...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Referral System</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paying Users</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Earned (Credits)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Earned (USD)</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((referrer) => (
                                <>
                                    <tr
                                        key={referrer.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => toggleRow(referrer.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openUserModal(referrer.id);
                                                    }}
                                                >
                                                    {referrer.firstName || referrer.username || 'Unknown'}
                                                    <span className="text-gray-500 text-sm ml-2">@{referrer.username}</span>
                                                </div>
                                                <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                    {referrer.referralCode}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {referrer.stats.referralsCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {referrer.stats.payingReferralsCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-green-600">
                                            {referrer.stats.totalEarnedCredits.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500">
                                            ${referrer.stats.totalEarnedUsd.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap text-gray-400">
                                            {expandedRow === referrer.id ? '▼' : '▶'}
                                        </td>
                                    </tr>

                                    {/* Expanded Details */}
                                    {expandedRow === referrer.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                                                    <div className="bg-gray-50 px-4 py-2 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                                                        Referred Users
                                                    </div>
                                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Joined</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Bonus</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">1st Purchase</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {referrer.referrals.map((ref) => (
                                                                <tr key={ref.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                                        <button
                                                                            className="text-blue-600 hover:text-blue-900 hover:underline text-left font-medium"
                                                                            onClick={() => openUserModal(ref.id)}
                                                                        >
                                                                            {ref.firstName || ref.username || 'Unknown'}
                                                                            <span className="text-gray-500 ml-1 font-normal">@{ref.username}</span>
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center whitespace-nowrap text-gray-500">
                                                                        {ref.dateReferred ? new Date(ref.dateReferred).toLocaleDateString() : '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                        {ref.bonusGranted ? (
                                                                            <span className="text-green-600">✅</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">❌</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                        {ref.firstPurchase ? (
                                                                            <span className="text-green-600">✅</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">❌</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {referrer.referrals.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                                                                        No referrals found
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No referral activity found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <UserDetailsModal
                    userId={selectedUserId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchReferrals}
                />
            </main>
        </div>
    );
}
