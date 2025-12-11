'use client';

import { useState, useEffect } from 'react';

interface SendBroadcastModalProps {
    userIds: Set<string>;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const TIMEZONES = [
    { value: '+03:00', label: 'Moscow (UTC+3)' },
    { value: '+00:00', label: 'UTC' },
    { value: '+01:00', label: 'CET (UTC+1)' },
    { value: '+02:00', label: 'EET (UTC+2)' },
    { value: '+04:00', label: 'Dubai (UTC+4)' },
    { value: '+05:00', label: 'Yekaterinburg (UTC+5)' },
    { value: '+08:00', label: 'Singapore (UTC+8)' },
    { value: '-05:00', label: 'New York (UTC-5)' },
    { value: '-08:00', label: 'Los Angeles (UTC-8)' },
];

export default function SendBroadcastModal({ userIds, isOpen, onClose, onSuccess }: SendBroadcastModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Scheduling
    const [scheduledFor, setScheduledFor] = useState('');
    const [timezone, setTimezone] = useState('+03:00');

    // Custom Package State
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [packageMode, setPackageMode] = useState<'existing' | 'custom'>('existing');
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');

    // Custom form fields
    const [pkgName, setPkgName] = useState('');
    const [pkgPrice, setPkgPrice] = useState('');
    const [pkgCredits, setPkgCredits] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPackages();
        }
    }, [isOpen]);

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/packages');
            if (res.ok) {
                const data = await res.json();
                setPackages(data);
            }
        } catch (error) {
            console.error('Failed to load packages', error);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        let payload: any = {
            message,
            targetUserIds: Array.from(userIds)
        };

        if (scheduledFor) {
            const dateStr = `${scheduledFor}:00${timezone}`;
            payload.scheduledFor = dateStr;
        }

        if (showPackageForm) {
            if (packageMode === 'custom') {
                if (!pkgName || !pkgPrice || !pkgCredits) {
                    alert('Please fill all package fields');
                    return;
                }
                payload.customPackage = {
                    name: pkgName,
                    price: Number(pkgPrice),
                    credits: Number(pkgCredits)
                };
            } else {
                if (!selectedPackageId) {
                    alert('Please select a package');
                    return;
                }
                payload.packageId = selectedPackageId;
            }
        }

        try {
            setIsSending(true);
            const res = await fetch('/admin/api/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Broadcast created for ${userIds.size} users`);
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setMessage('');
                setScheduledFor('');
                setShowPackageForm(false);
            } else {
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error creating broadcast');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Broadcast to {userIds.size} Selected Users
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="mb-6">
                    <textarea
                        className="w-full p-2 border rounded-md mb-4"
                        rows={3}
                        placeholder="Type your broadcast message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    {/* Scheduling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule Start
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded-md"
                                value={scheduledFor}
                                onChange={(e) => setScheduledFor(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timezone
                            </label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Package Selection */}
                    <div className="border-t pt-4">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPackageForm}
                                onChange={(e) => setShowPackageForm(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Attach Special Offer</span>
                        </label>

                        {showPackageForm && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-md border text-sm">
                                <div className="flex space-x-4 mb-3">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio"
                                            checked={packageMode === 'existing'}
                                            onChange={() => setPackageMode('existing')}
                                        />
                                        <span className="ml-2">Existing Package</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio"
                                            checked={packageMode === 'custom'}
                                            onChange={() => setPackageMode('custom')}
                                        />
                                        <span className="ml-2">Create Custom</span>
                                    </label>
                                </div>

                                {packageMode === 'existing' ? (
                                    <div>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={selectedPackageId}
                                            onChange={(e) => setSelectedPackageId(e.target.value)}
                                        >
                                            <option value="">-- Select a Package --</option>
                                            {packages.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - {p.price}₽ ({p.credits} credits)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Package Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Special Discount"
                                                value={pkgName}
                                                onChange={(e) => setPkgName(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Price (RUB)</label>
                                            <input
                                                type="number"
                                                placeholder="100"
                                                value={pkgPrice}
                                                onChange={(e) => setPkgPrice(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Credits</label>
                                            <input
                                                type="number"
                                                placeholder="50"
                                                value={pkgCredits}
                                                onChange={(e) => setPkgCredits(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 text-right space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || !message.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSending ? 'Creating...' : 'Create Broadcast'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
