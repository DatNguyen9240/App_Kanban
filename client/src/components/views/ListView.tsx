import React, { useState } from 'react';
import { Board, Card, Priority } from '../../types/kanban';
import {
  Calendar,
  Trash2,
  CheckCircle2,
  Circle,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { Select, PRIORITY_OPTIONS, SelectOption } from '../common/Select';

interface ListViewProps {
  board: Board;
  onSelectCard: (card: Card) => void;
  onDeleteCard?: (cardId: string) => void;
  onUpdateCard?: (cardId: string, data: Partial<Card>) => void;
  onToggleChecklist?: (itemId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  board,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onToggleChecklist,
}) => {
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Extract all cards across columns
  const allCards = (board?.columns || []).flatMap((col) =>
    (col.cards || []).map((c) => ({
      ...c,
      columnName: col.name,
      columnColor: col.color || '#6366f1',
    }))
  );

  // Identify done and todo columns
  const doneCol =
    board?.columns?.find((c) => {
      const name = c.name.toLowerCase();
      return name.includes('done') || name.includes('complete') || name.includes('finish');
    }) || board?.columns?.[board.columns.length - 1];

  const todoCol =
    board?.columns?.find((c) => {
      const name = c.name.toLowerCase();
      return name.includes('todo') || name.includes('backlog') || name.includes('ready');
    }) || board?.columns?.[0];

  const columnOptions: SelectOption<string>[] = (board?.columns || []).map((col) => ({
    value: col.id,
    label: col.name,
    color: col.color || '#6366f1',
  }));

  const isCardDone = (card: Card & { columnName?: string }) => {
    if (card.column_id === doneCol?.id) return true;
    const name = (card.columnName || '').toLowerCase();
    return name.includes('done') || name.includes('complete') || name.includes('finish');
  };

  // 1. Toggle single task done / undone
  const handleToggleDone = (e: React.MouseEvent, card: Card & { columnName?: string }) => {
    e.stopPropagation();
    if (!onUpdateCard) return;
    const isDone = isCardDone(card);
    const targetCol = isDone ? todoCol : doneCol;
    if (targetCol) {
      onUpdateCard(card.id, { column_id: targetCol.id });
    }
  };

  // 2. Multi-select toggle
  const isAllSelected = allCards.length > 0 && selectedCardIds.size === allCards.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(allCards.map((c) => c.id)));
    }
  };

  const handleToggleSelectCard = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const next = new Set(selectedCardIds);
    if (next.has(cardId)) {
      next.delete(cardId);
    } else {
      next.add(cardId);
    }
    setSelectedCardIds(next);
  };

  // 3. Expand / collapse checklist subtasks
  const handleToggleExpand = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const next = new Set(expandedCardIds);
    if (next.has(cardId)) {
      next.delete(cardId);
    } else {
      next.add(cardId);
    }
    setExpandedCardIds(next);
  };

  // 4. Batch Actions
  const handleBatchMarkDone = () => {
    if (!onUpdateCard || !doneCol) return;
    selectedCardIds.forEach((id) => {
      onUpdateCard(id, { column_id: doneCol.id });
    });
    setSelectedCardIds(new Set());
  };

  const handleBatchDeleteConfirm = () => {
    if (onDeleteCard) {
      selectedCardIds.forEach((id) => {
        onDeleteCard(id);
      });
    }
    setSelectedCardIds(new Set());
    setShowBatchDeleteModal(false);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Select all tasks"
                  />
                </th>
                {/* Done Checkbox Column */}
                <th className="py-3 px-2 w-10 text-center" title="Mark Done">
                  Done
                </th>
                <th className="py-3 px-3 w-24">Key</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                {onDeleteCard && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No issues found on this board.
                  </td>
                </tr>
              ) : (
                allCards.map((card) => {
                  const isDone = isCardDone(card);
                  const isSelected = selectedCardIds.has(card.id);
                  const isExpanded = expandedCardIds.has(card.id);

                  // Checklist counts
                  const totalChecklist =
                    card.checklists?.reduce((acc, cl) => acc + (cl.items?.length || 0), 0) || 0;
                  const doneChecklist =
                    card.checklists?.reduce(
                      (acc, cl) => acc + (cl.items?.filter((it) => it.is_done)?.length || 0),
                      0
                    ) || 0;

                  return (
                    <React.Fragment key={card.id}>
                      <tr
                        onClick={() => onSelectCard(card)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected
                            ? 'bg-indigo-50/50 hover:bg-indigo-50/80'
                            : isDone
                            ? 'bg-slate-50/40 hover:bg-slate-50'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* 1. Multi-Select Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => handleToggleSelectCard(e, card.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* 2. Task Done Complete Checkbox */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleToggleDone(e, card)}
                            className="p-1 rounded-md text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center mx-auto"
                            title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 hover:text-emerald-700" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 hover:text-emerald-500 hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </td>

                        {/* 3. Issue Key */}
                        <td className="py-3 px-3 font-mono font-semibold text-slate-500 whitespace-nowrap">
                          {card.issue_key}
                        </td>

                        {/* 4. Title + Checklist Badge */}
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs transition-colors">
                          <div className="flex items-center gap-2">
                            {totalChecklist > 0 && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleExpand(e, card.id)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                title="Toggle subtasks checklist"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <span
                              className={`truncate group-hover:text-indigo-600 ${
                                isDone ? 'line-through text-slate-400 font-normal' : ''
                              }`}
                            >
                              {card.title}
                            </span>

                            {totalChecklist > 0 && (
                              <span
                                onClick={(e) => handleToggleExpand(e, card.id)}
                                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors shrink-0 ${
                                  doneChecklist === totalChecklist
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span>
                                  {doneChecklist}/{totalChecklist}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Status Column Selector */}
                        <td
                          className="py-2 px-3 whitespace-nowrap min-w-[130px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={card.column_id}
                            onChange={(newColId) => {
                              if (onUpdateCard) {
                                onUpdateCard(card.id, { column_id: newColId });
                              }
                            }}
                            options={columnOptions}
                            buttonClassName="py-1 px-2.5 text-[11px] rounded-lg border-slate-200/80 bg-slate-50/50 hover:bg-white"
                          />
                        </td>

                        {/* 6. Priority Column Selector */}
                        <td
                          className="py-2 px-3 whitespace-nowrap min-w-[120px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={card.priority}
                            onChange={(newPriority) => {
                              if (onUpdateCard) {
                                onUpdateCard(card.id, { priority: newPriority as Priority });
                              }
                            }}
                            options={PRIORITY_OPTIONS}
                            buttonClassName="py-1 px-2.5 text-[11px] rounded-lg border-slate-200/80 bg-slate-50/50 hover:bg-white"
                          />
                        </td>

                        {/* 7. Assignee */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {card.assignees && card.assignees.length > 0 ? (
                              card.assignees.map((u) => (
                                <img
                                  key={u.id}
                                  src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
                                  alt={u.full_name}
                                  title={u.full_name}
                                  className="w-5 h-5 rounded-full border border-slate-200"
                                />
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">Unassigned</span>
                            )}
                          </div>
                        </td>

                        {/* 8. Due Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {card.due_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(card.due_date).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* 9. Actions */}
                        {onDeleteCard && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardToDelete(card);
                              }}
                              title="Delete issue"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Subtasks / Checklist Expanded Rows */}
                      {isExpanded && card.checklists && card.checklists.length > 0 && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan={9} className="py-2.5 px-8 sm:px-12">
                            <div className="space-y-2">
                              {card.checklists.map((cl) => (
                                <div key={cl.id} className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {cl.title}
                                  </span>
                                  <div className="space-y-1 pl-2">
                                    {cl.items?.map((item) => (
                                      <label
                                        key={item.id}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/80 p-1 rounded-md transition-colors w-fit"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={item.is_done}
                                          onChange={() => onToggleChecklist?.(item.id)}
                                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span
                                          className={`transition-colors ${
                                            item.is_done ? 'line-through text-slate-400' : ''
                                          }`}
                                        >
                                          {item.content}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedCardIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs font-semibold text-slate-200">
            {selectedCardIds.size} {selectedCardIds.size === 1 ? 'task' : 'tasks'} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleBatchMarkDone}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark as Done</span>
          </button>
          {onDeleteCard && (
            <button
              type="button"
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedCardIds(new Set())}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Single Card Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        title="Delete Issue"
        description={`Are you sure you want to delete "${cardToDelete?.issue_key}: ${cardToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Issue"
        onConfirm={() => {
          if (cardToDelete && onDeleteCard) {
            onDeleteCard(cardToDelete.id);
          }
          setCardToDelete(null);
        }}
        onClose={() => setCardToDelete(null)}
      />

      {/* Batch Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showBatchDeleteModal}
        title={`Delete ${selectedCardIds.size} Issues`}
        description={`Are you sure you want to delete ${selectedCardIds.size} selected issues? This action cannot be undone.`}
        confirmText={`Delete ${selectedCardIds.size} Issues`}
        onConfirm={handleBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteModal(false)}
      />
    </>
  );
};
