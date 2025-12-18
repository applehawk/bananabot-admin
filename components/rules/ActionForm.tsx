import { Switch } from '@/components/ui/switch';
import { OVERLAY_TYPES } from './constants';

interface ActionFormProps {
    action: any;
    index: number;
    availablePackages: any[];
    onUpdateParam: (index: number, paramKey: string, paramValue: any) => void;
    onUpdateParamsJSON: (index: number, jsonString: string) => void;
}

export function ActionForm({
    action,
    index,
    availablePackages,
    onUpdateParam,
    onUpdateParamsJSON
}: ActionFormProps) {
    const params = action.params || {};

    switch (action.type) {
        case 'ACTIVATE_OVERLAY':
            return (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Overlay Type</label>
                            <select
                                className="w-full border rounded p-1 text-xs bg-white"
                                value={params.type || 'TRIPWIRE'}
                                onChange={e => onUpdateParam(index, 'type', e.target.value)}
                            >
                                {OVERLAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic fields based on Overlay Type */}
                    {params.type === 'SPECIAL_OFFER' && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <select
                                        className="w-full border rounded p-1 text-xs bg-white"
                                        value={params.offerId || ''}
                                        onChange={e => onUpdateParam(index, 'offerId', e.target.value)}
                                    >
                                        <option value="">-- Select Package --</option>
                                        {availablePackages.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - {p.price}₽ ({p.credits} cr)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input type="number" className="border rounded p-1 text-xs w-20" placeholder="TTL (h)"
                                    value={params.ttlHours || 24} onChange={e => onUpdateParam(index, 'ttlHours', Number(e.target.value))} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={params.silent || false} onCheckedChange={c => onUpdateParam(index, 'silent', c)} />
                                <label className="text-xs">Silent (No Notification)</label>
                            </div>
                        </div>
                    )}

                    {params.type === 'BONUS' && (
                        <div className="flex gap-2">
                            <input type="number" className="border rounded p-1 text-xs w-20" placeholder="Amount"
                                value={params.amount || 25} onChange={e => onUpdateParam(index, 'amount', Number(e.target.value))} />
                            <input type="number" className="border rounded p-1 text-xs w-20" placeholder="Hours"
                                value={params.hours || 24} onChange={e => onUpdateParam(index, 'hours', Number(e.target.value))} />
                            <input className="border rounded p-1 text-xs flex-1" placeholder="Reason"
                                value={params.reason || ''} onChange={e => onUpdateParam(index, 'reason', e.target.value)} />
                        </div>
                    )}

                    {params.type === 'TRIPWIRE' && (
                        <div className="text-[10px] text-gray-500 italic">
                            Uses system configured Tripwire Package.
                        </div>
                    )}

                    {params.type === 'REFERRAL' && (
                        <div className="text-[10px] text-gray-500 italic">
                            Activates Referral Program eligibility.
                        </div>
                    )}
                </div>
            );

        case 'DEACTIVATE_OVERLAY':
            return (
                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Overlay Type</label>
                    <select
                        className="w-full border rounded p-1 text-xs bg-white"
                        value={params.type || 'TRIPWIRE'}
                        onChange={e => onUpdateParam(index, 'type', e.target.value)}
                    >
                        {OVERLAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            );

        case 'EMIT_EVENT':
            return (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Event Name</label>
                            <input className="w-full border rounded p-1 text-xs"
                                value={params.event || ''} onChange={e => onUpdateParam(index, 'event', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Payload JSON</label>
                        <textarea
                            className="w-full border rounded p-2 text-xs font-mono bg-gray-50 h-16"
                            placeholder='{"key": "value"}'
                            value={typeof params.payload === 'string' ? params.payload : JSON.stringify(params.payload || {}, null, 2)}
                            onChange={e => onUpdateParam(index, 'payload', e.target.value)}
                        />
                    </div>
                </div>
            );

        case 'TAG_USER':
            return (
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Tag Name</label>
                    <input className="w-full border rounded p-1 text-xs"
                        value={params.tag || ''} onChange={e => onUpdateParam(index, 'tag', e.target.value)} />
                </div>
            );

        case 'LOG_EVENT':
            return (
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Log Message</label>
                    <input className="w-full border rounded p-1 text-xs"
                        value={params.message || ''} onChange={e => onUpdateParam(index, 'message', e.target.value)} />
                </div>
            );
        case 'NO_OP':
            return (
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">Comment</label>
                    <input className="w-full border rounded p-1 text-xs"
                        value={params.comment || ''} onChange={e => onUpdateParam(index, 'comment', e.target.value)} />
                </div>
            );

        default:
            // Fallback JSON Editor
            return (
                <div className="relative">
                    <textarea
                        className="w-full border rounded p-2 text-xs font-mono bg-gray-50 h-20"
                        placeholder='Params JSON (e.g. {"text": "Hello"})'
                        defaultValue={JSON.stringify(params, null, 2)}
                        onBlur={e => onUpdateParamsJSON(index, e.target.value)}
                    />
                    <div className="absolute top-1 right-2 text-[10px] text-gray-400">JSON Params</div>
                </div>
            );
    }
}
