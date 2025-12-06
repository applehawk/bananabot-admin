'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import DatabaseErrorAlert from '@/components/DatabaseErrorAlert';
import GenerationDetailsModal from '@/components/GenerationDetailsModal';
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

interface DailyStats {
  date: string;
  count: number;
}

function GenerationsContent() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED'>('COMPLETED');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [databaseError, setDatabaseError] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  const calculateStats = useCallback((data: Generation[]) => {
    // Calculate daily stats for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    // Count generations per day
    data.forEach(gen => {
      const shouldCount = statusFilter === 'ALL' || gen.status === 'COMPLETED';
      if (shouldCount) {
        const date = new Date(gen.createdAt).toISOString().split('T')[0];
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        }
      }
    });

    const stats = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyStats(stats);
  }, [statusFilter]);

  const fetchGenerations = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (userId) params.append('userId', userId);

      const queryString = params.toString();
      const res = await fetch(`/admin/api/generations${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();

      if (res.status === 503 && data.isDatabaseDown) {
        setDatabaseError(true);
        setGenerations([]);
        setDailyStats([]);
      } else if (Array.isArray(data)) {
        setDatabaseError(false);
        setGenerations(data);
        calculateStats(data);
      } else {
        setDatabaseError(false);
        setGenerations([]);
        setDailyStats([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setDatabaseError(true);
      setGenerations([]);
      setDailyStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, [typeFilter, userId]);

  useEffect(() => {
    if (generations.length > 0) {
      calculateStats(generations);
    }
  }, [statusFilter, generations, calculateStats]);

  const getStatsForPeriod = (days: number) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return generations.filter(gen => {
      const isInPeriod = new Date(gen.createdAt) >= cutoff;
      const matchesStatus = statusFilter === 'ALL' || gen.status === 'COMPLETED';
      return isInPeriod && matchesStatus;
    }).length;
  };

  const togglePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleRowClick = (generation: Generation) => {
    setSelectedGeneration(generation);
    setIsModalOpen(true);
  };

  // Filter generations for display in table
  const filteredGenerations = generations.filter(gen => {
    // Apply status filter
    const matchesStatus = statusFilter === 'ALL' || gen.status === 'COMPLETED';

    // Apply type filter
    const matchesType = !typeFilter || gen.type === typeFilter;

    return matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

      <GenerationDetailsModal
        generation={selectedGeneration}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🎨 Generations {userId && <span className="text-blue-600">(Filtered by User)</span>}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-4 py-2 rounded text-sm font-medium ${statusFilter === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
          >
            ✅ Completed Only
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded text-sm font-medium ${statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
          >
            📊 All Generations
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Day</div>
            <div className="text-2xl font-bold text-gray-900">{getStatsForPeriod(1)}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Week</div>
            <div className="text-2xl font-bold text-gray-900">{getStatsForPeriod(7)}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Month</div>
            <div className="text-2xl font-bold text-gray-900">{getStatsForPeriod(30)}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Quarter</div>
            <div className="text-2xl font-bold text-gray-900">{getStatsForPeriod(90)}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Generations (Last 30 Days)</h2>
          <div className="h-64">
            <Line
              data={{
                labels: dailyStats.map(stat => new Date(stat.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })),
                datasets: [
                  {
                    label: 'Generations',
                    data: dailyStats.map(stat => stat.count),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

        {/* Filter Buttons */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => setTypeFilter('')} className={`px-3 py-1 rounded text-sm font-medium ${!typeFilter ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}>All</button>
          <button onClick={() => setTypeFilter('TEXT_TO_IMAGE')} className={`px-3 py-1 rounded text-sm font-medium ${typeFilter === 'TEXT_TO_IMAGE' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}>Text-to-Image</button>
          <button onClick={() => setTypeFilter('IMAGE_TO_IMAGE')} className={`px-3 py-1 rounded text-sm font-medium ${typeFilter === 'IMAGE_TO_IMAGE' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}>Image-to-Image</button>
          <button onClick={() => setTypeFilter('MULTI_IMAGE')} className={`px-3 py-1 rounded text-sm font-medium ${typeFilter === 'MULTI_IMAGE' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}>Multi-Image</button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Showing {filteredGenerations.length} of {generations.length} generations
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prompt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGenerations.map((gen) => (
                    <tr
                      key={gen.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(gen)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{gen.user.firstName || gen.user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">{gen.type}</span></td>
                      <td className="px-6 py-4 text-sm max-w-md">
                        <div className={`${expandedPrompts.has(gen.id) ? '' : 'line-clamp-2'} text-gray-800`}>
                          {gen.prompt}
                        </div>
                        {gen.prompt.length > 100 && (
                          <button
                            onClick={(e) => togglePrompt(gen.id, e)}
                            className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
                          >
                            {expandedPrompts.has(gen.id) ? 'Collapse' : 'Expand...'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded ${gen.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : gen.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{gen.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gen.creditsUsed.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(gen.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function GenerationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
    </div>}>
      <GenerationsContent />
    </Suspense>
  );
}
