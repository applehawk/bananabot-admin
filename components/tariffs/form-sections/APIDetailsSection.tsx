import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;

interface APIDetailsSectionProps {
    formData: Partial<ModelTariff>;
    syncModelName: boolean;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
    onSyncChange: (sync: boolean) => void;
}

export function APIDetailsSection({ formData, syncModelName, onFieldChange, onSyncChange }: APIDetailsSectionProps) {
    return (
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">API Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Model Name on Provider</label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={syncModelName}
                                onChange={(e) => {
                                    onSyncChange(e.target.checked);
                                    if (e.target.checked && formData.modelId) {
                                        onFieldChange('modelNameOnProvider', formData.modelId);
                                    }
                                }}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-xs text-gray-600">Copy from Model ID</span>
                        </label>
                    </div>
                    <input
                        value={formData.modelNameOnProvider || ''}
                        onChange={(e) => {
                            onFieldChange('modelNameOnProvider', e.target.value);
                            onSyncChange(false);
                        }}
                        placeholder="e.g. gemini-1.5-pro-002"
                        disabled={syncModelName}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Endpoint URL</label>
                    <input
                        value={(formData.endpoints as any)?.url || ''}
                        onChange={(e) => onFieldChange('endpoints', { url: e.target.value } as any)}
                        placeholder="https://api.example.com/v1/generate"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
