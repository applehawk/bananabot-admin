'use client';

import { useState, useEffect } from 'react';

// --- Types ---

interface PayloadButton {
    text: string;
    action: 'CALLBACK' | 'URL' | 'PAYMENT' | 'DISMISS';
    payload?: string; // callback_data or url or payment id
    url?: string;
}

interface Payload {
    message?: {
        text?: string;
        parseMode?: 'HTML' | 'MarkdownV2';
        photoUrl?: string; // or file_id
        fileId?: string;
    };
    // Supports both legacy 1D array and new 2D array (rows)
    buttons?: PayloadButton[] | PayloadButton[][];
}

interface PayloadEditorProps {
    value: Payload;
    onChange: (payload: Payload) => void;
}

// --- Constants ---

const VARIABLE_LEGEND = [
    { label: 'User Info', vars: ['{{name}}', '{{firstName}}', '{{lastName}}', '{{referralCode}}'] },
    { label: 'Credits & Economy', vars: ['{{credits}}', '{{amount}}'] },
    { label: 'Sales & Offers', vars: ['{{price}}', '{{packageName}}', '{{hours}}', '{{paymentUrl}}'] },
    { label: 'System', vars: ['{{reason}}', '{{step}}'] },
];

const BUTTON_ACTIONS = [
    { value: 'CALLBACK', label: 'Callback', placeholder: 'action_data' },
    { value: 'URL', label: 'URL', placeholder: 'https://example.com' },
    { value: 'PAYMENT', label: 'Payment', placeholder: 'package_id' },
    { value: 'DISMISS', label: 'Dismiss', placeholder: '' },
];


// --- Helper Functions ---

const normalizeButtons = (btns?: any[]): PayloadButton[][] => {
    if (!btns || btns.length === 0) return [];
    // Check if already 2D
    if (Array.isArray(btns[0])) return btns as PayloadButton[][];
    // Convert Legacy 1D to 2D (Vertical Stack is default Telegram behavior for 1D)
    // Actually, Telegram's default for simple array might be vertical? 
    // OverlayProcessor previously did `keyboard.row()` after every button, so 1 button per row.
    return btns.map(b => [b]);
};

