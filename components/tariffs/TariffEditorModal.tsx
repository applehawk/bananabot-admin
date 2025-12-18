'use client';

import { useState, useEffect } from 'react';
import { Prisma, Provider } from '@prisma/client';
import { BasicInfoSection } from './form-sections/BasicInfoSection';
import { APIDetailsSection } from './form-sections/APIDetailsSection';
import { PricingConfigSection } from './form-sections/PricingConfigSection';
import { DynamicPricingSection } from './form-sections/DynamicPricingSection';
import { ImagePricingSection } from './form-sections/ImagePricingSection';
import { TechnicalParametersSection } from './form-sections/TechnicalParametersSection';
import { CapabilitiesSection } from './form-sections/CapabilitiesSection';

type ModelTariff = Prisma.ModelTariffGetPayload<{
    include: {
        provider: true;
    }
}>;

type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

interface TariffEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tariff: ModelTariff | null;
    providers: Provider[];
    onSave: (data: Partial<ModelTariff>) => Promise<void>;
}

export function TariffEditorModal({ isOpen, onClose, tariff, providers, onSave }: TariffEditorModalProps) {
    const [modelType, setModelType] = useState<ModelType>('TEXT');
    const [syncModelName, setSyncModelName] = useState(true);
    const [calculatedInputImagePrice, setCalculatedInputImagePrice] = useState<number>(0);
    const [calculatedLowResPrice, setCalculatedLowResPrice] = useState<number>(0);
    const [calculatedHighResPrice, setCalculatedHighResPrice] = useState<number>(0);

    const [formData, setFormData] = useState<Partial<ModelTariff>>({
        isActive: true,
        hasNativeAudio: false,
        hasImageGeneration: false,
        hasVideoGeneration: false,
        modelMargin: 0,
        supportedResolutions: [],
    });

    // Initialize form data when tariff changes
    useEffect(() => {
        if (tariff) {
            setFormData(tariff);
            setSyncModelName(tariff.modelId === tariff.modelNameOnProvider);
            // Infer model type from flags
            if (tariff.hasVideoGeneration) setModelType('VIDEO');
            else if (tariff.hasImageGeneration) setModelType('IMAGE');
            else if (tariff.hasNativeAudio) setModelType('AUDIO');
            else setModelType('TEXT');
        } else {
            setFormData({
                isActive: true,
                hasNativeAudio: false,
                hasImageGeneration: false,
                hasVideoGeneration: false,
                modelMargin: 0,
                priceUnit: 'per_million_tokens',
                supportedResolutions: [],
            });
            setModelType('TEXT');
            setSyncModelName(true);
        }
    }, [tariff]);

    // Update boolean flags based on model type
    useEffect(() => {
        const updates: Partial<ModelTariff> = {};
        switch (modelType) {
            case 'TEXT':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = false;
                break;
            case 'IMAGE':
                updates.hasImageGeneration = true;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = false;
                break;
            case 'VIDEO':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = true;
                updates.hasNativeAudio = false;
                break;
            case 'AUDIO':
                updates.hasImageGeneration = false;
                updates.hasVideoGeneration = false;
                updates.hasNativeAudio = true;
                break;
            case 'MULTIMODAL':
                updates.hasImageGeneration = true;
                updates.hasVideoGeneration = true;
                updates.hasNativeAudio = true;
                break;
        }
        setFormData(prev => ({ ...prev, ...updates }));
    }, [modelType]);

    // Sync modelNameOnProvider with modelId
    useEffect(() => {
        if (syncModelName && formData.modelId) {
            setFormData(prev => ({ ...prev, modelNameOnProvider: formData.modelId }));
        }
    }, [formData.modelId, syncModelName]);

    // Calculate image generation prices
    useEffect(() => {
        const inputPrice = formData.inputPrice || 0;
        const outputImagePrice = formData.outputImagePrice || 0;
        const inputImageTokens = formData.inputImageTokens || 0;
        const lowResTokens = formData.imageTokensLowRes || 0;
        const highResTokens = formData.imageTokensHighRes || 0;

        setCalculatedInputImagePrice((inputImageTokens / 1_000_000) * inputPrice);
        setCalculatedLowResPrice((lowResTokens / 1_000_000) * outputImagePrice);
        setCalculatedHighResPrice((highResTokens / 1_000_000) * outputImagePrice);
    }, [formData.inputPrice, formData.outputImagePrice, formData.inputImageTokens, formData.imageTokensLowRes, formData.imageTokensHighRes]);

    const handleFieldChange = (field: keyof ModelTariff, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    if (!isOpen) return null;

    const calculatedPrices = {
        inputImage: calculatedInputImagePrice,
        lowRes: calculatedLowResPrice,
        highRes: calculatedHighResPrice,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">
                        {tariff ? 'Edit Tariff' : 'Add Tariff'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <BasicInfoSection
                        formData={formData}
                        providers={providers}
                        modelType={modelType}
                        onFieldChange={handleFieldChange}
                        onModelTypeChange={setModelType}
                    />

                    <APIDetailsSection
                        formData={formData}
                        syncModelName={syncModelName}
                        onFieldChange={handleFieldChange}
                        onSyncChange={setSyncModelName}
                    />

                    <PricingConfigSection
                        formData={formData}
                        onFieldChange={handleFieldChange}
                    />

                    <DynamicPricingSection
                        modelType={modelType}
                        formData={formData}
                        onFieldChange={handleFieldChange}
                    />

                    <ImagePricingSection
                        modelType={modelType}
                        formData={formData}
                        onFieldChange={handleFieldChange}
                        calculatedPrices={calculatedPrices}
                    />

                    <TechnicalParametersSection
                        modelType={modelType}
                        formData={formData}
                        onFieldChange={handleFieldChange}
                    />

                    <CapabilitiesSection formData={formData} />

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
