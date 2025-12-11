'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import DatabaseErrorAlert from '@/components/DatabaseErrorAlert';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
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

import { Prisma } from '@prisma/client';

type Transaction = Prisma.TransactionGetPayload<{
  include: {
    user: {
      select: {
        username: true;
        firstName: true;
        telegramId: true;
      }
    };
    package: {
      select: {
        name: true;
      }
    };
  }
}>;


interface DailyStats {
  date: string;
  revenue: number;
}

interface PeriodRevenue {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [periodRevenue, setPeriodRevenue] = useState<PeriodRevenue>({ day1: 0, day7: 0, day30: 0, day90: 0 });
  const [databaseError, setDatabaseError] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('infinite');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // Add type filter if needed, though user asked specifically for status & payment method

  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  const [chartScale, setChartScale] = useState<'1D' | '1W' | '1M' | '1Q'>('1M');

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('scale', chartScale);

      const res = await fetch(`/admin/api/transactions/stats?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();
      setDailyStats(data.dailyStats || []);
      setPeriodRevenue(data.periodRevenue || { day1: 0, day7: 0, day30: 0, day90: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId, chartScale]);

  // ... (fetchTransactions) ...

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('order', order);
      if (userId) params.append('userId', userId);

      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentMethods.length > 0) params.append('paymentMethod', paymentMethods.join(','));
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/admin/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (res.status === 503 && data.isDatabaseDown) {
        setDatabaseError(true);
        setTransactions([]);
      } else if (data.transactions) {
        setDatabaseError(false);
        if (viewMode === 'infinite' && page > 1) {
          setTransactions(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(t => t.id));
            const newTx = data.transactions.filter((t: Transaction) => !existingIds.has(t.id));
            return [...prev, ...newTx];
          });
        } else {
          setTransactions(data.transactions);
        }
        setTotalTransactions(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setDatabaseError(false);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setDatabaseError(true);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, userId, statusFilter, paymentMethods, typeFilter, viewMode]);

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

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
    if (viewMode === 'infinite') window.scrollTo(0, 0);
  }, [userId, statusFilter, paymentMethods, typeFilter, viewMode]);

  // Fetch transactions when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch stats when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1); // Reset page on sort
  };
  // (Assuming handleRowClick is below)

  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">💳 Transactions {userId && '(Filtered)'}</h1>
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
            <div className="text-2xl font-bold text-gray-900">{periodRevenue.day1.toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Week</div>
            <div className="text-2xl font-bold text-gray-900">{periodRevenue.day7.toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Month</div>
            <div className="text-2xl font-bold text-gray-900">{periodRevenue.day30.toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Quarter</div>
            <div className="text-2xl font-bold text-gray-900">{periodRevenue.day90.toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction Overview
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
                    label: 'Revenue (₽)',
                    data: dailyStats.map(stat => stat.revenue),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
                    callbacks: {
                      label: (context) => `${(context.parsed.y ?? 0).toFixed(2)} ₽`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value} ₽`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-6 items-end">
          {/* Payment Methods Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</label>
            <div className="flex gap-4">
              {['YOOMONEY', 'TELEGRAM_STARS', 'CRYPTO', 'FREE', 'ADMIN'].map((method) => (
                <label key={method} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={paymentMethods.includes(method)}
                    onChange={() => togglePaymentMethod(method)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{method.replace('TELEGRAM_', '')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="ALL">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="BONUS">Bonus</option>
              <option value="REFERRAL">Referral</option>
              <option value="DAILY_BONUS">Daily Bonus</option>
              <option value="ADMIN_ADJUSTMENT">Admin Adj.</option>
              <option value="GENERATION_COST">Gen. Cost</option>
              <option value="REFUND">Refund</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button onClick={() => handleSort('createdAt')} className="px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm hover:bg-blue-100 transition-colors">Sort by Date {sortBy === 'createdAt' && (order === 'asc' ? '↑' : '↓')}</button>
            <button onClick={() => handleSort('amount')} className="px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm hover:bg-blue-100 transition-colors">Sort by Amount {sortBy === 'amount' && (order === 'asc' ? '↑' : '↓')}</button>
          </div>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Showing {transactions.length} of {totalTransactions} transactions
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(tx)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{tx.user.firstName || tx.user.username || String(tx.user.telegramId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">{tx.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: tx.creditsAdded > 0 ? 'green' : 'red' }}>{tx.creditsAdded > 0 ? '+' : ''}{tx.creditsAdded.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.amount ? `${tx.amount} руб.` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.paymentMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          tx.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                            tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>{tx.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
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

            {/* Pagination Controls */}
            {viewMode === 'pagination' && (
              <div className="flex items-center justify-between mt-4">
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
                      Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalTransactions)}</span> of <span className="font-medium">{totalTransactions}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>

                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
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
            )}
          </>
        )}
      </main>
    </div >
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
    </div>}>
      <TransactionsContent />
    </Suspense>
  );
}
