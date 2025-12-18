import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;
type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

interface CalculatedPrices {
    inputImage: number;
    lowRes: number;
    highRes: number;
}

interface ImagePricingSectionProps {
    modelType: ModelType;
    formData: Partial<ModelTariff>;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
    calculatedPrices: CalculatedPrices;
}

export function ImagePricingSection({ modelType, formData, onFieldChange, calculatedPrices }: ImagePricingSectionProps) {
    // Only show for IMAGE, VIDEO, AUDIO, or MULTIMODAL models
    if (modelType === 'TEXT') return null;

    return (
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Multimedia Tokens & Pricing</h3>

            {(modelType === 'IMAGE' || modelType === 'MULTIMODAL') && (
                <>
                    {/* Input Image Section */}
                    <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium text-gray-700 mb-3">📥 Input Image Processing</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Image Input Price ($/1M Tokens)</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={formData.inputPrice || 0}
                                    onChange={(e) => onFieldChange('inputPrice', Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Tokens per Input Image</label>
                                <input
                                    type="number"
                                    value={formData.inputImageTokens || ''}
                                    onChange={(e) => onFieldChange('inputImageTokens', Number(e.target.value) || undefined)}
                                    placeholder="e.g. 560"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Max Input Images</label>
                                <input
                                    type="number"
                                    value={formData.inputImagesLimit || 5}
                                    onChange={(e) => onFieldChange('inputImagesLimit', Number(e.target.value) || 5)}
                                    placeholder="e.g. 5"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">💰 Cost per Input Image</label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-green-50 border-green-200 text-green-900 font-semibold">
                                    ${calculatedPrices.inputImage.toFixed(6)}
                                </div>
                                <p className="text-xs text-gray-500">inputImageTokens × inputPrice / 1M</p>
                            </div>
                        </div>
                    </div>

                    {/* Output Image Section */}
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-700 mb-3">📤 Output Image Generation</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Output Image Price ($/1M tokens)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.outputImagePrice || ''}
                                    onChange={(e) => onFieldChange('outputImagePrice', Number(e.target.value) || undefined)}
                                    placeholder="e.g. 120.00"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Tokens for Low-Res Output (≤2K)</label>
                                <input
                                    type="number"
                                    value={formData.imageTokensLowRes || ''}
                                    onChange={(e) => onFieldChange('imageTokensLowRes', Number(e.target.value) || undefined)}
                                    placeholder="e.g. 1120"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Tokens for Hi-Res Output (4K+)</label>
                                <input
                                    type="number"
                                    value={formData.imageTokensHighRes || ''}
                                    onChange={(e) => onFieldChange('imageTokensHighRes', Number(e.target.value) || undefined)}
                                    placeholder="e.g. 2000"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        {/* Calculated prices */}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">💰 Cost per Low-Res Output</label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-900 font-semibold">
                                    ${calculatedPrices.lowRes.toFixed(6)}
                                </div>
                                <p className="text-xs text-gray-500">imageTokensLowRes × outputImagePrice / 1M</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">💰 Cost per Hi-Res Output</label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-900 font-semibold">
                                    ${calculatedPrices.highRes.toFixed(6)}
                                </div>
                                <p className="text-xs text-gray-500">imageTokensHighRes × outputImagePrice / 1M</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {(modelType === 'VIDEO' || modelType === 'AUDIO') && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Credits Per Second</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.creditsPerSecond || ''}
                        onChange={(e) => onFieldChange('creditsPerSecond', Number(e.target.value) || undefined)}
                        placeholder="e.g. 0.15"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}
        </div>
    );
}
