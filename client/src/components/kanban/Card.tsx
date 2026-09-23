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

const priorityColors: Record<Priority, { bg: string; text: string; dot: string }> = {
  urgent: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  none: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300' },
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
    density === 'compact' ? 'p-2.5' : density === 'comfortable' ? 'p-3.5' : 'p-4';

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect(card)}
          className={`bg-white rounded-xl border border-slate-200/90 shadow-card hover:shadow-card-hover active:scale-[0.99] active:ring-2 active:ring-indigo-400/40 transition-all duration-150 cursor-pointer group mb-2.5 select-none relative overflow-hidden touch-manipulation ${
            snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 rotate-1 scale-[1.03] z-50' : ''
          }`}
        >
          {/* Card Cover */}
          {card.cover_image_url && density !== 'compact' && (
            <div className="relative w-full max-h-48 min-h-[130px] overflow-hidden bg-slate-900/5 border-b border-slate-100 flex items-center justify-center">
              {/* Ambient blur for background */}
              <img
                src={card.cover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110 pointer-events-none"
              />
              {/* Crisp uncropped image */}
              <img
                src={card.cover_image_url}
                alt={card.title}
                className="relative max-h-48 w-auto max-w-full object-contain z-10 py-1 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className={densityPadding}>
            {/* Top row: Priority & Issue Key & Quick Move Buttons */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${pStyle.dot}`} />
                <span className="text-[11px] font-semibold text-slate-500 font-mono tracking-tight truncate">
                  {card.issue_key}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Quick Move for mobile or fast desktop navigation */}
                {(prevColumnId || nextColumnId) && (
                  <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/60 shadow-2xs">
                    {prevColumnId && (
                      <button
                        type="button"
                        title={`Move left to ${prevColumnName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickMoveCard?.(card.id, prevColumnId);
                        }}
                        className="p-0.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
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
                        className="p-0.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {card.priority !== 'none' && density !== 'compact' && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${pStyle.bg} ${pStyle.text}`}
                  >
                    {card.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
              {card.title}
            </h3>

            {/* Labels */}
            {card.labels && card.labels.length > 0 && density !== 'compact' && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {card.labels.map((label) => (
                  <span
                    key={label.id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${label.color}15`,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Meta info: Checklist, Comments, Due Date & Assignees */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-slate-400 text-[11px]">
              <div className="flex items-center gap-3">
                {totalChecklist > 0 && (
                  <div
                    className={`flex items-center gap-1 ${
                      doneChecklist === totalChecklist ? 'text-emerald-600 font-medium' : ''
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {doneChecklist}/{totalChecklist}
                    </span>
                  </div>
                )}

                {card.comments && card.comments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{card.comments.length}</span>
                  </div>
                )}

                {card.due_date && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
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
                    className="w-5 h-5 rounded-full ring-2 ring-white object-cover"
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
