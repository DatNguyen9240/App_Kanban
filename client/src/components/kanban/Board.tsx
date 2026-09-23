import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
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
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-5 h-full">
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
          <div className="w-80 shrink-0">
            {isAddingCol ? (
              <form
                onSubmit={handleCreateColumn}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Column name (e.g. QA)"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none mb-2.5 px-2 py-1.5 border border-slate-200 rounded"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCol(false);
                      setColName('');
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded shadow-xs"
                  >
                    Add Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-200/40 hover:bg-slate-200/80 rounded-xl border border-dashed border-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
