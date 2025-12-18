import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Play } from 'lucide-react';

interface RulesPageHeaderProps {
    onCreateRule: () => void;
    onSimulate: () => void;
    searchText: string;
    onSearchChange: (val: string) => void;
    triggerFilter: string;
    onTriggerFilterChange: (val: string) => void;
}

const RULE_TRIGGERS = [
    'BOT_START', 'GENERATION_REQUESTED', 'GENERATION_COMPLETED', 'CREDITS_CHANGED',
    'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'TIME', 'ADMIN_EVENT', 'OVERLAY_ACTIVATED',
    'OVERLAY_EXPIRED', 'STATE_CHANGED', 'REFERRAL_INVITE', 'REFERRAL_PAID', 'STREAK_REACHED', 'INSUFFICIENT_CREDITS',
    'CHANNEL_SUBSCRIPTION'
];

export function RulesPageHeader({
    onCreateRule,
    onSimulate,
    searchText,
    onSearchChange,
    triggerFilter,
    onTriggerFilterChange
}: RulesPageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rules Engine</h1>
                    <p className="text-muted-foreground">Manage global automation rules and triggers.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onSimulate} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Play className="mr-2 h-4 w-4" /> Simulate
                    </Button>
                    <Button onClick={onCreateRule} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> New Rule
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-lg border shadow-sm items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-md"
                        placeholder="Search rules by code or description..."
                        value={searchText}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="w-64 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white appearance-none"
                        value={triggerFilter}
                        onChange={(e) => onTriggerFilterChange(e.target.value)}
                    >
                        <option value="">All Triggers</option>
                        {RULE_TRIGGERS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
