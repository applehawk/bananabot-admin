'use client';

import { useState, useEffect } from 'react';

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

    useEffect(() => {
        if (isOpen && userId) {
            fetchHistory();
        }
    }, [isOpen, userId]);

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
        if (!message.trim()) return;

        try {
            setIsSending(true);
            const res = await fetch(`/admin/api/users/${userId}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage('');
                fetchHistory(); // Refresh history
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Message to {username || userId}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="mb-6">
                    <textarea
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        placeholder="Type your message here (Markdown supported by Bot)..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="mt-2 text-right">
                        <button
                            onClick={handleSend}
                            disabled={isSending || !message.trim()}
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
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
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
