import React from 'react';
import { Board, Card } from '../../types/kanban';
import { Calendar } from 'lucide-react';

interface ListViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
}

export const ListView: React.FC<ListViewProps> = ({ board, onSelectCard }) => {
  const allCards = board.columns.flatMap((col) =>
    col.cards.map((c) => ({ ...c, columnName: col.name, columnColor: col.color }))
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Key</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allCards.map((card) => (
              <tr
                key={card.id}
                onClick={() => onSelectCard(card)}
                className="hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                  {card.issue_key}
                </td>
                <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                  {card.title}
                </td>
                <td className="py-3 px-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: `${card.columnColor}15`,
                      color: card.columnColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: card.columnColor }}
                    />
                    {card.columnName}
                  </span>
                </td>
                <td className="py-3 px-4 capitalize text-slate-600">
                  {card.priority}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {card.assignees?.map((u) => (
                      <img
                        key={u.id}
                        src={u.avatar_url}
                        alt={u.full_name}
                        title={u.full_name}
                        className="w-5 h-5 rounded-full border border-slate-200"
                      />
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {card.due_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(card.due_date).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
