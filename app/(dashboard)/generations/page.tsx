'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
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

interface PeriodStats {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

function GenerationsContent() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED' | 'PROCESSING' | 'PENDING' | 'CANCELLED'>('ALL');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStats>({ day1: 0, day7: 0, day30: 0, day90: 0 });
  const [databaseError, setDatabaseError] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('infinite');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/admin/api/generations/stats?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();
      setDailyStats(data.dailyStats || []);
      setPeriodStats(data.periodStats || { day1: 0, day7: 0, day30: 0, day90: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId, typeFilter, statusFilter]);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (typeFilter) params.append('type', typeFilter);
      if (userId) params.append('userId', userId);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const queryString = params.toString();
      const res = await fetch(`/admin/api/generations${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();

      if (res.status === 503 && data.isDatabaseDown) {
        setDatabaseError(true);
        setGenerations([]);
      } else if (data.generations) {
        setDatabaseError(false);
        if (viewMode === 'infinite' && page > 1) {
          setGenerations(prev => {
            // simple de-dupe based on ID just in case
            const existingIds = new Set(prev.map(g => g.id));
            const newGens = data.generations.filter((g: Generation) => !existingIds.has(g.id));
            return [...prev, ...newGens];
          });
        } else {
          setGenerations(data.generations);
        }
        setTotalGenerations(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setDatabaseError(false);
        setGenerations([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setDatabaseError(true);
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, userId, statusFilter, viewMode]);

  // Reset page when view mode or filters change
  useEffect(() => {
    setPage(1);
    // If switching to infinite, we might want to ensure fresh start, but page=1 handles fetch
    if (viewMode === 'infinite') {
      window.scrollTo(0, 0);
    }
  }, [viewMode, typeFilter, statusFilter, userId]);

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

  // Reset page when userId changes (navigation)


  // Fetch data when dependencies change
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  // Fetch stats separately usually when filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🎨 Generations {userId && <span className="text-blue-600">(Filtered by User)</span>}
          </h1>
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


        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Day</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day1}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Week</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day7}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Month</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day30}</div>
            <div className="text-xs text-gray-400 mt-1">Generations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Quarter</div>
            <div className="text-2xl font-bold text-gray-900">{periodStats.day90}</div>
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-6 items-end">
          {/* Status Dropdown */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              <option value="TEXT_TO_IMAGE">Text to Image</option>
              <option value="IMAGE_TO_IMAGE">Image to Image</option>
              <option value="MULTI_IMAGE">Multi Image</option>
              <option value="BATCH">Batch</option>
            </select>
          </div>
        </div>

        {loading && generations.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Showing {generations.length} of {totalGenerations} generations (Page {page} of {totalPages})
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
                  {generations.map((gen) => (
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
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded ${gen.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        gen.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          gen.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            gen.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>{gen.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gen.creditsUsed.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(gen.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>



            {/* Infinite Scroll Sentinel */}
            {viewMode === 'infinite' && (
              <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                {loading && page > 1 && (
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                )}
              </div>
            )}
          </>
        )}
        {viewMode === 'pagination' && (
          <div className="flex items-center justify-between mt-4">
            {/* ... existing pagination controls ... */}
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
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalGenerations)}</span> of <span className="font-medium">{totalGenerations}</span> results
                </p>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="block pl-3 pr-8 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">First</span>
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Previous</span>
                    <span aria-hidden="true">&larr;</span>
                  </button>

                  {/* Page Numbers - Simplified for now */}
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pNum = page;
                    if (totalPages > 5) {
                      // Simple logic to keep current page visible
                      if (page <= 3) {
                        pNum = idx + 1;
                      } else if (page >= totalPages - 2) {
                        pNum = totalPages - 4 + idx;
                      } else {
                        pNum = page - 2 + idx;
                      }
                    } else {
                      pNum = idx + 1;
                    }

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
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Next</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Last</span>
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

        )}
      </main>
    </div >
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
