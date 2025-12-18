'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import DatabaseErrorAlert from '@/components/DatabaseErrorAlert';
import SendMessageModal from '@/components/SendMessageModal';
import SendBroadcastModal from '@/components/SendBroadcastModal';
import { Trash2 } from 'lucide-react';
import UserDetailsModal from '@/components/UserDetailsModal';
// ... imports ...
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  credits: number;
  freeCreditsUsed: number;
  totalGenerated: number;
  createdAt: string;
  isRuleEngineEnabled: boolean;
  _count: {
    transactions: number;
    generations: number;
  };
}

interface DailyStats {
  date: string;
  count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [databaseError, setDatabaseError] = useState(false);

  // Filter State
  const [minCredits, setMinCredits] = useState<string>('');
  const [maxGenerations, setMaxGenerations] = useState<string>('');
  const [expiringCredits, setExpiringCredits] = useState<string>('');
  const [expiringDays, setExpiringDays] = useState<string>('');
  const [excludeHours, setExcludeHours] = useState<string>('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('infinite');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, username?: string } | null>(null);

  // User Details Modal
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Batch Update State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [models, setModels] = useState<any[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedBatchModel, setSelectedBatchModel] = useState('');
  const [batchCredits, setBatchCredits] = useState(0);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const [chartScale, setChartScale] = useState<'1D' | '1W' | '1M' | '1Q'>('1M');
  const [periodStats, setPeriodStats] = useState({ day1: 0, day7: 0, day30: 0, day90: 0 });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('scale', chartScale);

      const res = await fetch(`/admin/api/users/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDailyStats(data.chartStats || []);
        setPeriodStats(data.periodStats || { day1: 0, day7: 0, day30: 0, day90: 0 });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [chartScale]);

  const fetchModels = async () => {
    try {
      const res = await fetch('/admin/api/tariffs');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
        if (data.length > 0) setSelectedBatchModel(data[0].modelId);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);

      // Append filters
      if (minCredits) params.append('minCredits', minCredits);
      if (maxGenerations) params.append('maxGenerations', maxGenerations);
      if (expiringCredits && expiringDays) {
        params.append('maxCredits', expiringCredits);
        params.append('daysSinceLastTopUp', expiringDays);
      }
      if (excludeHours) params.append('excludeBroadcastsHours', excludeHours);
      if (showBlocked) params.append('isBlocked', 'true');

      const res = await fetch(`/admin/api/users?${params.toString()}`);
      const data = await res.json();

      if (res.status === 503 && data.isDatabaseDown) {
        setDatabaseError(true);
        setUsers([]);
      } else {
        setDatabaseError(false);
        const newUsers = data.users || []; // Handle { users, pagination } structure

        if (viewMode === 'infinite' && page > 1) {
          setUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const filteredNew = newUsers.filter((u: User) => !existingIds.has(u.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setUsers(newUsers);
        }

        if (data.pagination) {
          setTotalUsers(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setDatabaseError(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, viewMode, minCredits, maxGenerations, expiringCredits, expiringDays, excludeHours, showBlocked]);

  // Reset page when search or view mode changes
  useEffect(() => {
    setPage(1);
    // If switching to infinite, we might want to ensure fresh start
    if (viewMode === 'infinite') {
      window.scrollTo(0, 0);
    }
  }, [viewMode, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [minCredits, maxGenerations, expiringCredits, expiringDays, excludeHours, showBlocked]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (viewMode !== 'infinite' || loading || page >= totalPages) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [viewMode, loading, page, totalPages]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch stats separately
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      // Only select/deselect visible users (current page/scroll state)
      // Note: in infinite scroll, 'users' grows. 'filteredUsers' is derived from 'users'.
      // So clicking 'Select All' in infinite scroll selects ALL currently loaded users.
      users.forEach(u => {
        if (isChecked) newSet.add(u.id);
        else newSet.delete(u.id);
      });
      return newSet;
    });
  };

  const handleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUserIds(newSelected);
  };

  const handleBatchUpdate = async () => {
    if (!selectedBatchModel || selectedUserIds.size === 0) return;

    if (!confirm(`Update model to ${selectedBatchModel} for ${selectedUserIds.size} users?`)) return;

    setBatchUpdating(true);
    try {
      const res = await fetch('/admin/api/users/batch-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          modelId: selectedBatchModel
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setIsBatchModalOpen(false);
        setSelectedUserIds(new Set()); // Clear selection
        fetchUsers(); // Refresh to ensure backend consistency if needed
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Batch update failed');
    } finally {
      setBatchUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telegramId.includes(searchTerm)
  );

  const handleToggleRuleEngine = async (userId: string, enabled: boolean) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isRuleEngineEnabled: enabled } : u));

    try {
      const res = await fetch(`/admin/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRuleEngineEnabled: enabled })
      });
      if (!res.ok) throw new Error('Failed to update user');
    } catch (error) {
      console.error(error);
      alert('Failed to update rule engine status');
      // Revert
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isRuleEngineEnabled: !enabled } : u));
    }
  };

  const handleSendMessage = (user: User) => {
    setSelectedUser({ id: user.id, username: user.username || user.firstName });
    setIsMessageModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    const confirmMessage = `Are you sure you want to delete user ${user.username || user.firstName || user.id}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('User deleted successfully');
        fetchUsers(); // Refresh list
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to delete user: ${data.error || res.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

      {/* Modal */}
      {selectedUser && (
        <SendMessageModal
          userId={selectedUser.id}
          username={selectedUser.username}
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
        />
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        userId={selectedUserId}
        isOpen={isUserDetailsOpen}
        onClose={() => setIsUserDetailsOpen(false)}
        onUpdate={fetchUsers}
      />

      {/* Batch Model Update Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Batch Update Model</h3>
            <p className="mb-4 text-gray-600">
              Select a new model for the <b>{selectedUserIds.size}</b> selected users.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Model</label>
              <select
                value={selectedBatchModel}
                onChange={(e) => setSelectedBatchModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {models.map(m => (
                  <option key={m.id} value={m.modelId}>{m.displayName || m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchUpdate}
                disabled={batchUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {batchUpdating ? 'Updating...' : 'Update Users'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <SendBroadcastModal
        userIds={selectedUserIds}
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={() => setSelectedUserIds(new Set())}
      />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">👥 Users</h1>
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('infinite')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'infinite' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Infinite
            </button>
            <button
              onClick={() => setViewMode('pagination')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'pagination' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Pagination
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Batch Actions Toolbar */}
        {selectedUserIds.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="text-blue-800 font-medium">
              {selectedUserIds.size} users selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Change AI Model
              </button>
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:bg-blue-100 rounded transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                Broadcast to Selected
              </button>
            </div>
          </div>
        )
        }

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Day</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day1}</div>
            <div className="text-xs text-gray-400 mt-1">New Users</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Week</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day7}</div>
            <div className="text-xs text-gray-400 mt-1">New Users</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Month</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day30}</div>
            <div className="text-xs text-gray-400 mt-1">New Users</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Quarter</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day90}</div>
            <div className="text-xs text-gray-400 mt-1">New Users</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              User Registrations
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({chartScale === '1D' ? 'Last 24 Hours' :
                  chartScale === '1W' ? 'Last 7 Days' :
                    chartScale === '1M' ? 'Last 30 Days' : 'Last Quarter'})
              </span>
            </h2>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              {(['1D', '1W', '1M', '1Q'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setChartScale(scale)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${chartScale === scale
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <Line
              data={{
                labels: dailyStats.map(stat => {
                  const d = new Date(stat.date);
                  if (chartScale === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  if (chartScale === '1W') return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
                  return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
                }),
                datasets: [
                  {
                    label: 'New Users',
                    data: dailyStats.map(stat => stat.count),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by username, name or Telegram ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2">

              {/* Balance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Balance</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={minCredits}
                  onChange={(e) => setMinCredits(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Users with at least this amount.</p>
              </div>

              {/* Generations Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Generations</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={maxGenerations}
                  onChange={(e) => setMaxGenerations(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Users with &le; N generations.</p>
              </div>

              {/* Expiring/Inactive Filter */}
              <div className="bg-orange-50 p-3 rounded border border-orange-100">
                <label className="block text-sm font-medium text-orange-900 mb-2">Expiring / Inactive Users</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max Cr."
                      value={expiringCredits}
                      onChange={(e) => setExpiringCredits(e.target.value)}
                      className="w-full px-2 py-2 border border-orange-200 rounded focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Days"
                      value={expiringDays}
                      onChange={(e) => setExpiringDays(e.target.value)}
                      className="w-full px-2 py-2 border border-orange-200 rounded focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Max credits & No top-up days
                </p>
              </div>

              {/* Broadcast Exclusion Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exclude Recent Broadcasts</label>
                <input
                  type="number"
                  placeholder="Hours e.g. 24"
                  value={excludeHours}
                  onChange={(e) => setExcludeHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Not contacted in X hrs.</p>
              </div>

              {/* Blocked Users Toggle */}
              <div className="flex flex-col justify-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox"
                      checked={showBlocked}
                      onChange={(e) => setShowBlocked(e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-4"
                      style={{ right: showBlocked ? '0' : 'auto', left: showBlocked ? 'auto' : '0' }}
                    />
                    <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${showBlocked ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Blocked Users Only</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {
          loading && users.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        // Select all effectively checks if all visible are selected
                        checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telegram ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Free Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer transition-colors ${selectedUserIds.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => { setSelectedUserId(user.id); setIsUserDetailsOpen(true); }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2">
                          {user.firstName || user.username || 'Unknown'}
                          {(user as any).isBlocked && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          )}
                        </div>
                        {user.username && <div className="text-sm text-gray-500">@{user.username}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.telegramId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">{user.credits.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={user.isRuleEngineEnabled}
                          onChange={(e) => handleToggleRuleEngine(user.id, e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                          title="Enable/Disable Rules for this user"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.freeCreditsUsed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.totalGenerated}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleSendMessage(user)}
                          className="text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        {/* Infinite Scroll Sentinel */}
        {
          viewMode === 'infinite' && (
            <div ref={sentinelRef} className="h-20 flex items-center justify-center">
              {loading && page > 1 && (
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
              )}
            </div>
          )
        }

        {/* Pagination Controls */}
        {
          viewMode === 'pagination' && (
            <div className="flex items-center justify-between mt-4">
              {/* Simple Pagination for now */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalUsers)}</span> of <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Simplified Previous/Next since full pagination numbers are verbose */}
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      // Very basic sliding window
                      let pNum = idx + 1;
                      if (totalPages > 5 && page > 3) pNum = page - 2 + idx;
                      if (pNum > totalPages) return null;

                      return (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )
        }

      </main >
    </div >
  );
}
