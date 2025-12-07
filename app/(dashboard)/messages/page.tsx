'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface ChatMessage {
    id: string;
    content: string;
    mode: string;
    isFromUser: boolean;
    isRead: boolean;
    createdAt: string;
    user: {
        id: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        telegramId: string;
    };
}

function MessagesContent() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const userId = searchParams?.get('userId');

    const fetchMessages = async () => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);
            params.append('limit', '100'); // Fetch last 100 messages

            const res = await fetch(`/api/chat-messages?${params.toString()}`);
            const data = await res.json();

            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [userId]);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        💬 Messages {userId && <span className="text-blue-600">(Filtered by User)</span>}
                    </h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading && messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {msg.user.firstName} {msg.user.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                @{msg.user.username || msg.user.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 break-words max-w-xl">{msg.content}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                {msg.mode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {msg.isFromUser ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">User</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Bot/Admin</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
