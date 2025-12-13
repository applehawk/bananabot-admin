'use client';

import { useState, useEffect } from 'react';
import BurnableBonusForm from './BurnableBonusForm';

interface SendMessageModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    username?: string;
}

interface Message {
    id: string;
    message: string;
    sentAt: string;
    isBroadcast: boolean;
    status: string;
    error?: string;
}

export default function SendMessageModal({ userId, isOpen, onClose, username }: SendMessageModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<Message[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Custom Package State
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [packageMode, setPackageMode] = useState<'existing' | 'custom'>('existing');
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');

    // Custom form fields
    const [pkgName, setPkgName] = useState('');
    const [pkgPrice, setPkgPrice] = useState('');
    const [pkgCredits, setPkgCredits] = useState('');

    // Burnable Bonus State
    const [sendBonus, setSendBonus] = useState(false);
    const [bonusAmount, setBonusAmount] = useState('50');
    const [bonusExpires, setBonusExpires] = useState('24');
    const [bonusCondType, setBonusCondType] = useState<'generations' | 'topup' | 'none'>('generations');
    const [bonusCondValue, setBonusCondValue] = useState('1');

    useEffect(() => {
        if (isOpen && userId) {
            fetchHistory();
            fetchPackages();
        }
    }, [isOpen, userId]);

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/packages');
            if (res.ok) {
                const data = await res.json();
                setPackages(data); // Allow inactive packages for special offers
            }
        } catch (error) {
            console.error('Failed to load packages', error);
        }
    };

    const fetchHistory = async () => {
        try {
            setIsLoadingHistory(true);
            const res = await fetch(`/admin/api/users/${userId}/send-message`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim() && !sendBonus) return;

        let payload: any = { message };

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

        // Add Bonus Payload
        if (sendBonus) {
            if (!bonusAmount || !bonusExpires) {
                alert('Please enter Bonus Amount and Expiration');
                return;
            }
            if (bonusCondType !== 'none' && !bonusCondValue) {
                alert('Please enter Condition Value');
                return;
            }

            payload.burnableBonus = {
                amount: Number(bonusAmount),
                expiresInHours: Number(bonusExpires),
                conditionGenerations: bonusCondType === 'generations' ? Number(bonusCondValue) : null,
                conditionTopUpAmount: bonusCondType === 'topup' ? Number(bonusCondValue) : null,
            };
        }

        try {
            setIsSending(true);
            const res = await fetch(`/admin/api/users/${userId}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setMessage('');
                setSendBonus(false); // Reset bonus toggle
                fetchHistory();
            } else {
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error sending message');
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
                        Message to {username || userId}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="mb-6">
                    <textarea
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        placeholder={sendBonus ? "Leave empty to use default bonus notification..." : "Type your message here (Markdown supported by Bot)..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    {/* Special Offer Toggle */}
                    <div className="mt-4 border-t pt-4">
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
                                            <label className="block text-xs font-medium text-gray-00 mb-1">Package Name</label>
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

                    {/* Burnable Bonus Form */}
                    <BurnableBonusForm
                        enabled={sendBonus}
                        setEnabled={setSendBonus}
                        amount={bonusAmount}
                        setAmount={setBonusAmount}
                        expiresIn={bonusExpires}
                        setExpiresIn={setBonusExpires}
                        conditionType={bonusCondType}
                        setConditionType={setBonusCondType}
                        conditionValue={bonusCondValue}
                        setConditionValue={setBonusCondValue}
                    />

                    <div className="mt-4 text-right">
                        <button
                            onClick={handleSend}
                            disabled={isSending || (!message.trim() && !sendBonus)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSending ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">History</h4>
                    {isLoadingHistory ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto space-y-3">
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center">No messages sent yet.</p>
                            ) : (
                                history.map((msg) => (
                                    <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.isBroadcast ? 'bg-purple-50' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{new Date(msg.sentAt).toLocaleString()}</span>
                                            <span className={`font-semibold ${msg.status === 'SENT' ? 'text-green-600' : 'text-red-600'}`}>
                                                {msg.isBroadcast ? 'BROADCAST' : 'DIRECT'} - {msg.status}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-wrap text-gray-800">{msg.message}</p>
                                        {msg.error && <p className="text-red-500 text-xs mt-1">Error: {msg.error}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
