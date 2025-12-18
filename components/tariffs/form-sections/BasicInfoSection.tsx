import { Prisma, Provider } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;
type ModelType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MULTIMODAL';

interface BasicInfoSectionProps {
    formData: Partial<ModelTariff>;
    providers: Provider[];
    modelType: ModelType;
    onFieldChange: (field: keyof ModelTariff, value: any) => void;
    onModelTypeChange: (type: ModelType) => void;
}

export function BasicInfoSection({ formData, providers, modelType, onFieldChange, onModelTypeChange }: BasicInfoSectionProps) {
    return (
        <>
            {/* Top Row: Provider, Model ID, Model Type */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <select
                        value={formData.providerId || ''}
                        onChange={(e) => onFieldChange('providerId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">Select Provider</option>
                        {providers.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Model ID</label>
                    <input
                        required
                        value={formData.modelId || ''}
                        onChange={(e) => onFieldChange('modelId', e.target.value)}
                        placeholder="e.g. gemini-1.5-pro"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Model Type</label>
                    <select
                        value={modelType}
                        onChange={(e: any) => onModelTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="TEXT">Text Generation</option>
                        <option value="IMAGE">Image Generation</option>
                        <option value="VIDEO">Video Generation</option>
                        <option value="AUDIO">Audio Generation</option>
                        <option value="MULTIMODAL">Multimodal</option>
                    </select>
                </div>
            </div>

            {/* Name & Display Name */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        required
                        value={formData.name || ''}
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        placeholder="e.g. Gemini 1.5 Pro"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <input
                        value={formData.displayName || ''}
                        onChange={(e) => onFieldChange('displayName', e.target.value)}
                        placeholder="e.g. Gemini 1.5 Pro (Preview)"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                    value={formData.description || ''}
                    onChange={(e) => onFieldChange('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </>
    );
}
