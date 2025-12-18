import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;
type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

interface TechnicalParametersSectionProps {
    modelType: ModelType;
    formData: Partial<ModelTariff>;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
}

export function TechnicalParametersSection({ modelType, formData, onFieldChange }: TechnicalParametersSectionProps) {
    return (
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Technical Parameters</h3>
            <div className="grid grid-cols-3 gap-4">
                {(modelType === 'IMAGE' || modelType === 'MULTIMODAL') && (
                    <>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Max Image Resolution</label>
                            <input
                                value={formData.maxImageResolution || ''}
                                onChange={(e) => onFieldChange('maxImageResolution', e.target.value)}
                                placeholder="e.g. 4096x4096"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Supported Resolutions</label>
                            <div className="flex flex-wrap gap-2">
                                {['1024x1024', '1024x1792', '1792x1024', '2048x2048', '4096x4096'].map((res) => (
                                    <button
                                        key={res}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.supportedResolutions || [];
                                            if (current.includes(res)) {
                                                onFieldChange('supportedResolutions', current.filter((r) => r !== res));
                                            } else {
                                                onFieldChange('supportedResolutions', [...current, res]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${(formData.supportedResolutions || []).includes(res)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {(modelType === 'VIDEO' || modelType === 'MULTIMODAL') && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Max Video Duration (seconds)</label>
                        <input
                            type="number"
                            value={formData.maxVideoDuration || ''}
                            onChange={(e) => onFieldChange('maxVideoDuration', Number(e.target.value) || undefined)}
                            placeholder="e.g. 60"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
