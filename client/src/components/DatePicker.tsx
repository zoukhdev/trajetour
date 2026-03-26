import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface DatePickerProps {
    value: string;                     // yyyy-MM-dd
    onChange: (val: string) => void;
    label?: string;
    required?: boolean;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    id?: string;
    hasError?: boolean;
}

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function parseDate(val: string): Date | null {
    if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return null;
    const d = new Date(val + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
}

function toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDisplay(val: string): string {
    const d = parseDate(val);
    if (!d) return val;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function parseDisplayInput(raw: string): string {
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return '';
}

export default function DatePicker({
    value, onChange, label, required, className,
    inputClassName, placeholder = 'jj/mm/aaaa', id, hasError
}: DatePickerProps) {
    const parsed = parseDate(value);
    const today = new Date();

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
    const [rawInput, setRawInput] = useState(value ? formatDisplay(value) : '');
    const [yearInputMode, setYearInputMode] = useState(false);
    const [yearInputVal, setYearInputVal] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync rawInput when value changes externally
    useEffect(() => {
        setRawInput(value ? formatDisplay(value) : '');
    }, [value]);

    // Position the portal dropdown relative to the input
    const computePosition = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const calendarHeight = 330;

        if (spaceBelow >= calendarHeight) {
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left: rect.left,
                width: Math.max(rect.width, 280),
                zIndex: 99999,
            });
        } else {
            // open upward
            setDropdownStyle({
                position: 'fixed',
                bottom: window.innerHeight - rect.top + 6,
                left: rect.left,
                width: Math.max(rect.width, 280),
                zIndex: 99999,
            });
        }
    };

    const handleOpen = () => {
        if (parsed) {
            setViewYear(parsed.getFullYear());
            setViewMonth(parsed.getMonth());
        }
        computePosition();
        setOpen(true);
    };

    // Re-position on scroll / resize while open
    useEffect(() => {
        if (!open) return;
        const update = () => computePosition();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                wrapperRef.current && !wrapperRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

    const handleDayClick = (day: number) => {
        const selected = new Date(viewYear, viewMonth, day);
        const ymd = toYMD(selected);
        onChange(ymd);
        setRawInput(formatDisplay(ymd));
        setOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setRawInput(raw);
        const converted = parseDisplayInput(raw);
        if (converted) onChange(converted);
    };

    const handleTextBlur = () => {
        const converted = parseDisplayInput(rawInput);
        if (converted) {
            onChange(converted);
            setRawInput(formatDisplay(converted));
        } else if (!rawInput) {
            onChange('');
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setRawInput('');
    };

    // Build calendar grid
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const isSelected = (day: number) =>
        parsed &&
        parsed.getFullYear() === viewYear &&
        parsed.getMonth() === viewMonth &&
        parsed.getDate() === day;

    const isToday = (day: number) =>
        today.getFullYear() === viewYear &&
        today.getMonth() === viewMonth &&
        today.getDate() === day;

    const calendar = (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl select-none overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                <button type="button" onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600">
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <span className="px-1.5 py-0.5 rounded hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
                        {MONTHS_FR[viewMonth]}
                    </span>

                    {yearInputMode ? (
                        <input
                            autoFocus
                            type="number"
                            value={yearInputVal}
                            onChange={e => setYearInputVal(e.target.value)}
                            onBlur={() => {
                                const y = parseInt(yearInputVal);
                                if (y > 1900 && y < 2200) setViewYear(y);
                                setYearInputMode(false);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const y = parseInt(yearInputVal);
                                    if (y > 1900 && y < 2200) setViewYear(y);
                                    setYearInputMode(false);
                                }
                                if (e.key === 'Escape') setYearInputMode(false);
                            }}
                            className="w-16 text-center text-sm border border-primary rounded outline-none px-1"
                        />
                    ) : (
                        <span
                            className="px-1.5 py-0.5 rounded hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer underline decoration-dotted"
                            onClick={() => { setYearInputVal(String(viewYear)); setYearInputMode(true); }}
                        >
                            {viewYear}
                        </span>
                    )}
                </div>

                <button type="button" onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 px-2 pt-2 pb-1">
                {DAYS_FR.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
                {cells.map((day, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {day ? (
                            <button
                                type="button"
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    'w-8 h-8 rounded-full text-sm font-medium transition-all duration-150',
                                    isSelected(day)
                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                        : isToday(day)
                                            ? 'border-2 border-primary text-primary font-bold'
                                            : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                                )}
                            >
                                {day}
                            </button>
                        ) : (
                            <span className="w-8 h-8" />
                        )}
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                <button
                    type="button"
                    onClick={() => {
                        const ymd = toYMD(today);
                        onChange(ymd);
                        setRawInput(formatDisplay(ymd));
                        setOpen(false);
                    }}
                    className="flex-1 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                    Aujourd'hui
                </button>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    Fermer
                </button>
            </div>
        </div>
    );

    return (
        <div className={cn('relative', className)} ref={wrapperRef}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Input row */}
            <div className={cn(
                'flex items-center border rounded-lg bg-white transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary',
                hasError ? 'border-red-400 bg-red-50' : 'border-gray-300',
                inputClassName
            )}>
                <input
                    id={id}
                    type="text"
                    value={rawInput}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    placeholder={placeholder}
                    required={required}
                    inputMode="numeric"
                    className="flex-1 px-3 py-2 text-sm outline-none bg-transparent placeholder-gray-400 min-w-0"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        tabIndex={-1}
                        title="Effacer"
                    >
                        <X size={14} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => open ? setOpen(false) : handleOpen()}
                    className="px-3 py-2 border-l border-gray-200 hover:bg-blue-50 transition-colors text-primary shrink-0 rounded-r-lg"
                    tabIndex={-1}
                    title="Ouvrir le calendrier"
                >
                    <CalendarDays size={18} />
                </button>
            </div>

            {/* Calendar portal — renders on document.body to escape overflow:hidden */}
            {open && createPortal(calendar, document.body)}
        </div>
    );
}
