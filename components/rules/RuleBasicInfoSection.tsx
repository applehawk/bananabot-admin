import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import { RULE_TRIGGERS, TRIGGER_DESCRIPTIONS } from './constants';

interface RuleBasicInfoSectionProps {
    formData: any;
    setFormData: (data: any) => void;
    existingGroups: string[];
}

export function RuleBasicInfoSection({ formData, setFormData, existingGroups }: RuleBasicInfoSectionProps) {
    return (
        <div className="col-span-2 space-y-4 border p-4 rounded-md bg-gray-50">
            <h3 className="font-semibold text-sm">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs">Code (Unique ID)</label>
                    <input
                        className="w-full border rounded p-2 text-sm"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs flex items-center gap-1">
                        Trigger Event
                    </label>
                    <div className="flex gap-2 items-center">
                        <select
                            className="w-full border rounded p-2 text-sm bg-white"
                            value={formData.trigger}
                            onChange={e => setFormData({ ...formData, trigger: e.target.value })}
                        >
                            {RULE_TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="relative group">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-64 p-2 bg-black text-white text-xs rounded shadow-lg z-50 hidden group-hover:block pointer-events-none">
                                {TRIGGER_DESCRIPTIONS[formData.trigger] || 'No description available.'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-1">
                    <label className="text-xs">Description</label>
                    <input
                        className="w-full border rounded p-2 text-sm"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-xs">Group</label>
                    <input
                        className="w-full border rounded p-2 text-sm"
                        placeholder='e.g. Onboarding, Safety'
                        value={formData.group || 'General'}
                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                        list="group-suggestions"
                    />
                    <datalist id="group-suggestions">
                        {existingGroups.map(g => <option key={g} value={g} />)}
                    </datalist>
                </div>
                <div className="flex items-center gap-4">

                    <div className="flex items-center gap-2 mt-4">
                        <Switch
                            checked={formData.isActive}
                            onCheckedChange={c => setFormData({ ...formData, isActive: c })}
                        />
                        <span className="text-sm">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
