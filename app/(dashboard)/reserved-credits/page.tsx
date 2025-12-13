'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserWithReserved {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    reservedCredits: number;
}

export default function ReservedCreditsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserWithReserved[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/reserved-credits');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            alert('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUsers(new Set(users.map((u) => u.id)));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (id: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUsers(newSelected);
    };

    const handleRelease = async () => {
        if (selectedUsers.size === 0) return;
        if (!confirm(`Release credits for ${selectedUsers.size} users?`)) return;

        setIsReleasing(true);
        try {
            const res = await fetch('/api/reserved-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: Array.from(selectedUsers) }),
            });

            if (!res.ok) throw new Error('Failed to release');

            await fetchUsers();
            setSelectedUsers(new Set());
            alert('Credits released successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to release credits');
        } finally {
            setIsReleasing(false);
        }
    };

    if (!session) return null;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Reserved Credits</h1>
                <button
                    onClick={handleRelease}
                    disabled={selectedUsers.size === 0 || isReleasing}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedUsers.size > 0 && !isReleasing
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isReleasing ? 'Releasing...' : `Release Selected (${selectedUsers.size})`}
                </button>
            </div>

            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800 text-gray-400 text-sm">
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedUsers.size === users.length}
                                        onChange={handleSelectAll}
                                        disabled={users.length === 0}
                                        className="rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                                    />
                                </th>
                                <th className="p-4">Telegram ID</th>
                                <th className="p-4">User</th>
                                <th className="p-4 text-right">Reserved Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No users with reserved credits found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                                            />
                                        </td>
                                        <td className="p-4 text-gray-300 font-mono text-sm">
                                            {user.telegramId}
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                {user.username && (
                                                    <div className="text-white font-medium">@{user.username}</div>
                                                )}
                                                <div className="text-gray-400 text-sm">
                                                    {user.firstName || 'No Name'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-yellow-400 font-mono">
                                            {user.reservedCredits.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
