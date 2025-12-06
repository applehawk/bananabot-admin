'use client';

interface Generation {
    id: string;
    type: string;
    prompt: string;
    negativePrompt?: string | null;
    enhancedPrompt?: string | null;
    status: string;
    creditsUsed: number;
    createdAt: string;
    completedAt?: string | null;
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    errorMessage?: string | null;
    processingTime?: number | null;
    aspectRatio?: string;
    numberOfImages?: number;
    safetyLevel?: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    totalCostUsd?: number | null;
    costDetails?: any;
    metadata?: any;
    user: { username: string | null; firstName: string | null; telegramId: string };
    model?: { name: string; providerId: string } | null;
    inputImages?: { fileUrl: string | null }[];
}

interface GenerationDetailsModalProps {
    generation: Generation | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function GenerationDetailsModal({ generation, isOpen, onClose }: GenerationDetailsModalProps) {
    if (!isOpen || !generation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none bg-black/50 backdrop-blur-sm">
            <div className="relative z-50 w-full max-w-4xl mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                        <div>
                            <h3 className="text-2xl font-semibold">
                                Generation Details
                            </h3>
                            <div className="mt-1 flex gap-2">
                                <span className="font-mono text-xs text-gray-500">{generation.id}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${generation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        generation.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                            generation.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                    }`}>
                                    {generation.status}
                                </span>
                            </div>
                        </div>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none opacity-50 hover:opacity-100"
                            onClick={onClose}
                        >
                            <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                                ×
                            </span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative p-6 flex-auto overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Image & Prompts */}
                            <div className="space-y-6">
                                {/* Result Image */}
                                {generation.imageUrl && (
                                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={generation.imageUrl}
                                            alt="Generation Result"
                                            className="w-full h-auto object-contain max-h-[400px]"
                                        />
                                    </div>
                                )}

                                {/* Input Images (for Image-to-Image) */}
                                {generation.inputImages && generation.inputImages.length > 0 && (
                                    <div>
                                        <span className="block text-gray-700 text-sm font-bold mb-2">Input Images</span>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {generation.inputImages.map((img, idx) => (
                                                img.fileUrl && (
                                                    <div key={idx} className="h-24 w-24 flex-shrink-0 rounded border border-gray-200 overflow-hidden">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img.fileUrl} alt={`Input ${idx}`} className="w-full h-full object-cover" />
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span className="block text-gray-700 text-sm font-bold mb-1">Prompt</span>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
                                        {generation.prompt}
                                    </div>
                                </div>

                                {generation.enhancedPrompt && (
                                    <div>
                                        <span className="block text-gray-700 text-sm font-bold mb-1 text-purple-700">Enhanced Prompt</span>
                                        <div className="p-3 bg-purple-50 rounded border border-purple-100 text-sm text-gray-800 whitespace-pre-wrap">
                                            {generation.enhancedPrompt}
                                        </div>
                                    </div>
                                )}

                                {generation.negativePrompt && (
                                    <div>
                                        <span className="block text-gray-700 text-sm font-bold mb-1 text-red-700">Negative Prompt</span>
                                        <div className="p-3 bg-red-50 rounded border border-red-100 text-sm text-gray-800 whitespace-pre-wrap">
                                            {generation.negativePrompt}
                                        </div>
                                    </div>
                                )}

                                {generation.errorMessage && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        <span className="font-bold block mb-1">Error:</span>
                                        {generation.errorMessage}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Details & Stats */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">User</span>
                                        <div className="text-sm font-medium text-blue-600">
                                            {generation.user.firstName || generation.user.username}
                                            <div className="text-xs text-gray-400 font-normal">{generation.user.telegramId}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Type</span>
                                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded inline-block">
                                            {generation.type}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Model</span>
                                        <div className="text-sm font-medium">
                                            {generation.model?.name || 'Unknown'}
                                            {generation.model?.providerId && (
                                                <span className="ml-1 text-xs text-gray-500">({generation.model.providerId})</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Created At</span>
                                        <div className="text-sm">
                                            {new Date(generation.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Cost</span>
                                        <div className="text-sm font-medium text-gray-900">
                                            {generation.creditsUsed.toFixed(2)} Credits
                                            {generation.totalCostUsd && (
                                                <span className="ml-1 text-xs text-gray-500">
                                                    (${generation.totalCostUsd.toFixed(4)})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Processing Time</span>
                                        <div className="text-sm">
                                            {generation.processingTime ? `${(generation.processingTime / 1000).toFixed(1)}s` : '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Aspect Ratio</span>
                                        <div className="text-sm">{generation.aspectRatio || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Safety Level</span>
                                        <div className="text-sm text-gray-600 text-xs">{generation.safetyLevel || '-'}</div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4 pt-4">
                                    <h4 className="text-xs uppercase font-bold text-gray-500 mb-3">Token Usage</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <div className="text-xs text-gray-500">Input</div>
                                            <div className="font-mono text-sm">{generation.inputTokens || 0}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <div className="text-xs text-gray-500">Output</div>
                                            <div className="font-mono text-sm">{generation.outputTokens || 0}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <div className="text-xs text-gray-500">Total</div>
                                            <div className="font-mono text-sm font-bold">{generation.totalTokens || 0}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata JSON */}
                                {generation.metadata && (
                                    <div className="mt-4">
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-2">Metadata</span>
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3 overflow-x-auto max-h-40 overflow-y-auto">
                                            <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                                {JSON.stringify(generation.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Cost Details JSON */}
                                {generation.costDetails && (
                                    <div className="mt-4">
                                        <span className="block text-gray-500 text-xs uppercase font-bold mb-2">Cost Breakdown</span>
                                        <div className="bg-green-50 rounded border border-green-100 p-3 overflow-x-auto max-h-40 overflow-y-auto">
                                            <pre className="text-xs text-green-900 font-mono whitespace-pre-wrap">
                                                {JSON.stringify(generation.costDetails, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
                        <button
                            className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 hover:text-gray-700"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={onClose}></div>
        </div>
    );
}
