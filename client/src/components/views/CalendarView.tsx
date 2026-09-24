import React, { useState, useMemo } from 'react';
import { Board, Card, Priority } from '../../types/kanban';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
  Columns3,
  ListTodo,
  Inbox,
  X,
  Flag,
  ChevronDown,
} from 'lucide-react';

interface CalendarViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
  onUpdateCard?: (cardId: string, data: Partial<Card>) => void;
  onNewCard?: (defaultDate?: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';

interface CardWithMeta extends Card {
  columnColor: string;
  columnName: string;
  isDone: boolean;
}

// Priority color mappings
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  urgent: { label: 'Urgent', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50', dot: 'bg-rose-500' },
  high: { label: 'High', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50', dot: 'bg-amber-500' },
  medium: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50', dot: 'bg-blue-500' },
  low: { label: 'Low', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' },
  none: { label: 'None', color: 'text-slate-500 dark:text-slate-500', bg: 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800', dot: 'bg-slate-300' },
};

// Date utilities
const toDateKey = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSameDay = (d1: Date, d2: Date) => toDateKey(d1) === toDateKey(d2);
const isToday = (d: Date) => toDateKey(d) === toDateKey(new Date());

export const CalendarView: React.FC<CalendarViewProps> = ({
  board,
  onSelectCard,
  onUpdateCard,
  onNewCard,
}) => {
  // Navigation & View Mode
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumnId, setFilterColumnId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Side drawer & modals
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);

  // Drag and Drop State
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  // Process all cards with metadata
  const allCards = useMemo<CardWithMeta[]>(() => {
    return (board?.columns || []).flatMap((col) =>
      (col.cards || []).map((c) => {
        const isDone =
          col.name.toLowerCase().includes('done') ||
          col.name.toLowerCase().includes('hoàn thành') ||
          col.name.toLowerCase().includes('closed');
        return {
          ...c,
          columnColor: col.color || '#6366F1',
          columnName: col.name,
          isDone,
        };
      })
    );
  }, [board]);

  // Filtered cards based on search and filters
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(q);
        const matchesKey = card.issue_key?.toLowerCase().includes(q);
        const matchesAssignee = card.assignees?.some((a) =>
          a.full_name?.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesKey && !matchesAssignee) return false;
      }
      // Column Filter
      if (filterColumnId !== 'all' && card.column_id !== filterColumnId) {
        return false;
      }
      // Priority Filter
      if (filterPriority !== 'all' && card.priority !== filterPriority) {
        return false;
      }
      return true;
    });
  }, [allCards, searchQuery, filterColumnId, filterPriority]);

  // Group cards by date key
  const cardsByDate = useMemo(() => {
    const map = new Map<string, CardWithMeta[]>();
    for (const card of filteredCards) {
      if (card.due_date) {
        const key = toDateKey(card.due_date);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(card);
      }
    }
    return map;
  }, [filteredCards]);

  // Unscheduled cards (no due date)
  const unscheduledCards = useMemo(() => {
    return filteredCards.filter((c) => !c.due_date);
  }, [filteredCards]);

  // Summary Metrics
  const todayKey = toDateKey(new Date());
  const todayCards = cardsByDate.get(todayKey) || [];

  const metrics = useMemo(() => {
    let overdue = 0;
    let completed = 0;
    let scheduled = 0;

    for (const c of filteredCards) {
      if (c.due_date) {
        scheduled++;
        const cardKey = toDateKey(c.due_date);
        if (c.isDone) {
          completed++;
        } else if (cardKey < todayKey) {
          overdue++;
        }
      }
    }

    return { scheduled, overdue, completed, dueToday: todayCards.length };
  }, [filteredCards, todayCards, todayKey]);

  // Navigation actions
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 14);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 14);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDateKey !== dateKey) {
      setDragOverDateKey(dateKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverDateKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDateKey(null);
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId || !onUpdateCard) return;

    // Set noon local time to avoid timezone offset issue
    const updated = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0);
    onUpdateCard(cardId, { due_date: updated.toISOString() });
    setDraggedCardId(null);
  };

  // Quick schedule unscheduled card for today
  const handleScheduleForToday = (cardId: string) => {
    if (!onUpdateCard) return;
    const now = new Date();
    const updated = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    onUpdateCard(cardId, { due_date: updated.toISOString() });
  };

  // Month grid generator
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days in current month
    const totalDays = lastDay.getDate();

    // Monday-based index (0 = Monday, 6 = Sunday)
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    // Trailing days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Leading days of next month (fill up to 35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week days generator
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Days of week header strings
  const weekDayHeaders = [
    { label: 'Monday', short: 'Mon', vn: 'Thứ 2' },
    { label: 'Tuesday', short: 'Tue', vn: 'Thứ 3' },
    { label: 'Wednesday', short: 'Wed', vn: 'Thứ 4' },
    { label: 'Thursday', short: 'Thu', vn: 'Thứ 5' },
    { label: 'Friday', short: 'Fri', vn: 'Thứ 6' },
    { label: 'Saturday', short: 'Sat', vn: 'Thứ 7', isWeekend: true },
    { label: 'Sunday', short: 'Sun', vn: 'Chủ Nhật', isWeekend: true },
  ];

  // Header Title Formatter
  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })}`;
      }
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [currentDate, viewMode, weekDays]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-2 sm:p-5 relative">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 mb-3 sm:mb-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Navigation and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <CalIcon className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
                {headerTitle}
              </h1>
            </div>

            {/* Prev / Today / Next Buttons */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-xs">
              <button
                onClick={handlePrev}
                title="Previous"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Today
              </button>
              <button
                onClick={handleNext}
                title="Next"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Week</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>

          {/* Right: Actions, Filters, Unscheduled Toggle */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-32 sm:w-44 pl-8 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Column / Status Filter */}
            <select
              value={filterColumnId}
              onChange={(e) => setFilterColumnId(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Statuses</option>
              {board?.columns?.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>

            {/* Unscheduled Issues Drawer Button */}
            <button
              onClick={() => setShowUnscheduled(!showUnscheduled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showUnscheduled
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
              title="Show issues without due date"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Unscheduled</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                {unscheduledCards.length}
              </span>
            </button>

            {/* Add New Issue Button */}
            {onNewCard && (
              <button
                onClick={() => onNewCard(new Date().toISOString())}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Quick Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <CalIcon className="w-3 h-3 text-indigo-500" />
            <span>Scheduled: <strong className="text-slate-800 dark:text-slate-200">{metrics.scheduled}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Due Today: <strong className="font-bold">{metrics.dueToday}</strong></span>
          </div>

          {metrics.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-[11px] font-medium text-rose-700 dark:text-rose-400 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Overdue: <strong className="font-bold">{metrics.overdue}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Completed: <strong className="font-bold">{metrics.completed}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Container with Grid and Unscheduled Panel */}
      <div className="flex-1 flex overflow-hidden gap-4">
        {/* Active View Display */}
        <div className="flex-1 bg-white dark:bg-[#0D1424] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col min-w-[650px] overflow-x-auto">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-semibold py-2.5 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
                {weekDayHeaders.map((head, idx) => (
                  <div
                    key={head.label}
                    className={`flex items-center justify-center gap-1 ${
                      head.isWeekend
                        ? 'text-slate-400 dark:text-slate-500 font-normal'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{head.short}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      ({head.vn})
                    </span>
                  </div>
                ))}
              </div>

              {/* Month Cells Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/70 overflow-y-auto">
                {monthGridDays.map(({ date, isCurrentMonth }) => {
                  const dateKey = toDateKey(date);
                  const isCurrentDay = isToday(date);
                  const isDragTarget = dragOverDateKey === dateKey;
                  const dayCards = cardsByDate.get(dateKey) || [];
                  const visibleCards = dayCards.slice(0, 3);
                  const overflowCount = dayCards.length - visibleCards.length;

                  return (
                    <div
                      key={dateKey}
                      onDragOver={(e) => handleDragOver(e, dateKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, date)}
                      className={`p-1.5 min-h-[90px] flex flex-col gap-1 transition-all group relative ${
                        !isCurrentMonth
                          ? 'bg-slate-50/40 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600'
                          : isCurrentDay
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                      } ${
                        isDragTarget
                          ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-500/10 dark:bg-indigo-500/20'
                          : ''
                      }`}
                    >
                      {/* Cell Header: Day Number and + Button */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-semibold flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                            isCurrentDay
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : isCurrentMonth
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {date.getDate()}
                        </span>

                        {/* Hover Quick Add Button */}
                        {onNewCard && (
                          <button
                            onClick={() => onNewCard(date.toISOString())}
                            title={`Add issue on ${dateKey}`}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Card Chips List */}
                      <div className="flex-1 space-y-1 overflow-y-auto">
                        {visibleCards.map((card) => {
                          const priorityInfo = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.none;
                          const isOverdue = !card.isDone && dateKey < todayKey;

                          return (
                            <div
                              key={card.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, card.id)}
                              onClick={() => onSelectCard(card)}
                              className={`text-[10px] p-1.5 rounded-lg border font-medium cursor-pointer shadow-xs hover:shadow-sm hover:brightness-105 active:scale-98 transition-all flex flex-col gap-0.5 select-none ${
                                card.isDone
                                  ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through'
                                  : isOverdue
                                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-200'
                                  : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: card.columnColor }}
                                  />
                                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 shrink-0">
                                    {card.issue_key}
                                  </span>
                                </div>

                                {card.priority !== 'none' && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityInfo.dot}`}
                                    title={`Priority: ${card.priority}`}
                                  />
                                )}
                              </div>

                              <div className="truncate font-semibold text-[10.5px]">
                                {card.title}
                              </div>
                            </div>
                          );
                        })}

                        {/* Overflow "+X more" Pill */}
                        {overflowCount > 0 && (
                          <button
                            onClick={() => setModalDate(date)}
                            className="w-full py-0.5 text-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors border border-indigo-200/60 dark:border-indigo-900/50"
                          >
                            +{overflowCount} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="flex-1 flex flex-col min-w-[700px] overflow-x-auto">
              {/* Week Columns Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 text-xs shrink-0 divide-x divide-slate-200/70 dark:divide-slate-800">
                {weekDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const isCurrent = isToday(date);
                  const count = (cardsByDate.get(dateKey) || []).length;

                  return (
                    <div
                      key={dateKey}
                      className={`p-3 text-center flex flex-col items-center gap-1 ${
                        isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Week Columns Body */}
              <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800/80 overflow-y-auto">
                {weekDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const isCurrent = isToday(date);
                  const dayCards = cardsByDate.get(dateKey) || [];
                  const isDragTarget = dragOverDateKey === dateKey;

                  return (
                    <div
                      key={dateKey}
                      onDragOver={(e) => handleDragOver(e, dateKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, date)}
                      className={`p-2 flex flex-col gap-2 transition-all group ${
                        isCurrent ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                      } ${
                        isDragTarget
                          ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-500/10 dark:bg-indigo-500/20'
                          : ''
                      }`}
                    >
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {dayCards.length === 0 ? (
                          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 text-xs">
                            <span>No issues</span>
                          </div>
                        ) : (
                          dayCards.map((card) => {
                            const priorityInfo = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.none;
                            const isOverdue = !card.isDone && dateKey < todayKey;

                            return (
                              <div
                                key={card.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, card.id)}
                                onClick={() => onSelectCard(card)}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col gap-1.5 ${
                                  card.isDone
                                    ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-400'
                                    : isOverdue
                                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white truncate max-w-[120px]"
                                    style={{ backgroundColor: card.columnColor }}
                                  >
                                    {card.columnName}
                                  </span>
                                  {card.priority !== 'none' && (
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${priorityInfo.bg} ${priorityInfo.color}`}
                                    >
                                      <Flag className="w-2.5 h-2.5" />
                                      {priorityInfo.label}
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`font-semibold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 ${
                                    card.isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                  }`}
                                >
                                  {card.title}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                  <span className="font-mono">{card.issue_key}</span>
                                  {card.assignees && card.assignees.length > 0 && (
                                    <div className="flex items-center -space-x-1.5">
                                      {card.assignees.slice(0, 3).map((a) => (
                                        <img
                                          key={a.id}
                                          src={a.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.id}`}
                                          alt={a.full_name}
                                          className="w-4 h-4 rounded-full border border-white dark:border-slate-800"
                                          title={a.full_name}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {onNewCard && (
                        <button
                          onClick={() => onNewCard(date.toISOString())}
                          className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {filteredCards.filter((c) => c.due_date).length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <CalIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold">No scheduled issues found.</p>
                  <p className="text-xs text-slate-400 mt-1">Set due dates on your issues to see them here.</p>
                </div>
              ) : (
                (() => {
                  // Group cards into chronological buckets
                  const overdueList: CardWithMeta[] = [];
                  const todayList: CardWithMeta[] = [];
                  const tomorrowList: CardWithMeta[] = [];
                  const thisWeekList: CardWithMeta[] = [];
                  const upcomingList: CardWithMeta[] = [];
                  const completedList: CardWithMeta[] = [];

                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowKey = toDateKey(tomorrow);

                  const endOfWeek = new Date();
                  endOfWeek.setDate(endOfWeek.getDate() + 7);
                  const endOfWeekKey = toDateKey(endOfWeek);

                  for (const c of filteredCards) {
                    if (!c.due_date) continue;
                    const cKey = toDateKey(c.due_date);

                    if (c.isDone) {
                      completedList.push(c);
                    } else if (cKey < todayKey) {
                      overdueList.push(c);
                    } else if (cKey === todayKey) {
                      todayList.push(c);
                    } else if (cKey === tomorrowKey) {
                      tomorrowList.push(c);
                    } else if (cKey <= endOfWeekKey) {
                      thisWeekList.push(c);
                    } else {
                      upcomingList.push(c);
                    }
                  }

                  const sections = [
                    { title: 'Overdue', icon: AlertTriangle, list: overdueList, color: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' },
                    { title: 'Today', icon: Clock, list: todayList, color: 'text-indigo-600 dark:text-indigo-400', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50' },
                    { title: 'Tomorrow', icon: CalIcon, list: tomorrowList, color: 'text-sky-600 dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50' },
                    { title: 'This Week', icon: CalendarDays, list: thisWeekList, color: 'text-slate-700 dark:text-slate-300', badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
                    { title: 'Upcoming', icon: CalendarDays, list: upcomingList, color: 'text-slate-600 dark:text-slate-400', badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
                    { title: 'Completed', icon: CheckCircle2, list: completedList, color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' },
                  ];

                  return sections.map((sec) => {
                    if (sec.list.length === 0) return null;
                    const IconComponent = sec.icon;

                    return (
                      <div key={sec.title} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${sec.color}`} />
                          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            {sec.title}
                          </h2>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${sec.badgeBg} ${sec.color}`}>
                            {sec.list.length}
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
                          {sec.list.map((card) => {
                            const priorityInfo = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.none;
                            const cardDate = new Date(card.due_date!);

                            return (
                              <div
                                key={card.id}
                                onClick={() => onSelectCard(card)}
                                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: card.columnColor }}
                                  />
                                  <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                                    {card.issue_key}
                                  </span>
                                  <span
                                    className={`text-xs font-semibold text-slate-800 dark:text-slate-100 truncate ${
                                      card.isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                    }`}
                                  >
                                    {card.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span
                                    className="text-[11px] px-2 py-0.5 rounded-md font-semibold text-white"
                                    style={{ backgroundColor: card.columnColor }}
                                  >
                                    {card.columnName}
                                  </span>

                                  {card.priority !== 'none' && (
                                    <span
                                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${priorityInfo.bg} ${priorityInfo.color}`}
                                    >
                                      <Flag className="w-3 h-3" />
                                      {priorityInfo.label}
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <CalIcon className="w-3.5 h-3.5" />
                                    <span>
                                      {cardDate.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}
        </div>

        {/* Unscheduled Issues Drawer / Sidebar */}
        {showUnscheduled && (
          <div className="w-72 sm:w-80 bg-white dark:bg-[#0D1424] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right-4 duration-200">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Unscheduled Issues
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  {unscheduledCards.length}
                </span>
              </div>
              <button
                onClick={() => setShowUnscheduled(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 text-[11px] text-slate-500 dark:text-slate-400 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100/60 dark:border-indigo-900/40 px-3">
              💡 <em>Tip: Drag and drop any issue directly onto the calendar to schedule it!</em>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {unscheduledCards.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  🎉 All issues have been scheduled!
                </div>
              ) : (
                unscheduledCards.map((card) => {
                  const priorityInfo = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.none;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => onSelectCard(card)}
                      className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 cursor-grab active:cursor-grabbing transition-all flex flex-col gap-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold text-white truncate max-w-[120px]"
                          style={{ backgroundColor: card.columnColor }}
                        >
                          {card.columnName}
                        </span>
                        {card.priority !== 'none' && (
                          <span
                            className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded-md border flex items-center gap-1 ${priorityInfo.bg} ${priorityInfo.color}`}
                          >
                            <Flag className="w-2 h-2" />
                            {priorityInfo.label}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 line-clamp-2">
                        {card.title}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                        <span className="font-mono text-slate-400 dark:text-slate-500">
                          {card.issue_key}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleForToday(card.id);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          Schedule Today
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Day Modal for Overflow / Multi-issue detail (+X more clicked) */}
      {modalDate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalDate(null)}
        >
          <div
            className="bg-white dark:bg-[#0D1424] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CalIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {modalDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(cardsByDate.get(toDateKey(modalDate)) || []).length} scheduled issues
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {(cardsByDate.get(toDateKey(modalDate)) || []).map((card) => {
                const priorityInfo = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.none;

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setModalDate(null);
                      onSelectCard(card);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer shadow-xs transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                        style={{ backgroundColor: card.columnColor }}
                      >
                        {card.columnName}
                      </span>
                      {card.priority !== 'none' && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${priorityInfo.bg} ${priorityInfo.color}`}
                        >
                          <Flag className="w-2.5 h-2.5" />
                          {priorityInfo.label}
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-xs font-semibold text-slate-800 dark:text-slate-100 ${
                        card.isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {card.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="font-mono">{card.issue_key}</span>
                      {card.assignees && card.assignees.length > 0 && (
                        <span>{card.assignees.map((a) => a.full_name).join(', ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {onNewCard && (
              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    const d = modalDate.toISOString();
                    setModalDate(null);
                    onNewCard(d);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Issue on this Date</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
