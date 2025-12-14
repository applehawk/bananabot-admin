'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Pause, Play } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LogType = 'bot' | 'admin';

export default function LogsPage() {
    const [activeTab, setActiveTab] = useState<LogType>('bot');
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [linesToFetch, setLinesToFetch] = useState(100);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/admin/api/logs?type=${activeTab}&lines=${linesToFetch}`);
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (err) {
            setError('Failed to load logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(() => {
            if (autoScroll) {
                fetchLogs();
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [activeTab, linesToFetch, autoScroll]);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop === clientHeight;
            // If user scrolls up, disable auto-scroll
            if (!isAtBottom) {
                setAutoScroll(false);
            } else {
                setAutoScroll(true);
            }
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Logs</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        View real-time logs from Bot and Admin services.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchLogs}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'bot'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    onClick={() => setActiveTab('bot')}
                >
                    Bot Logs
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'admin'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    onClick={() => setActiveTab('admin')}
                >
                    Admin Logs
                </button>
            </div>

            <Card className="bg-gray-950 text-gray-100 border-gray-800 p-0 overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <div className="text-xs text-gray-400 font-mono">
                        {activeTab === 'bot' ? 'logs/bot.log' : 'logs/admin.log'}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Lines:</span>
                            <select
                                value={linesToFetch}
                                onChange={(e) => setLinesToFetch(Number(e.target.value))}
                                className="bg-gray-800 border-none text-xs text-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="100">100</option>
                                <option value="500">500</option>
                                <option value="1000">1000</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 select-none">
                                <input
                                    type="checkbox"
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                    className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-offset-gray-900"
                                />
                                Auto-scroll
                            </label>
                        </div>
                    </div>
                </div>

                <div
                    className="flex-1 overflow-auto p-4 font-mono text-sm leading-6"
                    ref={scrollContainerRef}
                    onScroll={() => {
                        // Simple logic: if checking uncheck autoscroll if user scrolls up could go here
                        // For now relying on simple click or manual toggle
                    }}
                >
                    {error ? (
                        <div className="text-red-400">{error}</div>
                    ) : logs.length === 0 ? (
                        <div className="text-gray-500 italic">No logs found or empty file.</div>
                    ) : (
                        logs.map((log, index) => {
                            // Basic JSON parsing if applicable
                            let display = log;
                            let levelColor = 'text-gray-300';

                            // Try to detect levels for coloring
                            if (log.includes('INFO') || log.includes('"level":"info"')) levelColor = 'text-green-400';
                            if (log.includes('WARN') || log.includes('"level":"warn"')) levelColor = 'text-yellow-400';
                            if (log.includes('ERROR') || log.includes('"level":"error"')) levelColor = 'text-red-400';
                            if (log.includes('DEBUG') || log.includes('"level":"debug"')) levelColor = 'text-blue-400';

                            return (
                                <div key={index} className={`${levelColor} whitespace-pre-wrap break-all border-l-2 border-transparent hover:border-gray-700 hover:bg-gray-900/50 px-2`}>
                                    {display}
                                </div>
                            )
                        })
                    )}
                    <div ref={logsEndRef} />
                </div>
            </Card>

            <div className="text-xs text-gray-500">
                Logs are streamed from the server. Use `docker-compose logs` for full history if needed.
            </div>
        </div>
    );
}
