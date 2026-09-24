import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  Clock,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card as CardType, CardDensity, Priority } from '../../types/kanban';

interface CardProps {
  card: CardType;
  index: number;
  density: CardDensity;
  onSelect: (card: CardType) => void;
  onQuickMoveCard?: (cardId: string, targetColumnId: string) => void;
  prevColumnId?: string;
  prevColumnName?: string;
  nextColumnId?: string;
  nextColumnName?: string;
}

const priorityColors: Record<Priority, { bg: string; text: string; dot: string; darkBg: string; darkText: string }> = {
  urgent: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', darkBg: 'dark:bg-rose-950/60', darkText: 'dark:text-rose-400' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', darkBg: 'dark:bg-amber-950/60', darkText: 'dark:text-amber-400' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', darkBg: 'dark:bg-yellow-950/60', darkText: 'dark:text-yellow-400' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', darkBg: 'dark:bg-blue-950/60', darkText: 'dark:text-blue-400' },
  none: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', darkBg: 'dark:bg-slate-800/60', darkText: 'dark:text-slate-400' },
};

export const Card: React.FC<CardProps> = ({
  card,
  index,
  density,
  onSelect,
  onQuickMoveCard,
  prevColumnId,
  prevColumnName,
  nextColumnId,
  nextColumnName,
}) => {
  const pStyle = priorityColors[card.priority] || priorityColors.none;

  // Calculate checklist progress
  const totalChecklist = card.checklists?.reduce((acc, cl) => acc + (cl.items?.length || 0), 0) || 0;
  const doneChecklist = card.checklists?.reduce(
    (acc, cl) => acc + (cl.items?.filter((it) => it.is_done)?.length || 0),
    0
  ) || 0;

  const densityPadding =
    density === 'compact' ? 'p-2' : density === 'comfortable' ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4';

  const densityMargin =
    density === 'compact' ? 'mb-1.5' : density === 'comfortable' ? 'mb-2' : 'mb-2.5';

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect(card)}
          className={`bg-white dark:bg-[#162032] rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-card hover:shadow-card-hover dark:hover:border-slate-700 dark:hover:bg-[#1C283E] active:scale-[0.99] active:ring-2 active:ring-indigo-400/40 transition-all duration-150 cursor-pointer group select-none relative overflow-hidden touch-manipulation ${densityMargin} ${
            snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 rotate-1 scale-[1.03] z-50' : ''
          }`}
        >
          {/* Card Cover */}
          {card.cover_image_url && (
            <div
              className={`relative w-full ${
                density === 'compact' ? 'h-14' : 'max-h-44 min-h-[110px]'
              } overflow-hidden bg-slate-900/5 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center`}
            >
              <img
                src={card.cover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110 pointer-events-none"
              />
              <img
                src={card.cover_image_url}
                alt={card.title}
                className={`relative ${
                  density === 'compact' ? 'h-14' : 'max-h-44'
                } w-auto max-w-full object-contain z-10 py-0.5 transition-transform duration-300 group-hover:scale-105`}
              />
            </div>
          )}

          <div className={densityPadding}>
            {/* Top row: Priority & Issue Key & Quick Move Buttons */}
            <div className={`flex items-center justify-between gap-1 ${density === 'compact' ? 'mb-1' : 'mb-2'}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`${density === 'compact' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full shrink-0 ${pStyle.dot}`} />
                <span className={`${density === 'compact' ? 'text-[10px]' : 'text-[11px]'} font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-tight truncate`}>
                  {card.issue_key}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Quick Move for mobile or fast desktop navigation */}
                {(prevColumnId || nextColumnId) && (
                  <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/80 shadow-2xs">
                    {prevColumnId && (
                      <button
                        type="button"
                        title={`Move left to ${prevColumnName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickMoveCard?.(card.id, prevColumnId);
                        }}
                        className="p-0.5 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                      >
                        <ChevronLeft className={density === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                    )}
                    {nextColumnId && (
                      <button
                        type="button"
                        title={`Move right to ${nextColumnName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickMoveCard?.(card.id, nextColumnId);
                        }}
                        className="p-0.5 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                      >
                        <ChevronRight className={density === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                    )}
                  </div>
                )}

                {card.priority !== 'none' && (
                  <span
                    className={`${
                      density === 'compact' ? 'text-[9px] px-1 py-0.2' : 'text-[10px] px-1.5 py-0.5'
                    } font-medium rounded uppercase tracking-wider ${pStyle.bg} ${pStyle.text} ${pStyle.darkBg} ${pStyle.darkText}`}
                  >
                    {card.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3
              className={`${
                density === 'compact' ? 'text-[11px] leading-snug line-clamp-2 font-medium' : 'text-xs leading-snug line-clamp-2 font-semibold'
              } text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}
            >
              {card.title}
            </h3>

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className={`flex flex-wrap gap-1 ${density === 'compact' ? 'mt-1.5' : 'mt-2'}`}>
                {card.labels.map((label) => (
                  <span
                    key={label.id}
                    className={`${
                      density === 'compact' ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                    } font-medium rounded-full`}
                    style={{
                      backgroundColor: `${label.color}18`,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Meta info: Checklist, Comments, Due Date & Assignees */}
            <div
              className={`flex items-center justify-between ${
                density === 'compact' ? 'mt-1.5 pt-1.5 text-[10px]' : 'mt-2.5 pt-2 text-[11px]'
              } border-t border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400`}
            >
              <div className="flex items-center gap-2">
                {totalChecklist > 0 && (
                  <div
                    className={`flex items-center gap-1 ${
                      doneChecklist === totalChecklist ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                    }`}
                  >
                    <CheckSquare className={density === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                    <span>
                      {doneChecklist}/{totalChecklist}
                    </span>
                  </div>
                )}

                {card.comments && card.comments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className={density === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                    <span>{card.comments.length}</span>
                  </div>
                )}

                {card.due_date && (
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Calendar className={density === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                    <span>{new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Assignees avatars */}
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {card.assignees?.map((u) => (
                  <img
                    key={u.id}
                    src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`}
                    alt={u.full_name}
                    title={u.full_name}
                    className={`${
                      density === 'compact' ? 'w-4 h-4' : 'w-5 h-5'
                    } rounded-full ring-2 ring-white dark:ring-[#162032] object-cover`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
