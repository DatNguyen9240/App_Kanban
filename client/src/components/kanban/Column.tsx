import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Card as CardType, CardDensity, Column as ColumnType } from '../../types/kanban';
import { Card } from './Card';
import { ConfirmModal } from '../common/ConfirmModal';

interface ColumnProps {
  column: ColumnType;
  density: CardDensity;
  onSelectCard: (card: CardType) => void;
  onQuickAddCard: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, name: string) => void;
  onQuickMoveCard?: (cardId: string, targetColumnId: string) => void;
  prevColumnId?: string;
  prevColumnName?: string;
  nextColumnId?: string;
  nextColumnName?: string;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  density,
  onSelectCard,
  onQuickAddCard,
  onDeleteColumn,
  onUpdateColumn,
  onQuickMoveCard,
  prevColumnId,
  prevColumnName,
  nextColumnId,
  nextColumnName,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [colName, setColName] = useState(column.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        e.stopImmediatePropagation();
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showMenu]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddCard(column.id, quickTitle.trim());
    setQuickTitle('');
    setIsAdding(false);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (colName.trim() && colName !== column.name) {
      onUpdateColumn(column.id, colName.trim());
    }
    setIsEditingName(false);
  };

  // Dynamic styling based on density
  const colWidthClass =
    density === 'compact'
      ? 'w-[70vw] sm:w-56'
      : density === 'comfortable'
      ? 'w-[78vw] sm:w-64'
      : 'w-[85vw] sm:w-72';

  const colPaddingClass =
    density === 'compact' ? 'p-2' : density === 'comfortable' ? 'p-2.5' : 'p-3';

  const colHeaderClass =
    density === 'compact' ? 'px-2.5 py-1 mb-1' : 'px-3 py-2 mb-2';

  const colTitleClass =
    density === 'compact'
      ? 'text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate cursor-pointer hover:text-indigo-600 transition-colors'
      : 'text-xs font-bold text-slate-800 uppercase tracking-wider truncate cursor-pointer hover:text-indigo-600 transition-colors';

  return (
    <div
      data-column-id={column.id}
      className={`${colWidthClass} ${colPaddingClass} bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 h-full max-h-full transition-all`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between select-none relative ${colHeaderClass}`}>
        <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
          <span
            className={`${density === 'compact' ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full shrink-0`}
            style={{ backgroundColor: column.color || '#94a3b8' }}
          />
          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className="flex-1">
              <input
                type="text"
                autoFocus
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setColName(column.name);
                  }
                }}
                className="w-full text-xs font-bold text-slate-800 uppercase px-1 py-0.5 border border-indigo-300 rounded focus:outline-none"
              />
            </form>
          ) : (
            <h2
              onDoubleClick={() => setIsEditingName(true)}
              title="Double click to rename"
              className={colTitleClass}
            >
              {column.name}
            </h2>
          )}
          <span
            className={`${
              density === 'compact' ? 'text-[10px] px-1 py-0.2' : 'text-[11px] px-1.5 py-0.5'
            } font-semibold text-slate-400 bg-slate-200/60 rounded-full shrink-0`}
          >
            {column.cards?.length || 0}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setIsAdding(true)}
            title="Add Card"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Column Options"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingName(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename Column</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsAdding(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Add Card</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Column</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards List Droppable */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-1.5 pb-2 rounded-xl transition-colors min-h-[250px] flex flex-col ${
              snapshot.isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-200/50' : ''
            }`}
          >
            {column.cards?.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                density={density}
                onSelect={onSelectCard}
                onQuickMoveCard={onQuickMoveCard}
                prevColumnId={prevColumnId}
                prevColumnName={prevColumnName}
                nextColumnId={nextColumnId}
                nextColumnName={nextColumnName}
              />
            ))}
            {provided.placeholder}

            {/* Quick Add Form */}
            {isAdding ? (
              <form onSubmit={handleQuickAdd} className="mt-1 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm">
                <input
                  type="text"
                  autoFocus
                  placeholder="What needs to be done?"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setQuickTitle('');
                    }
                  }}
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none mb-2"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setQuickTitle('');
                    }}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className={`w-full ${
                  density === 'compact' ? 'py-1 text-[11px]' : 'py-1.5 text-xs'
                } flex items-center justify-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200/90 shadow-2xs mt-1`}
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>Add card</span>
              </button>
            )}
          </div>
        )}
      </Droppable>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Column"
        description={`Are you sure you want to delete column "${column.name}" and all its tasks? This action cannot be undone.`}
        confirmText="Delete Column"
        onConfirm={() => {
          setShowDeleteModal(false);
          onDeleteColumn(column.id);
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
