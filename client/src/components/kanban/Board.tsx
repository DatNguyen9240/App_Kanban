import React, { useState, useRef } from 'react';
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

  const scrollBoard = (direction: 'left' | 'right') => {
    if (boardContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      boardContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDragEnd = (result: DropResult) => {
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
    const targetCards = targetColumn.cards.filter((c) => c.id !== draggableId);

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
      {/* Scrollable Columns Area */}
      <div
        ref={boardContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-6"
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex items-start gap-4 h-full">
            {board.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                density={density}
                onSelectCard={onSelectCard}
                onQuickAddCard={onQuickAddCard}
                onDeleteColumn={onDeleteColumn}
                onUpdateColumn={onUpdateColumn}
              />
            ))}

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
