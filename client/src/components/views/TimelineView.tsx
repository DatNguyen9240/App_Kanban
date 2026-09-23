import React from 'react';
import { Board, Card } from '../../types/kanban';
import { BarChart2 } from 'lucide-react';

interface TimelineViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ board, onSelectCard }) => {
  const allCards = (board?.columns || []).flatMap((col) =>
    (col.cards || []).map((c) => ({ ...c, columnColor: col.color, columnName: col.name }))
  );

  const timelineDays = ['Sep 20', 'Sep 21', 'Sep 22', 'Sep 23 (Today)', 'Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <BarChart2 className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-bold text-slate-800">Sprint Timeline & Dependencies</h2>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-x-auto overflow-y-hidden flex flex-col">
        <div className="min-w-[760px] flex-1 flex flex-col">
          {/* Header timeline */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 py-3 shrink-0">
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
            {allCards.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No issues available to display in timeline. Create cards to view Gantt progress.
              </div>
            ) : (
              allCards.map((card, idx) => {
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

                    {/* Gantt Bar Area */}
                    <div className="flex-1 grid grid-cols-9 items-center px-1 relative h-6">
                      <div
                        className="h-5 rounded-md shadow-xs flex items-center px-2 text-[10px] font-semibold text-white truncate transition-all group hover:brightness-105"
                        style={{
                          gridColumnStart: startCol + 1,
                          gridColumnEnd: `span ${spanCols}`,
                          backgroundColor: card.columnColor,
                        }}
                      >
                        <span className="truncate">{card.columnName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
