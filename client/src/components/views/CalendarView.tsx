import React from 'react';
import { Board, Card } from '../../types/kanban';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

interface CalendarViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ board, onSelectCard }) => {
  const allCards = board.columns.flatMap((col) =>
    col.cards.map((c) => ({ ...c, columnColor: col.color, columnName: col.name }))
  );

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Current month days mock grid (1 to 30)
  const currentMonth = 'September 2026';
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getCardsForDay = (day: number) => {
    return allCards.filter((c) => {
      if (!c.due_date) return false;
      const d = new Date(c.due_date);
      return d.getDate() === day;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">{currentMonth}</h2>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
          <button className="p-1 hover:bg-slate-100 rounded text-slate-600">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded text-slate-600">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500 py-2.5 bg-slate-50/80">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days cells */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 overflow-y-auto">
          {daysInMonth.map((day) => {
            const cards = getCardsForDay(day);
            const isToday = day === 23; // current mock date
            return (
              <div
                key={day}
                className={`p-2 min-h-[90px] flex flex-col transition-colors ${
                  isToday ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]'
                        : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>
                  {cards.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cards.length}
                    </span>
                  )}
                </div>

                {/* Cards scheduled for this day */}
                <div className="space-y-1 overflow-y-auto flex-1">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      className="p-1.5 bg-white rounded-md border border-slate-200 shadow-xs hover:shadow-sm cursor-pointer transition-all hover:border-indigo-300 text-[10px]"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: card.columnColor }}
                        />
                        <span className="font-mono font-bold text-slate-500">{card.issue_key}</span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{card.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
