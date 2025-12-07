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

    if (loading) return <div className="p-8 text-white">Loading referrals...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Referral System</h1>

            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Referrer</th>
                            <th className="px-6 py-3 text-center">Referrals</th>
                            <th className="px-6 py-3 text-center">Paying Users</th>
                            <th className="px-6 py-3 text-right">Earned (Credits)</th>
                            <th className="px-6 py-3 text-right">Earned (USD)</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.map((referrer) => (
                            <>
                                <tr
                                    key={referrer.id}
                                    className="hover:bg-gray-750 cursor-pointer transition-colors"
                                    onClick={() => toggleRow(referrer.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="font-medium text-white hover:underline hover:text-blue-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openUserModal(referrer.id);
                                                }}
                                            >
                                                {referrer.firstName || referrer.username || 'Unknown'}
                                                <span className="text-gray-500 text-sm ml-2">@{referrer.username}</span>
                                            </div>
                                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400 font-mono">
                                                {referrer.referralCode}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-blue-900 text-blue-200 py-1 px-3 rounded-full text-xs font-bold">
                                            {referrer.stats.referralsCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-green-900 text-green-200 py-1 px-3 rounded-full text-xs font-bold">
                                            {referrer.stats.payingReferralsCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-400">
                                        {referrer.stats.totalEarnedCredits.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400">
                                        ${referrer.stats.totalEarnedUsd.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xl">
                                            {expandedRow === referrer.id ? '🔽' : '▶️'}
                                        </span>
                                    </td>
                                </tr>

                                {/* Expanded Details */}
                                {expandedRow === referrer.id && (
                                    <tr className="bg-gray-900/50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="bg-gray-800 rounded-md border border-gray-700 overflow-hidden">
                                                <div className="bg-gray-750 px-4 py-2 text-xs font-bold uppercase text-gray-500 border-b border-gray-700">
                                                    Referred Users
                                                </div>
                                                <table className="w-full text-sm">
                                                    <thead className="text-gray-500 bg-gray-800/50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">User</th>
                                                            <th className="px-4 py-2 text-center">Joined</th>
                                                            <th className="px-4 py-2 text-center">Bonus</th>
                                                            <th className="px-4 py-2 text-center">1st Purchase</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700/50">
                                                        {referrer.referrals.map((ref) => (
                                                            <tr key={ref.id} className="hover:bg-gray-700/30">
                                                                <td className="px-4 py-2">
                                                                    <button
                                                                        className="text-blue-400 hover:underline text-left"
                                                                        onClick={() => openUserModal(ref.id)}
                                                                    >
                                                                        {ref.firstName || ref.username || 'Unknown'}
                                                                        <span className="text-gray-500 ml-1">@{ref.username}</span>
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-2 text-center text-gray-500">
                                                                    {new Date(ref.dateReferred).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {ref.bonusGranted ? '✅' : '❌'}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {ref.firstPurchase ? '✅' : '❌'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserDetailsModal
                userId={selectedUserId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={fetchReferrals}
            />
        </div>
    );
}
