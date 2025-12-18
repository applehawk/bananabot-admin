'use client';

import { Info } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
    content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ left: 0, top: 0 });

    return (
        <>
            <span
                className="inline-flex items-center ml-1 cursor-help align-bottom text-gray-400 hover:text-indigo-500 transition-colors"
                onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCoords({
                        left: rect.left + rect.width / 2,
                        top: rect.top
                    });
                    setIsVisible(true);
                }}
                onMouseLeave={() => setIsVisible(false)}
            >
                <Info className="w-4 h-4" />
            </span>
            {isVisible && <TooltipPortal content={content} coords={coords} />}
        </>
    );
}

function TooltipPortal({ content, coords }: { content: string, coords: { left: number, top: number } }) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64 text-center pointer-events-none"
            style={{
                left: coords.left,
                top: coords.top,
                transform: 'translate(-50%, -100%) translateY(-8px)'
            }}
        >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>,
        document.body
    );
}
