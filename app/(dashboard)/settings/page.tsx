'use client';

import { useState, useEffect } from 'react';
import DatabaseErrorAlert from '@/components/DatabaseErrorAlert';

import { SystemSettings } from '@prisma/client';

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [databaseError, setDatabaseError] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/admin/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Error:', error);
            setDatabaseError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        try {
            const res = await fetch('/admin/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to update settings');

            alert('Settings updated successfully');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">⚙️ Global Settings</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Margins & Pricing */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Margins & Pricing</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        System Margin (0.05 = 5%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.systemMargin}
                                        onChange={(e) => setSettings({ ...settings, systemMargin: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Global margin applied to all generations.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Credits per 1 USD
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={settings.creditsPerUsd}
                                        onChange={(e) => setSettings({ ...settings, creditsPerUsd: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Exchange rate for calculating credit costs. If 1 USD = 100 Credits, then $0.01 = 1 Credit.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Free Credits for New Users
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={settings.freeCreditsAmount}
                                        onChange={(e) => setSettings({ ...settings, freeCreditsAmount: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Referral Bonus Amount (Credits)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={settings.referralBonusAmount}
                                        onChange={(e) => setSettings({ ...settings, referralBonusAmount: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Amount of credits given to the referrer when a new user joins.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Purchase Bonus (Credits)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={settings.referralFirstPurchaseBonus}
                                        onChange={(e) => setSettings({ ...settings, referralFirstPurchaseBonus: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Bonus given to the referrer when their invited user makes their FIRST purchase.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* System Costs */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">System Costs</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hosting Cost (USD/month)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.hostingCost}
                                        onChange={(e) => setSettings({ ...settings, hostingCost: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        USD/RUB Rate
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.usdRubRate}
                                        onChange={(e) => setSettings({ ...settings, usdRubRate: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Telegram Subscription */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Telegram Subscription</h2>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        id="subscription-required"
                                        type="checkbox"
                                        checked={settings.isSubscriptionRequired}
                                        onChange={(e) => setSettings({ ...settings, isSubscriptionRequired: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="subscription-required" className="ml-2 block text-sm text-gray-900">
                                        Require Channel Subscription
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telegram Channel ID (e.g. @channelname or -100...)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.telegramChannelId || ''}
                                        onChange={(e) => setSettings({ ...settings, telegramChannelId: e.target.value })}
                                        placeholder="@channelname"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        The bot must be an admin in this channel to verify subscriptions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
