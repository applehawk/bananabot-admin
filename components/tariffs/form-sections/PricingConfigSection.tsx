import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;

interface PricingConfigSectionProps {
    formData: Partial<ModelTariff>;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
}

export function PricingConfigSection({ formData, onFieldChange }: PricingConfigSectionProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Price Unit</label>
                <select
                    value={formData.priceUnit || ''}
                    onChange={(e) => onFieldChange('priceUnit', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="per_million_tokens">Per Million Tokens</option>
                    <option value="per_second">Per Second</option>
                    <option value="per_credit">Per Credit</option>
                    <option value="per_generation">Per Generation</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Model Margin (0.1 = 10%)</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.modelMargin || 0}
                    onChange={(e) => onFieldChange('modelMargin', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="flex items-center space-x-2 pt-8">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => onFieldChange('isActive', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-700">Active</span>
                </label>
            </div>
        </div>
    );
}
