import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 160 });

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 160);
    const margin = 8;
    const menuEstimatedHeight = 220;

    // Close if trigger is scrolled out of viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - menuWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width: menuWidth,
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: menuWidth,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
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
    <div
      className={`relative inline-block w-full ${className} ${isOpen ? 'z-40' : ''}`}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all group select-none text-left ${
          disabled
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-800 dark:text-slate-100 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
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
          <span className={`truncate ${selectedOption ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu portaled outside to document.body */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              ...(coords.top !== undefined
                ? { top: `${coords.top}px` }
                : { bottom: `${coords.bottom}px` }),
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className={`bg-white dark:bg-[#0F172A] rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 select-none text-slate-800 dark:text-slate-100 ${menuClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center italic">
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
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
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
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
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
