'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Overlay, OverlayType, LifecycleState, OverlayVariant } from '@prisma/client';
import PayloadEditor from './PayloadEditor';
import VariantManager from './VariantManager';
import TelegramPreview from './TelegramPreview';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { createOverlay, updateOverlay } from '@/app/actions/overlay-actions';

// Constants
const OVERLAY_TYPES = ['TRIPWIRE', 'BONUS', 'REFERRAL', 'SPECIAL_OFFER', 'ONBOARDING', 'INFO'];
const LIFECYCLE_STATES = ['NEW', 'ACTIVATING', 'ACTIVE_FREE', 'PAYWALL', 'PAID_ACTIVE', 'INACTIVE', 'CHURNED', 'BLOCKED'];

interface OverlayEditorProps {
    overlay?: Overlay & { variants: OverlayVariant[] };
}

export default function OverlayEditor({ overlay }: OverlayEditorProps) {
    const router = useRouter();
    const isNew = !overlay;

    // Form State
    const [formData, setFormData] = useState<Partial<Overlay>>(overlay || {
        type: 'TRIPWIRE',
        isActive: true,
        priority: 0,
        payload: {},
        allowedLifecycleStates: [],
        blockedByTypes: []
    });

    const [activeTab, setActiveTab] = useState<'GENERAL' | 'RULES' | 'CONTENT' | 'TESTING'>('GENERAL');
    const [isSaving, setIsSaving] = useState(false);

    // Helpers
    const updateField = (field: keyof Overlay, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayItem = (field: 'allowedLifecycleStates' | 'blockedByTypes', item: string) => {
        const current = (formData[field] as string[]) || [];
        if (current.includes(item)) {
            updateField(field, current.filter(i => i !== item));
        } else {
            updateField(field, [...current, item]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = isNew
            ? await createOverlay(formData)
            : await updateOverlay(overlay!.id, formData);

        setIsSaving(false);
        if (res.success) {
            if (isNew && res.overlay) {
                router.push(`/admin/overlays/${res.overlay.id}`);
            } else {
                router.refresh();
                alert('Saved successfully!');
            }
        } else {
            alert('Error: ' + res.error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col min-h-[600px]">
            {/* Header */}
            <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{isNew ? 'Create Overlay' : `Edit Overlay: ${formData.code}`}</h2>
                    {!isNew && <p className="text-xs text-gray-500">ID: {overlay!.id}</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">Back</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {['GENERAL', 'RULES', 'CONTENT', 'TESTING'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code (Unique)</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.code || ''}
                                onChange={e => updateField('code', e.target.value)}
                                disabled={!isNew}
                            />
                            <p className="text-xs text-gray-400 mt-1">Unique identifier used by system (e.g. TRIPWIRE_DEFAULT)</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                            <select
                                className="w-full border rounded p-2"
                                value={formData.type}
                                onChange={e => updateField('type', e.target.value)}
                            >
                                {OVERLAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={formData.priority || 0}
                                onChange={e => updateField('priority', Number(e.target.value))}
                            />
                            <p className="text-xs text-gray-400 mt-1">Higher number = Higher priority (suppresses lower)</p>
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox" id="isActive"
                                className="w-5 h-5 text-indigo-600"
                                checked={formData.isActive || false}
                                onChange={e => updateField('isActive', e.target.checked)}
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">Is Active</label>
                        </div>
                    </div>
                )}

                {activeTab === 'RULES' && (
                    <div className="space-y-8 max-w-4xl">
                        {/* Delivery Rules */}
                        <section>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4">Delivery Constraints</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 flex items-center mb-1">
                                        TTL (Seconds)
                                        <InfoTooltip content="Time To Live. Determines how long the overlay remains relevant. If the user doesn't see it within this time (e.g. doesn't open the bot), the overlay expires and is never shown. 0 = Forever." />
                                    </label>
                                    <input type="number" className="border rounded p-2 w-full"
                                        value={formData.ttlSeconds || ''} onChange={e => updateField('ttlSeconds', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 flex items-center mb-1">
                                        Cooldown (Sec)
                                        <InfoTooltip content="Minimum time that must pass after THIS specific overlay is shown before it can be shown again to the same user. Prevents spamming the same offer." />
                                    </label>
                                    <input type="number" className="border rounded p-2 w-full"
                                        value={formData.cooldownSeconds || ''} onChange={e => updateField('cooldownSeconds', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 flex items-center mb-1">
                                        Max Impressions
                                        <InfoTooltip content="Hard limit on how many times this overlay can be shown to a single user. Once reached, it will never show again. 0 = Unlimited." />
                                    </label>
                                    <input type="number" className="border rounded p-2 w-full"
                                        value={formData.maxImpressions || ''} onChange={e => updateField('maxImpressions', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 flex items-center mb-1">
                                        Default Delay (Sec)
                                        <InfoTooltip content="Wait time before showing the overlay after the trigger event occurs. Use this to avoid interrupting the user immediately or to create suspense." />
                                    </label>
                                    <input type="number" className="border rounded p-2 w-full"
                                        value={formData.defaultDelaySeconds || ''} onChange={e => updateField('defaultDelaySeconds', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="text-xs text-gray-500 flex items-center mb-1">
                                    Allowed Time Window
                                    <InfoTooltip content="Limits delivery to specific hours (format HH:mm-HH:mm, 24h). Useful for push notifications or time-sensitive offers (e.g. 09:00-21:00)." />
                                </label>
                                <input className="border rounded p-2 w-48"
                                    value={formData.allowedTimeWindow || ''} onChange={e => updateField('allowedTimeWindow', e.target.value)}
                                    placeholder="HH:mm-HH:mm" />
                            </div>
                        </section>

                        {/* Suppression Rules */}
                        <section>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4">Targeting & Suppression</h3>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 flex items-center mb-2">
                                    Allowed Lifecycle States (Empty = All)
                                    <InfoTooltip content="Segmentation: Only show this overlay to users currently in these specific lifecycle states (e.g. only for 'NEW' users or only 'CHURNED')." />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {LIFECYCLE_STATES.map(state => (
                                        <button
                                            key={state}
                                            onClick={() => toggleArrayItem('allowedLifecycleStates', state)}
                                            className={`px-3 py-1 text-xs rounded border ${(formData.allowedLifecycleStates as string[])?.includes(state)
                                                ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                                                : 'bg-white border-gray-300 text-gray-600'
                                                }`}
                                        >
                                            {state}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 flex items-center mb-2">
                                    Blocked By Overlay Types
                                    <InfoTooltip content="Suppression Rule: Do NOT show this overlay if any of these overlay types are currently active for the user. Example: Don't show a 'Promo' if a 'Tripwire' is already active." />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {OVERLAY_TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => toggleArrayItem('blockedByTypes', type)}
                                            className={`px-3 py-1 text-xs rounded border ${(formData.blockedByTypes as string[])?.includes(type)
                                                ? 'bg-red-100 border-red-500 text-red-700'
                                                : 'bg-white border-gray-300 text-gray-600'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'CONTENT' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-sm font-bold mb-4">Default Payload</h3>
                            <PayloadEditor
                                value={formData.payload as any}
                                onChange={p => updateField('payload', p)}
                            />
                        </section>

                        {!isNew && (
                            <section>
                                <div className="flex justify-between items-center mb-4 border-t pt-6">
                                    <h3 className="text-sm font-bold">Variants (A/B Testing)</h3>
                                </div>
                                <VariantManager overlayId={overlay!.id} variants={overlay!.variants} />
                            </section>
                        )}
                        {isNew && (
                            <div className="bg-yellow-50 p-4 rounded text-sm text-yellow-800">
                                Save the overlay first to add Variants.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'TESTING' && (
                    <div className="py-8">
                        <div className="mb-6 text-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Telegram Preview</h3>
                            <p className="text-sm text-gray-500">Live preview of how your overlay will appear in Telegram</p>
                        </div>
                        <TelegramPreview payload={formData.payload as any} />
                    </div>
                )}
            </div>
        </div>
    );
}
