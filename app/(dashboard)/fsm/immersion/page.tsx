'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { StateStat } from '@/components/fsm/immersion/types';
import { ImmersionHeader } from '@/components/fsm/immersion/ImmersionHeader';
import { StateCard } from '@/components/fsm/immersion/StateCard';

export default function FSMImmersionPage() {
    const [stats, setStats] = useState<StateStat[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [versionId, setVersionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [immersionLoading, setImmersionLoading] = useState(false);

    // Global Toggle
    const [isFsmEnabled, setIsFsmEnabled] = useState(false);

    // Common Data
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchSettings();
        fetchPackages();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/api/fsm/stats');
            const data = await res.json();
            if (data.stateDistribution) {
                setStats(data.stateDistribution);
                setTotalUsers(data.totalActiveUsers);
                setVersionId(data.versionId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        // Placeholder for fetching FSM global setting
    };

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/credits/packages');
            if (res.ok) {
                const data = await res.json();
                setAvailablePackages(data);
            }
        } catch (e) { console.error("Failed to load packages", e); }
    };

    const handleImmersion = async () => {
        if (!confirm("This will replay history for users and reset their FSM state. Continue?")) return;
        setImmersionLoading(true);
        try {
            const res = await fetch('/admin/api/fsm/immersion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Immersion started/completed. Processed: ${data.processed}`);
                fetchStats();
            }
        } catch (e) {
            alert('Error during immersion');
        } finally {
            setImmersionLoading(false);
        }
    };

    const handleToggleFsm = async (enabled: boolean) => {
        setIsFsmEnabled(enabled); // Optimistic
        try {
            await fetch('/admin/api/settings/fsm-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
        } catch (e) {
            console.error(e);
            setIsFsmEnabled(!enabled); // Revert
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ImmersionHeader
                isFsmEnabled={isFsmEnabled}
                onToggleFsm={handleToggleFsm}
                immersionLoading={immersionLoading}
                onRunImmersion={handleImmersion}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stats.map(state => (
                            <StateCard
                                key={state.stateId}
                                state={state}
                                availablePackages={availablePackages}
                                onRefreshStats={fetchStats}
                            />
                        ))}
                    </div>

                    {!loading && stats.length === 0 && (
                        <Alert className="bg-white border-blue-200">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertTitle className="text-blue-700">No FSM Data</AlertTitle>
                            <AlertDescription className="text-blue-600">No active version or users found. Try running Immersion.</AlertDescription>
                        </Alert>
                    )}
                </div>
            </main>
        </div>
    );
}
