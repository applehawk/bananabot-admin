import { Prisma } from '@prisma/client';

type ModelTariff = Prisma.ModelTariffGetPayload<{ include: { provider: true } }>;

interface CapabilitiesSectionProps {
    formData: Partial<ModelTariff>;
}

export function CapabilitiesSection({ formData }: CapabilitiesSectionProps) {
    return (
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Capabilities (Auto-set by Model Type)</h3>
            <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.hasImageGeneration}
                        readOnly
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Image Gen</label>
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.hasVideoGeneration}
                        readOnly
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Video Gen</label>
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.hasNativeAudio}
                        readOnly
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Audio</label>
                </div>
            </div>
        </div>
    );
}
