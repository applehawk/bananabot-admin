'use client';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FSM_CONTEXT_VARIABLES } from '../constants';
import { validateFormula } from './parser';

interface FormulaEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    extraVariables?: string[];
}

interface ValidationError {
    message: string;
    position?: number;
    length?: number;
}

export function FormulaEditor({
    value,
    onChange,
    placeholder = 'e.g., (credits > 100 AND isPaidUser == true) OR totalGenerations < 5',
    extraVariables = []
}: FormulaEditorProps) {
    const [error, setError] = useState<ValidationError | null>(null);
    const [showInlineAutocomplete, setShowInlineAutocomplete] = useState(false);
    const [inlineAutocompleteOptions, setInlineAutocompleteOptions] = useState<string[]>([]);
    const [selectedInlineIndex, setSelectedInlineIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    const allVariables = [...FSM_CONTEXT_VARIABLES, ...extraVariables];

    // State for caret coordinates
    const [caretCoordinates, setCaretCoordinates] = useState<{ top: number; left: number } | null>(null);

    // Validate formula on change
    useEffect(() => {
        if (!value.trim()) {
            setError(null);
            return;
        }

        const validation = validateFormula(value, allVariables);
        if (validation.valid) {
            setError(null);
        } else {
            setError({
                message: validation.error || 'Invalid formula',
                position: validation.position,
                length: validation.length || 1
            });
        }
    }, [value, extraVariables]);

    // Helper to calculate caret coordinates
    const updateCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
        const { value } = element;
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);

        // Copy styles
        Array.from(style).forEach((prop) => {
            div.style.setProperty(prop, style.getPropertyValue(prop), style.getPropertyPriority(prop));
        });

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.overflow = 'hidden';

        // We need to copy specific box model properties carefully
        div.style.width = style.width;
        div.style.height = 'auto';
        div.style.padding = style.padding;
        div.style.border = style.border;
        div.style.boxSizing = style.boxSizing;
        div.style.font = style.font;
        div.style.fontFamily = style.fontFamily;
        div.style.fontSize = style.fontSize;
        div.style.lineHeight = style.lineHeight;
        div.style.letterSpacing = style.letterSpacing;

        // Content up to cursor
        const textBefore = value.substring(0, position);
        div.textContent = textBefore;

        const span = document.createElement('span');
        span.textContent = '|'; // Caret marker
        div.appendChild(span);

        document.body.appendChild(div);

        const { offsetLeft, offsetTop } = span;
        const { lineHeight } = style;

        // Calculate adjustments based on scroll and element position is NOT needed here 
        // because we want coordinates relative to the textarea's top-left corner
        // to position the absolute dropdown inside the relative container.

        // However, we need to account for padding/border of the textarea itself in the offset?
        // simple-keyboard/react-textarea-caret usually handles this. 
        // Let's rely on the span's offset relative to the div which mirrors the textarea inner content box better.

        // Actually, offsetLeft/Top of the span inside the div gives position relative to the div's content box.
        // We might need to adjust for the textarea's padding if the div mimics it 1:1 including padding.
        // If we copied padding to the div, the text starts at the correct inner offset.

        // Just return the span's offsets.
        // Also add line height to top to show BELOW the line.
        const lh = parseInt(lineHeight) || 20;

        document.body.removeChild(div);

        setCaretCoordinates({
            left: offsetLeft,
            top: offsetTop + lh
        });
    };

    // Handle input change with inline autocomplete
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPos = e.target.selectionStart || 0;
        setCursorPosition(cursorPos);

        // Update caret coordinates
        updateCaretCoordinates(e.target, cursorPos);

        // Get word at cursor for inline autocomplete
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];

        // Show inline autocomplete if typing a word (not operators/parentheses)
        if (currentWord.length > 0 && !/[()=<>!]/.test(currentWord)) {
            const matches = allVariables.filter(v =>
                v.toLowerCase().startsWith(currentWord.toLowerCase())
            );

            if (matches.length > 0 && currentWord !== matches[0]) {
                setInlineAutocompleteOptions(matches);
                setShowInlineAutocomplete(true);
                setSelectedInlineIndex(0);
            } else {
                setShowInlineAutocomplete(false);
            }
        } else {
            setShowInlineAutocomplete(false);
        }
    };

    // Handle keyboard navigation for inline autocomplete
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showInlineAutocomplete) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedInlineIndex(prev => Math.min(prev + 1, inlineAutocompleteOptions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedInlineIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            insertInlineAutocomplete(inlineAutocompleteOptions[selectedInlineIndex]);
        } else if (e.key === 'Escape') {
            setShowInlineAutocomplete(false);
        }
    };

    // Insert from inline autocomplete
    const insertInlineAutocomplete = (suggestion: string) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];

        // Replace current word with suggestion
        const beforeWord = textBeforeCursor.slice(0, -currentWord.length);
        const newValue = beforeWord + suggestion + textAfterCursor;

        onChange(newValue);
        setShowInlineAutocomplete(false);

        // Set cursor position after inserted text
        setTimeout(() => {
            if (inputRef.current) {
                const newPos = beforeWord.length + suggestion.length;
                inputRef.current.setSelectionRange(newPos, newPos);
                inputRef.current.focus();
            }
        }, 0);
    };

    // Render formula with error highlighting
    const renderHighlightedText = () => {
        if (!error || error.position === undefined) {
            return value;
        }

        const before = value.slice(0, error.position);
        const errorPart = value.slice(error.position, error.position + (error.length || 1));
        const after = value.slice(error.position + (error.length || 1));

        return (
            <>
                {before}
                <span className="bg-red-200 text-red-900 rounded px-0.5">{errorPart}</span>
                {after}
            </>
        );
    };

    return (
        <div className="relative">
            <div className={`border rounded-md overflow-hidden relative ${error ? 'border-red-500 border-2' : ''}`}>
                {/* Highlighted background layer (shows errors) */}
                {error && error.position !== undefined && (
                    <div
                        ref={highlightRef}
                        className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none text-transparent"
                        style={{ lineHeight: '1.5' }}
                    >
                        {renderHighlightedText()}
                    </div>
                )}

                {/* Actual textarea */}
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`w-full p-3 font-mono text-sm resize-none focus:outline-none min-h-[200px] relative ${error
                        ? 'bg-red-50/50 focus:ring-2 focus:ring-red-500'
                        : 'focus:ring-2 focus:ring-blue-500'
                        }`}
                    style={{
                        lineHeight: '1.5',
                        background: error ? 'rgba(254, 242, 242, 0.5)' : 'white'
                    }}
                    spellCheck={false}
                    onSelect={(e) => {
                        // Also update coordinates on click/selection changes
                        setCursorPosition(e.currentTarget.selectionStart);
                        updateCaretCoordinates(e.currentTarget, e.currentTarget.selectionStart);
                    }}
                />
            </div>

            {/* Inline Autocomplete Dropdown */}
            {showInlineAutocomplete && inlineAutocompleteOptions.length > 0 && caretCoordinates && (
                <div
                    className="absolute z-50 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto"
                    style={{
                        top: caretCoordinates.top,
                        left: caretCoordinates.left
                    }}
                >
                    {inlineAutocompleteOptions.map((option, index) => (
                        <div
                            key={option}
                            className={`px-3 py-2 cursor-pointer text-sm font-mono ${index === selectedInlineIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                                }`}
                            onClick={() => insertInlineAutocomplete(option)}
                            onMouseEnter={() => setSelectedInlineIndex(index)}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}


            {/* Error message */}
            {error && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ <strong>Syntax Error:</strong> {error.message}
                    {error.position !== undefined && (
                        <span className="ml-2 text-gray-600">(position {error.position})</span>
                    )}
                </div>
            )}

            {/* Syntax help */}
            {!error && (
                <div className="mt-2 text-xs text-gray-500">
                    <div className="flex gap-4 flex-wrap">
                        <span><strong>Operators:</strong> ==, !=, &gt;, &gt;=, &lt;, &lt;=, in, !in, exists, !exists</span>
                        <span><strong>Logic:</strong> AND, OR, (parentheses)</span>
                        <span className="text-blue-600"><strong>Tip:</strong> Start typing variable name for autocomplete</span>
                    </div>
                </div>
            )}
        </div>
    );
}
