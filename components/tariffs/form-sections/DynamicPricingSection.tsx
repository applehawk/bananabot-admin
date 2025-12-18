import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;
type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

interface DynamicPricingSectionProps {
    modelType: ModelType;
    formData: Partial<ModelTariff>;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
}

export function DynamicPricingSection({ modelType, formData, onFieldChange }: DynamicPricingSectionProps) {
    // Don't show for IMAGE models (they have separate section)
    if (modelType === 'IMAGE') return null;

    return (
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Pricing Details</h3>
            <div className="grid grid-cols-3 gap-4">
                {(modelType === 'TEXT' || modelType === 'MULTIMODAL') && (
                    <>
                        {modelType === 'TEXT' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Input Price ($/1M)</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={formData.inputPrice || 0}
                                    onChange={(e) => onFieldChange('inputPrice', Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {modelType === 'MULTIMODAL' ? 'Text Output Price ($/1M)' : 'Output Price ($/1M)'}
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.outputPrice || 0}
                                onChange={(e) => onFieldChange('outputPrice', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </>
                )}

                {(modelType === 'VIDEO' || modelType === 'MULTIMODAL') && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Video Price ($/sec)</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={formData.outputVideoPrice || 0}
                            onChange={(e) => onFieldChange('outputVideoPrice', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}

                {(modelType === 'AUDIO' || modelType === 'MULTIMODAL') && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Audio Price ($/min)</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={formData.outputAudioPrice || 0}
                            onChange={(e) => onFieldChange('outputAudioPrice', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
