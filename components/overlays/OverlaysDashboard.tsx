'use client';

import { useState } from 'react';
import OverlayList from './OverlayList';
import OverlayAnalytics from './OverlayAnalytics';
import OverlayQueue from './OverlayQueue';
import Link from 'next/link';

interface OverlaysDashboardProps {
    overlays: any[];
}

export default function OverlaysDashboard({ overlays }: OverlaysDashboardProps) {
    const [activeTab, setActiveTab] = useState<'OVERLAYS' | 'ANALYTICS' | 'QUEUE'>('OVERLAYS');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Overlays Engine</h1>
                    <p className="text-muted-foreground">Manage popups, bonuses, and special offers.</p>
                </div>
                <Link
                    href="/overlays/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm"
                >
                    + Create Overlay
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['OVERLAYS', 'ANALYTICS', 'QUEUE'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'OVERLAYS' && <OverlayList overlays={overlays} />}
                {activeTab === 'ANALYTICS' && <OverlayAnalytics />}
                {activeTab === 'QUEUE' && <OverlayQueue />}
            </div>
        </div>
    );
}