export default function PayloadEditor({ value, onChange }: PayloadEditorProps) {
    // Internal state uses fully normalized 2D array for buttons
    const [message, setMessage] = useState(value?.message || {});
    const [buttonRows, setButtonRows] = useState<PayloadButton[][]>(normalizeButtons(value?.buttons));
    const [activeTab, setActiveTab] = useState<'MESSAGE' | 'BUTTONS' | 'JSON'>('MESSAGE');

    // Sync from props if external changes happen (usually initial load)
    useEffect(() => {
        setMessage(value?.message || {});
        setButtonRows(normalizeButtons(value?.buttons));
    }, [value]);

    const notifyChange = (newMsg: any, newRows: PayloadButton[][]) => {
        onChange({
            message: newMsg,
            buttons: newRows
        });
    };

    // --- Message Handlers ---

    const updateMessage = (field: string, val: string) => {
        const newMsg = { ...message, [field]: val };
        setMessage(newMsg);
        notifyChange(newMsg, buttonRows);
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('message-text') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = message.text || '';
            const newText = text.substring(0, start) + variable + text.substring(end);
            updateMessage('text', newText);
            // Optional: Restore focus/cursor (requires ref, skipping for simplicity)
        } else {
            updateMessage('text', (message.text || '') + variable);
        }
    };

    // --- Button Handlers ---

    const addRow = () => {
        const newRows = [...buttonRows, []];
        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    const addButtonToRow = (rowIndex: number) => {
        const newRows = [...buttonRows];
        newRows[rowIndex] = [...newRows[rowIndex], { text: 'New Button', action: 'CALLBACK', payload: 'action' }];
        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    const updateButton = (rowIndex: number, btnIndex: number, field: keyof PayloadButton, val: string) => {
        const newRows = [...buttonRows];
        const btn = { ...newRows[rowIndex][btnIndex], [field]: val };

        // Auto-fix URL vs Payload field semantic
        if (field === 'action') {
            if (val === 'URL' && !btn.url) btn.url = 'https://';
            if (val !== 'URL') btn.url = undefined;
        } else if (field === 'payload') {
            btn.payload = val;
        } else if (field === 'url') {
            btn.url = val;
        }

        newRows[rowIndex][btnIndex] = btn;
        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    const removeButton = (rowIndex: number, btnIndex: number) => {
        const newRows = [...buttonRows];
        newRows[rowIndex].splice(btnIndex, 1);
        if (newRows[rowIndex].length === 0) {
            newRows.splice(rowIndex, 1); // Remove empty row
        }
        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    const removeRow = (rowIndex: number) => {
        const newRows = [...buttonRows];
        newRows.splice(rowIndex, 1);
        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    const moveRow = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === buttonRows.length - 1) return;

        const newRows = [...buttonRows];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];

        setButtonRows(newRows);
        notifyChange(message, newRows);
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-full">
            <div className="flex border-b bg-gray-50 flex-none">
                {['MESSAGE', 'BUTTONS', 'JSON'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
                            ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'MESSAGE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Message Text</label>
                                    <span className="text-xs text-gray-400">HTML Supported</span>
                                </div>
                                <textarea
                                    id="message-text"
                                    className="w-full border rounded-lg p-3 text-sm font-mono h-[300px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={message.text || ''}
                                    onChange={e => updateMessage('text', e.target.value)}
                                    placeholder="Enter your message here..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Media URL / File ID</label>
                                <input
                                    className="w-full border rounded p-2 text-sm"
                                    value={message.photoUrl || message.fileId || ''}
                                    onChange={e => updateMessage('photoUrl', e.target.value)}
                                    placeholder="https://example.com/image.jpg or AgAC..."
                                />
                            </div>
                        </div>

                        {/* Variable Legend Sidebar */}
                        <div className="bg-gray-50 rounded-lg p-4 border h-full overflow-y-auto">
                            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 border-b pb-2">Available Variables</h4>
                            <div className="space-y-4">
                                {VARIABLE_LEGEND.map((group, idx) => (
                                    <div key={idx}>
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">{group.label}</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {group.vars.map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => insertVariable(v)}
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-indigo-600 font-mono hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                                                    title="Click to insert"
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t text-[10px] text-gray-400">
                                Click any variable to insert it into the message text at cursor position.
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'BUTTONS' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700">Inline Keyboard Editor</h3>
                            <button
                                onClick={addRow}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 shadow-sm"
                            >
                                + Add Row
                            </button>
                        </div>

                        <div className="space-y-4 min-h-[300px] bg-slate-50 p-4 rounded-lg border border-slate-200 dashed-pattern">
                            {buttonRows.map((row, rowIdx) => (
                                <div key={rowIdx} className="bg-white border rounded-lg p-3 shadow-sm relative group">
                                    {/* Handle & Controls */}
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveRow(rowIdx, 'up')} disabled={rowIdx === 0} className="w-6 h-6 bg-white border rounded shadow flex items-center justify-center text-gray-500 hover:text-indigo-600 disabled:opacity-30">▲</button>
                                        <button onClick={() => moveRow(rowIdx, 'down')} disabled={rowIdx === buttonRows.length - 1} className="w-6 h-6 bg-white border rounded shadow flex items-center justify-center text-gray-500 hover:text-indigo-600 disabled:opacity-30">▼</button>
                                    </div>

                                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Row {rowIdx + 1}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => removeRow(rowIdx)}
                                                className="text-red-400 hover:text-red-600 text-xs px-2"
                                            >
                                                Delete Row
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {row.map((btn, btnIdx) => (
                                            <div key={btnIdx} className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded p-2 flex flex-col gap-2">
                                                <div className="flex justify-between">
                                                    <span className="text-[10px] text-gray-400 font-mono">Button {btnIdx + 1}</span>
                                                    <button onClick={() => removeButton(rowIdx, btnIdx)} className="text-gray-400 hover:text-red-500">×</button>
                                                </div>
                                                <input
                                                    className="border rounded px-2 py-1 text-sm w-full"
                                                    placeholder="Label"
                                                    value={btn.text}
                                                    onChange={e => updateButton(rowIdx, btnIdx, 'text', e.target.value)}
                                                />
                                                <div className="flex gap-1">
                                                    <select
                                                        className="border rounded px-1 py-1 text-xs w-24 bg-white"
                                                        value={btn.action}
                                                        onChange={e => updateButton(rowIdx, btnIdx, 'action', e.target.value as any)}
                                                    >
                                                        {BUTTON_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                                    </select>

                                                    {btn.action !== 'DISMISS' && (
                                                        <input
                                                            className="border rounded px-2 py-1 text-xs flex-1 font-mono"
                                                            placeholder={BUTTON_ACTIONS.find(a => a.value === btn.action)?.placeholder}
                                                            value={btn.action === 'URL' ? (btn.url || '') : (btn.payload || '')}
                                                            onChange={e => updateButton(rowIdx, btnIdx, btn.action === 'URL' ? 'url' : 'payload', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addButtonToRow(rowIdx)}
                                            className="flex-none w-10 border-2 border-dashed border-gray-300 rounded hover:border-indigo-400 hover:bg-indigo-50 text-gray-300 hover:text-indigo-400 transition-colors flex items-center justify-center font-bold text-xl"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {buttonRows.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <p className="mb-2">No buttons yet.</p>
                                    <button onClick={addRow} className="text-indigo-600 hover:underline">Create First Row</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'JSON' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Raw Payload JSON</label>
                        <textarea
                            className="w-full border rounded p-4 text-xs font-mono h-[400px] bg-gray-900 text-green-400 custom-scrollbar"
                            value={JSON.stringify({ message, buttons: buttonRows }, null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    if (parsed.message) setMessage(parsed.message);
                                    if (parsed.buttons) setButtonRows(normalizeButtons(parsed.buttons));
                                    notifyChange(parsed.message, normalizeButtons(parsed.buttons));
                                } catch { }
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #d1d5db;
                }
            `}</style>
        </div>
    );
}
