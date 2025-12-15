import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface ImmersionHeaderProps {
    isFsmEnabled: boolean;
    onToggleFsm: (checked: boolean) => void;
    onRunImmersion: () => void;
}

export function ImmersionHeader({
    isFsmEnabled,
    onToggleFsm,
    onRunImmersion
}: ImmersionHeaderProps) {
    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">FSM Live View</h1>
                        <p className="mt-1 text-sm text-gray-500">Monitor and control user flow via FSM</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 border p-2 rounded-lg bg-gray-50">
                            <Switch id="fsm-mode" checked={isFsmEnabled} onCheckedChange={onToggleFsm} />
                            <label htmlFor="fsm-mode" className="text-sm font-medium text-gray-700">Global FSM Enable</label>
                        </div>

                        <Button onClick={onRunImmersion} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Run Immersion
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
