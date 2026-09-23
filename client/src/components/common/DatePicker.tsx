import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

interface DatePickerProps {
  value?: string | null;
  onChange: (isoString: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Set due date...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected date parsed
  const selectedDate = value ? new Date(value) : null;

  // Current viewing month and year in calendar
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate && !isNaN(selectedDate.getTime()) ? new Date(selectedDate) : new Date();
  });

  // Keep viewDate in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(new Date(d));
      }
    }
  }, [value]);

  // Click outside & Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopImmediatePropagation();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Navigate months
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  // 1st day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Days array: { day, monthOffset: -1 | 0 | 1, dateObj }
  interface CalendarDay {
    day: number;
    isCurrentMonth: boolean;
    date: Date;
  }

  const days: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    days.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(year, month - 1, d),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    if (!selectedDate) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleSelectDate = (d: Date) => {
    // Set to noon to avoid timezone shift
    const adjusted = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    onChange(adjusted.toISOString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  // Quick preset actions
  const setPreset = (type: 'today' | 'tomorrow' | 'nextWeek') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (type === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    }
    const adjusted = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    onChange(adjusted.toISOString());
    setViewDate(adjusted);
    setIsOpen(false);
  };

  // Format display text
  const formatDisplay = () => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return placeholder;

    if (isToday(selectedDate)) {
      return 'Today';
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (
      selectedDate.getDate() === tomorrow.getDate() &&
      selectedDate.getMonth() === tomorrow.getMonth() &&
      selectedDate.getFullYear() === tomorrow.getFullYear()
    ) {
      return 'Tomorrow';
    }

    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const hasValue = Boolean(selectedDate && !isNaN(selectedDate.getTime()));

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium transition-all group ${
          hasValue
            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-2xs hover:bg-indigo-50 hover:border-indigo-300'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              hasValue ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span className={`truncate ${hasValue ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
            {formatDisplay()}
          </span>
        </div>

        {hasValue && (
          <span
            onClick={handleClear}
            title="Clear due date"
            className="p-0.5 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Floating Popover Calendar */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Presets Bar */}
          <div className="grid grid-cols-3 gap-1 mb-3 pb-2.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setPreset('today')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-center"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset('tomorrow')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-center"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setPreset('nextWeek')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-center"
            >
              +1 Week
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-slate-800">
              {monthNames[month]} <span className="text-slate-400 font-medium">{year}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                title="Previous Month"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                title="Next Month"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 text-center mb-1">
            {daysOfWeek.map((day) => (
              <span
                key={day}
                className="text-[10px] font-semibold text-slate-400 uppercase py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              const selected = isSelected(item.date);
              const today = isToday(item.date);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(item.date)}
                  className={`h-8 w-full rounded-xl text-xs font-medium flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : item.isCurrentMonth
                      ? 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'
                  } ${today && !selected ? 'border border-indigo-400/80 font-semibold text-indigo-600' : ''}`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Clear Footer */}
          {hasValue && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Due: {selectedDate?.toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold px-2 py-0.5 hover:bg-rose-50 rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
