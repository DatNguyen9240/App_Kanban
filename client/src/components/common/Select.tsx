import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle, ArrowUp, ArrowDown, Minus, Circle } from 'lucide-react';
import { Priority } from '../../types/kanban';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  badge?: React.ReactNode;
  description?: string;
}

export interface SelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click and Escape key
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

  const handleSelect = (optValue: T) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all group select-none text-left ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 text-slate-800 shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80 hover:border-slate-300'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption?.color && !selectedOption?.icon && (
            <span
              className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-600 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 left-0 w-full min-w-[160px] bg-white rounded-xl shadow-xl border border-slate-200/90 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 select-none ${menuClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center italic">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors group ${
                    isSelected
                      ? 'bg-indigo-50/70 text-indigo-950 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    {opt.color && !opt.icon && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.icon && (
                      <span className="shrink-0 flex items-center">
                        {opt.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Pre-defined Priority Options for Linear / Notion aesthetic
export const PRIORITY_OPTIONS: SelectOption<Priority>[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
  },
  {
    value: 'high',
    label: 'High',
    icon: <ArrowUp className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: <Minus className="w-3.5 h-3.5 text-yellow-500" />,
  },
  {
    value: 'low',
    label: 'Low',
    icon: <ArrowDown className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    value: 'none',
    label: 'None',
    icon: <Circle className="w-3.5 h-3.5 text-slate-400" />,
  },
];
