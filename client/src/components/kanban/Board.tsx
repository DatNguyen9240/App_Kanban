import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Board as BoardType, Card as CardType, CardDensity } from '../../types/kanban';
import { Column } from './Column';

interface BoardProps {
  board: BoardType;
  density: CardDensity;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    prevCardId?: string,
    nextCardId?: string
  ) => void;
  onSelectCard: (card: CardType) => void;
  onQuickAddCard: (columnId: string, title: string) => void;
  onAddColumn: (name: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, name: string) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  density,
  onMoveCard,
  onSelectCard,
  onQuickAddCard,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn,
}) => {
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [colName, setColName] = useState('');
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Edge auto-scrolling state & refs
  const isDraggingRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);

  const stopAutoScroll = useCallback(() => {
    isDraggingRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    const loop = () => {
      if (!isDraggingRef.current) return;

      const container = boardContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const { x: mouseX, y: mouseY } = mousePosRef.current;

        // --- 1. HORIZONTAL AUTO-SCROLL (Board canvas edges) ---
        const isMobile = window.innerWidth < 640;
        const hThreshold = isMobile ? 110 : 160; // Generous trigger zone near screen/canvas edges
        const maxHSpeed = isMobile ? 24 : 30;    // Max scroll speed px/frame

        // Near or past Left edge
        if (mouseX <= rect.left + hThreshold) {
          const ratio = Math.max(0.2, Math.min(1, (rect.left + hThreshold - mouseX) / hThreshold));
          const speed = Math.round(ratio * (maxHSpeed - 6) + 6);
          container.scrollLeft -= speed;
        }
        // Near or past Right edge
        else if (mouseX >= rect.right - hThreshold) {
          const ratio = Math.max(0.2, Math.min(1, (mouseX - (rect.right - hThreshold)) / hThreshold));
          const speed = Math.round(ratio * (maxHSpeed - 6) + 6);
          container.scrollLeft += speed;
        }

        // --- 2. VERTICAL AUTO-SCROLL (Inside individual columns) ---
        if (typeof document.elementsFromPoint === 'function') {
          const elementsUnderCursor = document.elementsFromPoint(mouseX, mouseY);
          for (const el of elementsUnderCursor) {
            if (
              el instanceof HTMLElement &&
              el.scrollHeight > el.clientHeight &&
              el.classList.contains('overflow-y-auto')
            ) {
              const colRect = el.getBoundingClientRect();
              const vThreshold = isMobile ? 70 : 100;
              const maxVSpeed = 22;

              if (mouseY <= colRect.top + vThreshold) {
                const ratio = Math.max(0.2, Math.min(1, (colRect.top + vThreshold - mouseY) / vThreshold));
                const speed = Math.round(ratio * (maxVSpeed - 4) + 4);
                el.scrollTop -= speed;
              } else if (mouseY >= colRect.bottom - vThreshold) {
                const ratio = Math.max(0.2, Math.min(1, (mouseY - (colRect.bottom - vThreshold)) / vThreshold));
                const speed = Math.round(ratio * (maxVSpeed - 4) + 4);
                el.scrollTop += speed;
              }
              break;
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (!animFrameIdRef.current) {
      animFrameIdRef.current = requestAnimationFrame(loop);
    }
  }, []);

  // Track global pointer position (mouse + touch) in capture phase so nothing blocks it
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if ('clientX' in e) {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerEnd = () => {
      if (isDraggingRef.current) {
        stopAutoScroll();
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('touchmove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('touchstart', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('mouseup', handlePointerEnd, { capture: true, passive: true });
    window.addEventListener('touchend', handlePointerEnd, { capture: true, passive: true });
    window.addEventListener('touchcancel', handlePointerEnd, { capture: true, passive: true });

    return () => {
      stopAutoScroll();
      window.removeEventListener('mousemove', handlePointerMove, { capture: true });
      window.removeEventListener('touchmove', handlePointerMove, { capture: true });
      window.removeEventListener('touchstart', handlePointerMove, { capture: true });
      window.removeEventListener('mouseup', handlePointerEnd, { capture: true });
      window.removeEventListener('touchend', handlePointerEnd, { capture: true });
      window.removeEventListener('touchcancel', handlePointerEnd, { capture: true });
    };
  }, [stopAutoScroll]);

  // Horizontal scrolling with mouse wheel over canvas
  useEffect(() => {
    const container = boardContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const target = e.target as HTMLElement | null;
      const scrollableCol = target?.closest('.overflow-y-auto');
      if (scrollableCol && scrollableCol.scrollHeight > scrollableCol.clientHeight && !e.shiftKey) {
        return; // Allow column vertical scroll
      }

      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollBoard = (direction: 'left' | 'right') => {
    if (boardContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      boardContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    startAutoScroll();
  };

  const handleDragEnd = (result: DropResult) => {
    stopAutoScroll();
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const targetColumn = board.columns.find((c) => c.id === destination.droppableId);
    if (!targetColumn) return;

    // Filter cards in destination column (excluding the dragged card if same column)
    const targetCards = (targetColumn.cards || []).filter((c) => c.id !== draggableId);

    let prevCardId: string | undefined;
    let nextCardId: string | undefined;

    if (destination.index > 0) {
      prevCardId = targetCards[destination.index - 1]?.id;
    }
    if (destination.index < targetCards.length) {
      nextCardId = targetCards[destination.index]?.id;
    }

    onMoveCard(draggableId, destination.droppableId, prevCardId, nextCardId);
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;
    onAddColumn(colName.trim());
    setColName('');
    setIsAddingCol(false);
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Mobile Column Navigation Pills */}
      <div className="flex sm:hidden items-center gap-1.5 px-3 py-2 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 overflow-x-auto shrink-0 select-none">
        {board.columns.map((col) => (
          <button
            key={col.id}
            type="button"
            onClick={() => {
              if (boardContainerRef.current) {
                const colEl = boardContainerRef.current.querySelector(`[data-column-id="${col.id}"]`);
                colEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color || '#94a3b8' }} />
            <span>{col.name}</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded-full font-mono">
              {col.cards?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Scrollable Columns Area */}
      <div
        ref={boardContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-6 select-none"
      >
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex items-stretch gap-3 sm:gap-4 h-full pb-2">
            {board.columns.map((column, colIdx) => {
              const prevCol = colIdx > 0 ? board.columns[colIdx - 1] : undefined;
              const nextCol = colIdx < board.columns.length - 1 ? board.columns[colIdx + 1] : undefined;

              return (
                <Column
                  key={column.id}
                  column={column}
                  density={density}
                  onSelectCard={onSelectCard}
                  onQuickAddCard={onQuickAddCard}
                  onDeleteColumn={onDeleteColumn}
                  onUpdateColumn={onUpdateColumn}
                  onQuickMoveCard={(cardId, targetColId) => onMoveCard(cardId, targetColId)}
                  prevColumnId={prevCol?.id}
                  prevColumnName={prevCol?.name}
                  nextColumnId={nextCol?.id}
                  nextColumnName={nextCol?.name}
                />
              );
            })}

            {/* Add Column button */}
            <div className="w-72 shrink-0">
              {isAddingCol ? (
                <form
                  onSubmit={handleCreateColumn}
                  className="bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-md animate-in zoom-in-95 duration-100"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Column name (e.g. QA)"
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsAddingCol(false);
                        setColName('');
                      }
                    }}
                    className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none mb-2.5 px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCol(false);
                        setColName('');
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                    >
                      Add Column
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCol(true)}
                  className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-slate-100/70 hover:bg-indigo-50/50 rounded-2xl border border-dashed border-slate-300/80 hover:border-indigo-300 transition-all shadow-2xs group"
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  <span>Add Column</span>
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Horizontal Scroll Quick Controls */}
      <div className="absolute bottom-5 right-6 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md rounded-xl p-1 z-20 transition-all hover:shadow-lg">
        <button
          type="button"
          onClick={() => scrollBoard('left')}
          title="Scroll Left"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-semibold text-slate-400 px-1 select-none">Columns</span>
        <button
          type="button"
          onClick={() => scrollBoard('right')}
          title="Scroll Right"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
