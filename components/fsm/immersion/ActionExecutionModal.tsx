import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ActionExecutionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    selectedCount: number;
    actionType: string;
    setActionType: (t: string) => void;
    actionConfig: any;
    setActionConfig: (c: any) => void;
    availablePackages: any[];
    loading: boolean;
    onExecute: () => void;
}

export function ActionExecutionModal({
    open,
    onOpenChange,
    trigger,
    selectedCount,
    actionType,
    setActionType,
    actionConfig,
    setActionConfig,
    availablePackages,
    loading,
    onExecute
}: ActionExecutionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Execute Action ({selectedCount} Users)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                            <button
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${actionType === 'SEND_MESSAGE' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                                onClick={() => setActionType('SEND_MESSAGE')}
                            >
                                Message & Offers
                            </button>
                            <button
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${actionType === 'TAG_USER' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                                onClick={() => setActionType('TAG_USER')}
                            >
                                Manage Tags
                            </button>
                        </div>

                        {actionType === 'TAG_USER' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">Tag Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g. vip_user"
                                    value={actionConfig.tag || ''}
                                    onChange={e => setActionConfig({ ...actionConfig, tag: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Message Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Message Text (HTML supported)</label>
                                    <textarea
                                        className="w-full border rounded p-2 h-24 font-mono text-sm"
                                        placeholder="Hello! Check out this offer..."
                                        value={actionConfig.message || ''}
                                        onChange={e => setActionConfig({ ...actionConfig, message: e.target.value })}
                                    />
                                </div>

                                {/* Special Offer Toggle */}
                                <div className="border rounded-md p-3 bg-gray-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold flex items-center gap-2">
                                            <span className="text-xl">🎁</span> Special Offer
                                        </label>
                                        <Switch
                                            checked={!!actionConfig.includeOffer}
                                            onCheckedChange={(c) => setActionConfig((prev: any) => ({ ...prev, includeOffer: c }))}
                                        />
                                    </div>

                                    {actionConfig.includeOffer && (
                                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex space-x-4 mb-3">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        checked={!actionConfig.isCustomPackage}
                                                        onChange={() => setActionConfig({ ...actionConfig, isCustomPackage: false, customPackage: undefined })}
                                                    />
                                                    <span className="ml-2 text-sm">Existing Package</span>
                                                </label>
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        checked={actionConfig.isCustomPackage}
                                                        onChange={() => setActionConfig({ ...actionConfig, isCustomPackage: true, packageId: undefined })}
                                                    />
                                                    <span className="ml-2 text-sm">Create Custom</span>
                                                </label>
                                            </div>

                                            {!actionConfig.isCustomPackage ? (
                                                <select
                                                    className="w-full p-2 border rounded bg-white"
                                                    value={actionConfig.packageId || ''}
                                                    onChange={(e) => setActionConfig({ ...actionConfig, packageId: e.target.value })}
                                                >
                                                    <option value="">-- Select a Package --</option>
                                                    {availablePackages.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} - {p.price}₽ ({p.credits} credits)
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Package Name"
                                                            className="w-full p-2 border rounded text-sm"
                                                            value={actionConfig.customPackage?.name || ''}
                                                            onChange={(e) => setActionConfig({
                                                                ...actionConfig,
                                                                customPackage: { ...actionConfig.customPackage, name: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="Price (₽)"
                                                        className="w-full p-2 border rounded text-sm"
                                                        value={actionConfig.customPackage?.price || ''}
                                                        onChange={(e) => setActionConfig({
                                                            ...actionConfig,
                                                            customPackage: { ...actionConfig.customPackage, price: e.target.value }
                                                        })}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Credits"
                                                        className="w-full p-2 border rounded text-sm"
                                                        value={actionConfig.customPackage?.credits || ''}
                                                        onChange={(e) => setActionConfig({
                                                            ...actionConfig,
                                                            customPackage: { ...actionConfig.customPackage, credits: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <details className="pt-2 border-t mt-4 group">
                                    <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-800 select-none flex items-center gap-1 mb-2">
                                        <span>⚡ Advanced: Run Conditions (JSON)</span>
                                    </summary>
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-xs text-muted-foreground">
                                            Execute action ONLY if conditions match. Example: <code className="bg-gray-100 px-1 rounded">[{`{"field": "credits", "operator": "LT", "value": "10"}`}]</code>
                                        </p>
                                        <textarea
                                            className="w-full border rounded p-2 h-20 font-mono text-xs bg-gray-50"
                                            placeholder='[{"field": "credits", "operator": "LT", "value": "10"}]'
                                            value={actionConfig.conditions ? (typeof actionConfig.conditions === 'string' ? actionConfig.conditions : JSON.stringify(actionConfig.conditions, null, 2)) : ''}
                                            onChange={e => setActionConfig({ ...actionConfig, conditions: e.target.value })}
                                        />
                                    </div>
                                </details>
                                <div className="border rounded-md p-3 bg-gray-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold flex items-center gap-2">
                                            <span className="text-xl">🔥</span> Burnable Bonus
                                        </label>
                                        <Switch
                                            checked={!!actionConfig.includeBonus}
                                            onCheckedChange={(c) => setActionConfig((prev: any) => ({ ...prev, includeBonus: c }))}
                                        />
                                    </div>

                                    {actionConfig.includeBonus && (
                                        <div className="pt-2 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                                                <input
                                                    type="number"
                                                    placeholder="Credits"
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={actionConfig.burnableBonus?.amount || ''}
                                                    onChange={(e) => setActionConfig({
                                                        ...actionConfig,
                                                        burnableBonus: { ...actionConfig.burnableBonus, amount: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                                                <input
                                                    type="number"
                                                    placeholder="Duration"
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={actionConfig.burnableBonus?.expiresInHours || '24'}
                                                    onChange={(e) => setActionConfig({
                                                        ...actionConfig,
                                                        burnableBonus: { ...actionConfig.burnableBonus, expiresInHours: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Condition (Optional)</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Generations req."
                                                        className="w-full p-2 border rounded text-sm"
                                                        value={actionConfig.burnableBonus?.conditionGenerations || ''}
                                                        onChange={(e) => setActionConfig({
                                                            ...actionConfig,
                                                            burnableBonus: { ...actionConfig.burnableBonus, conditionGenerations: e.target.value }
                                                        })}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="TopUp req."
                                                        className="w-full p-2 border rounded text-sm"
                                                        value={actionConfig.burnableBonus?.conditionTopUpAmount || ''}
                                                        onChange={(e) => setActionConfig({
                                                            ...actionConfig,
                                                            burnableBonus: { ...actionConfig.burnableBonus, conditionTopUpAmount: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={onExecute} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Execute'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
