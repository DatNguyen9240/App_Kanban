import React from 'react';
import { Board, Card } from '../../types/kanban';
import { BarChart2 } from 'lucide-react';

interface TimelineViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ board, onSelectCard }) => {
  const allCards = board.columns.flatMap((col) =>
    col.cards.map((c) => ({ ...c, columnColor: col.color, columnName: col.name }))
  );

  const timelineDays = ['Sep 20', 'Sep 21', 'Sep 22', 'Sep 23 (Today)', 'Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-bold text-slate-800">Sprint Timeline & Dependencies</h2>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Header timeline */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 py-3">
          <div className="w-72 px-4 shrink-0">Issue</div>
          <div className="flex-1 grid grid-cols-9 text-center text-[11px]">
            {timelineDays.map((d) => (
              <div key={d} className="truncate px-1 border-l border-slate-200/60 first:border-l-0">
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {allCards.map((card, idx) => {
            // Calculate a mock bar offset & width for realistic Gantt appearance
            const startCol = (idx * 2) % 6;
            const spanCols = Math.min(3 + (idx % 3), 9 - startCol);

            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card)}
                className="flex items-center hover:bg-slate-50/60 cursor-pointer transition-colors py-3"
              >
                {/* Left task info */}
                <div className="w-72 px-4 shrink-0 flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: card.columnColor }}
                  />
                  <span className="font-mono text-xs font-semibold text-slate-500 shrink-0">
                    {card.issue_key}
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {card.title}
                  </span>
                </div>

                {/* Right Gantt bar */}
                <div className="flex-1 grid grid-cols-9 relative items-center h-8 px-1">
                  <div
                    className="h-6 rounded-lg shadow-xs flex items-center px-2.5 text-[10px] text-white font-medium truncate transition-transform hover:scale-[1.01]"
                    style={{
                      gridColumnStart: startCol + 1,
                      gridColumnEnd: `span ${spanCols}`,
                      backgroundColor: card.columnColor || '#6366F1',
                    }}
                  >
                    <span className="truncate">{card.columnName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
