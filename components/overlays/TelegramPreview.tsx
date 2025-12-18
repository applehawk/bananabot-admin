'use client';

interface PayloadButton {
    text: string;
    action: 'CALLBACK' | 'URL' | 'PAYMENT' | 'DISMISS';
    payload?: string;
    url?: string;
}

interface Payload {
    message?: {
        text?: string;
        parseMode?: 'HTML' | 'MarkdownV2';
        photoUrl?: string;
        fileId?: string;
    };
    buttons?: PayloadButton[];
}

interface TelegramPreviewProps {
    payload: Payload;
}

export default function TelegramPreview({ payload }: TelegramPreviewProps) {
    const hasMedia = payload.message?.photoUrl || payload.message?.fileId;
    const messageText = payload.message?.text || 'No message text';
    const buttons = payload.buttons || [];

    // Simple HTML to text conversion for preview (Telegram would render HTML properly)
    const renderMessageText = (text: string) => {
        // Replace {{variables}} with sample data
        let previewText = text
            .replace(/\{\{name\}\}/g, 'John')
            .replace(/\{\{credits\}\}/g, '100')
            .replace(/\{\{firstName\}\}/g, 'John')
            .replace(/\{\{lastName\}\}/g, 'Doe');

        // Simple HTML tag removal for preview (you could use dangerouslySetInnerHTML for real HTML rendering)
        const withoutTags = previewText
            .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
            .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
            .replace(/<code>(.*?)<\/code>/g, '<code class="bg-gray-200 px-1 rounded text-xs">$1</code>');

        return <div dangerouslySetInnerHTML={{ __html: withoutTags }} />;
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Telegram App Chrome */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-xl px-4 py-3 flex items-center gap-3 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    🤖
                </div>
                <div className="flex-1">
                    <div className="text-white font-semibold">BananaBot</div>
                    <div className="text-white/70 text-xs">online</div>
                </div>
                <div className="text-white/50">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                </div>
            </div>

            {/* Chat Background */}
            <div className="bg-[#0f1419] p-4 min-h-[500px] flex flex-col justify-end relative overflow-hidden rounded-b-xl shadow-lg">
                {/* Telegram Pattern Background */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {/* Message Bubble */}
                <div className="relative z-10 flex flex-col items-start gap-2 animate-fadeIn">
                    <div className="max-w-[85%] bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl rounded-tl-sm shadow-xl overflow-hidden">
                        {/* Media Section */}
                        {hasMedia && (
                            <div className="bg-gray-900 flex items-center justify-center h-48 border-b border-gray-700">
                                {payload.message?.photoUrl ? (
                                    <img
                                        src={payload.message.photoUrl}
                                        alt="Message media"
                                        className="max-h-48 w-auto object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`flex items-center justify-center gap-2 text-gray-500 ${payload.message?.photoUrl ? 'hidden' : ''}`}>
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Image Preview</span>
                                </div>
                            </div>
                        )}

                        {/* Message Text */}
                        <div className="px-4 py-3">
                            <div className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {renderMessageText(messageText)}
                            </div>
                        </div>

                        {/* Inline Keyboard Buttons */}
                        {buttons.length > 0 && (
                            <div className="px-2 pb-2 space-y-1">
                                {/* Check if buttons are 2D array (Rows) or 1D array (Legacy) */}
                                {(Array.isArray(buttons[0])
                                    ? buttons as unknown as PayloadButton[][]
                                    : Array.from({ length: Math.ceil(buttons.length / 2) }).map((_, i) => buttons.slice(i * 2, i * 2 + 2)) as unknown as PayloadButton[][]
                                ).map((row, rowIdx) => (
                                    <div key={rowIdx} className="flex gap-1">
                                        {row.map((btn, btnIdx) => (
                                            <button
                                                key={btnIdx}
                                                className="flex-1 bg-gray-600/50 hover:bg-gray-600/70 text-white text-sm py-2.5 px-3 rounded-lg transition-colors duration-200 border border-gray-500/30 font-medium"
                                                title={btn.action === 'URL' ? btn.url : btn.payload}
                                            >
                                                {btn.action === 'URL' && '🔗 '}
                                                {btn.text}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message Time */}
                        <div className="px-4 pb-2 flex justify-end items-center gap-1">
                            <span className="text-gray-400 text-[10px]">
                                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom toolbar */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 rounded-b-xl border-t border-gray-700">
                <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-400">
                    Message...
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
