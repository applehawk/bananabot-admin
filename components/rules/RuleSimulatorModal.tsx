import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle, AlertCircle, UserSearch } from 'lucide-react';

const RULE_TRIGGERS = [
    'BOT_START', 'GENERATION_REQUESTED', 'GENERATION_COMPLETED', 'CREDITS_CHANGED',
    'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'TIME', 'ADMIN_EVENT', 'OVERLAY_ACTIVATED',
    'OVERLAY_EXPIRED', 'STATE_CHANGED', 'REFERRAL_INVITE', 'REFERRAL_PAID', 'STREAK_REACHED', 'INSUFFICIENT_CREDITS',
    'CHANNEL_SUBSCRIPTION'
];

interface RuleSimulatorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RuleSimulatorModal({ open, onOpenChange }: RuleSimulatorModalProps) {
    const [trigger, setTrigger] = useState('GENERATION_COMPLETED');
    const [contextJson, setContextJson] = useState('{\n  "credits": 0,\n  "lifecycle": "ACTIVE_FREE",\n  "totalGenerations": 5\n}');
    const [userId, setUserId] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);
    const [error, setError] = useState('');
    const [userError, setUserError] = useState('');

    const handleLoadUser = async () => {
        if (!userId.trim()) return;
        setLoadingUser(true);
        setUserError('');
        try {
            const res = await fetch(`/admin/api/users/${userId}/context`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('User not found');
                throw new Error('Failed to fetch user');
            }
            const data = await res.json();
            setContextJson(JSON.stringify(data, null, 2));
        } catch (e: any) {
            setUserError(e.message);
        } finally {
            setLoadingUser(false);
        }
    };

    const handleSimulate = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const context = JSON.parse(contextJson);

            const res = await fetch('/admin/api/rules/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger, context })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Simulation failed');
            }

            const data = await res.json();
            setResult(data);

        } catch (e: any) {
            console.error(e);
            if (e instanceof SyntaxError) {
                setError('Invalid JSON format');
            } else {
                setError(e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Rule Simulator Sandbox</DialogTitle>
                    <DialogDescription>Simulate a trigger event to see which rules would match.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* INPUTS */}
                    <div className="col-span-1 space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Trigger Event</label>
                            <select
                                className="w-full border rounded p-2 text-sm bg-white mt-1"
                                value={trigger}
                                onChange={e => setTrigger(e.target.value)}
                            >
                                {RULE_TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* User Loader */}
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                            <label className="text-xs font-bold uppercase text-blue-600 block mb-1">Load Real User Data</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 text-xs border rounded p-2"
                                    placeholder="User ID..."
                                    value={userId}
                                    onChange={e => setUserId(e.target.value)}
                                />
                                <Button size="sm" variant="outline" onClick={handleLoadUser} disabled={loadingUser}>
                                    {loadingUser ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserSearch className="h-3 w-3" />}
                                </Button>
                            </div>
                            {userError && <p className="text-[10px] text-red-500 mt-1">{userError}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Context (JSON)</label>
                            <textarea
                                className="w-full border rounded p-2 text-xs font-mono bg-gray-50 h-64 mt-1"
                                value={contextJson}
                                onChange={e => setContextJson(e.target.value)}
                            />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <Button className="w-full" onClick={handleSimulate} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            Simulate
                        </Button>
                    </div>

                    {/* RESULTS */}
                    <div className="col-span-1 border rounded bg-gray-50 p-4 overflow-y-auto h-[500px]">
                        <h3 className="font-bold text-sm mb-2">Results</h3>
                        {!result && !loading && <div className="text-sm text-gray-400 italic">Run simulation to see results.</div>}
                        {loading && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-gray-400" /></div>}

                        {result && (
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs border-b pb-2">
                                    <span>Total Rules Checked: <strong>{result.totalRules}</strong></span>
                                    <span>Matches: <strong className="text-green-600">{result.matchedRules.length}</strong></span>
                                </div>

                                {result.matchedRules.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No rules matched this context.
                                    </div>
                                )}

                                {result.matchedRules.map((r: any) => (
                                    <div key={r.id} className="bg-white border border-green-200 rounded p-3 shadow-sm border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-green-700">{r.code}</span>
                                            <span className="text-[10px] bg-gray-100 px-1 rounded">Pri: {r.priority}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">{r.description}</p>

                                        <div className="space-y-1">
                                            {r.actions.map((a: any, i: number) => (
                                                <div key={i} className="text-[10px] font-mono text-gray-500 bg-gray-50 p-1 rounded">
                                                    {a.type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
