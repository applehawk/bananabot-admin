"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, Pause, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImmersionRunModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

type RunStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export function ImmersionRunModal({ isOpen, onClose, onComplete }: ImmersionRunModalProps) {
    const [status, setStatus] = useState<RunStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Refs for batch control
    const abortController = useRef<AbortController | null>(null);
    const isPausedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setStatus('idle');
            setProgress(0);
            setProcessedCount(0);
            setTotalUsers(0);
            setLogs([]);
            isPausedRef.current = false;
        }
    }, [isOpen]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const runBatch = async (skip: number, take: number) => {
        try {
            const res = await fetch('/admin/api/fsm/immersion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skip, take }),
                signal: abortController.current?.signal
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e: any) {
            if (e.name === 'AbortError') return null;
            throw e;
        }
    };

    const startImmersion = async () => {
        if (status === 'running') return;

        setStatus('running');
        isPausedRef.current = false;
        abortController.current = new AbortController();

        addLog('Starting immersion process...');

        try {
            const BATCH_SIZE = 50;
            let currentSkip = processedCount; // Resume from where we left or 0

            // First run to ascertain total count if unknown, or just start
            while (true) {
                if (isPausedRef.current) {
                    setStatus('paused');
                    addLog('Paused.');
                    return;
                }

                addLog(`Processing batch: ${currentSkip} - ${currentSkip + BATCH_SIZE}...`);

                const data = await runBatch(currentSkip, BATCH_SIZE);
                if (!data) break; // Aborted

                if (data.error) throw new Error(data.error);

                const batchProcessed = data.processed;
                const total = data.totalUsers;

                setTotalUsers(total);

                currentSkip += batchProcessed;
                setProcessedCount(currentSkip);

                if (total > 0) {
                    setProgress(Math.min(100, Math.round((currentSkip / total) * 100)));
                }

                if (batchProcessed < BATCH_SIZE || currentSkip >= total) {
                    setStatus('completed');
                    setProgress(100);
                    addLog('Immersion completed successfully.');
                    if (onComplete) onComplete();
                    break;
                }

                // Small delay to breathe
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setStatus('error');
                addLog(`Error: ${e.message}`);
            }
        }
    };

    const handleStop = () => {
        isPausedRef.current = true;
        if (abortController.current) {
            abortController.current.abort();
        }
        setStatus('idle');
        addLog('Stopped.');
    };

    const handlePause = () => {
        isPausedRef.current = true;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && status !== 'running') onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>FSM Immersion Process</DialogTitle>
                    <DialogDescription>
                        Recalculate FSM state for all users based on their history. This may take a while.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Status Display */}
                    <div className="flex items-center justify-between text-sm font-medium">
                        <span>Status: <span className="uppercase">{status}</span></span>
                        <span>{processedCount} / {totalUsers || '?'} Users</span>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={progress} className="h-2" />

                    {/* Alerts */}
                    {status === 'error' && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Something went wrong. Check logs below.
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === 'completed' && (
                        <Alert className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Complete</AlertTitle>
                            <AlertDescription>
                                All users have been processed.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Logs */}
                    <div className="border rounded bg-gray-50 text-xs font-mono p-2">
                        <ScrollArea className="h-[150px]">
                            {logs.length === 0 ? <span className="text-gray-400">No logs yet...</span> : logs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <div className="flex gap-2">
                        {status === 'running' ? (
                            <Button variant="outline" onClick={handlePause}>
                                <Pause className="mr-2 h-4 w-4" /> Pause
                            </Button>
                        ) : (
                            <Button
                                onClick={startImmersion}
                                disabled={status === 'completed'}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Play className="mr-2 h-4 w-4" />
                                {status === 'paused' || status === 'error' ? 'Resume' : 'Start'}
                            </Button>
                        )}

                        {(status === 'running' || status === 'paused') && (
                            <Button variant="destructive" onClick={handleStop}>Stop</Button>
                        )}
                    </div>

                    <Button variant="ghost" onClick={onClose} disabled={status === 'running'}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
