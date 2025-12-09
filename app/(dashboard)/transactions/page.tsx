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
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // Add type filter if needed, though user asked specifically for status & payment method

  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      // Stats generally shouldn't change with pagination, but might listen to global filters if desired.
      // Usually "Revenue" is global or per-user. Let's keep it global/per-user for now as requested.

      const res = await fetch(`/admin/api/transactions/stats?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();
      setDailyStats(data.dailyStats || []);
      setPeriodRevenue(data.periodRevenue || { day1: 0, day7: 0, day30: 0, day90: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
        if (page > 1) {
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
  }, [page, limit, sortBy, order, userId, statusFilter, paymentMethods, typeFilter]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || page >= totalPages) return;

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
  }, [loading, page, totalPages]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [userId, statusFilter, paymentMethods, typeFilter]);

  // Fetch transactions when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch stats separately
  useEffect(() => {
    fetchStats();
  }, [userId]);

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };




  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">💳 Transactions {userId && '(Filtered)'}</h1>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue (Last 30 Days)</h2>
          <div className="h-64">
            <Line
              data={{
                labels: dailyStats.map(stat => new Date(stat.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })),
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

        {loading ? (
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
            <div ref={sentinelRef} className="h-20 flex items-center justify-center">
              {loading && page > 1 && (
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
              )}
            </div>
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
