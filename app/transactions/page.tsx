'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import DatabaseErrorAlert from '@/components/DatabaseErrorAlert';
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

interface Transaction {
  id: string;
  type: string;
  amount: number | null;
  creditsAdded: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: { username: string | null; firstName: string | null; telegramId: string };
  package: { name: string } | null;
}

interface DailyStats {
  date: string;
  revenue: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [databaseError, setDatabaseError] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  useEffect(() => {
    fetchTransactions();
  }, [userId, sortBy, order]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('sortBy', sortBy);
      params.append('order', order);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();

      if (res.status === 503 && data.isDatabaseDown) {
        setDatabaseError(true);
        setTransactions([]);
        setDailyStats([]);
      } else if (Array.isArray(data)) {
        setDatabaseError(false);
        setTransactions(data);
        calculateStats(data);
      } else {
        setDatabaseError(false);
        setTransactions([]);
        setDailyStats([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setDatabaseError(true);
      setTransactions([]);
      setDailyStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Transaction[]) => {
    // Calculate daily revenue stats for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    // Sum revenue per day (only COMPLETED transactions with amount)
    data.forEach(tx => {
      if (tx.status === 'COMPLETED' && tx.amount) {
        const date = new Date(tx.createdAt).toISOString().split('T')[0];
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + tx.amount);
        }
      }
    });

    const stats = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyStats(stats);
  };

  const getRevenueForPeriod = (days: number) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return transactions
      .filter(tx =>
        new Date(tx.createdAt) >= cutoff &&
        tx.status === 'COMPLETED' &&
        tx.amount
      )
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseErrorAlert show={databaseError} onClose={() => setDatabaseError(false)} />

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
            <div className="text-2xl font-bold text-gray-900">{getRevenueForPeriod(1).toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Week</div>
            <div className="text-2xl font-bold text-gray-900">{getRevenueForPeriod(7).toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Month</div>
            <div className="text-2xl font-bold text-gray-900">{getRevenueForPeriod(30).toFixed(2)} ₽</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">1 Quarter</div>
            <div className="text-2xl font-bold text-gray-900">{getRevenueForPeriod(90).toFixed(2)} ₽</div>
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

        {/* Sort Buttons */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => handleSort('createdAt')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Sort by Date {sortBy === 'createdAt' && (order === 'asc' ? '↑' : '↓')}</button>
          <button onClick={() => handleSort('amount')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Sort by Amount {sortBy === 'amount' && (order === 'asc' ? '↑' : '↓')}</button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
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
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{tx.user.firstName || tx.user.username || tx.user.telegramId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">{tx.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{color: tx.creditsAdded > 0 ? 'green' : 'red'}}>{tx.creditsAdded > 0 ? '+' : ''}{tx.creditsAdded.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{tx.amount ? `${tx.amount} руб.` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{tx.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{tx.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
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
