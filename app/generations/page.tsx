'use client';

import { useState, useEffect } from 'react';

interface Generation {
  id: string;
  type: string;
  prompt: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
  user: { username: string | null; firstName: string | null; telegramId: string };
}

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGenerations();
  }, [typeFilter]);

  const fetchGenerations = async () => {
    try {
      const params = typeFilter ? `?type=${typeFilter}` : '';
      const res = await fetch(`/api/generations${params}`);
      setGenerations(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (id: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🎨 Generations</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <tr key={gen.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{gen.user.firstName || gen.user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">{gen.type}</span></td>
                    <td className="px-6 py-4 text-sm max-w-md">
                      <div className={`${expandedPrompts.has(gen.id) ? '' : 'line-clamp-2'} text-gray-800`}>
                        {gen.prompt}
                      </div>
                      {gen.prompt.length > 100 && (
                        <button
                          onClick={() => togglePrompt(gen.id)}
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
        )}
      </main>
    </div>
  );
}
