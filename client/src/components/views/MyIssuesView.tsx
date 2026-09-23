import React, { useState } from 'react';
import { Board, Card } from '../../types/kanban';
import {
  CheckSquare,
  Search,
  Calendar,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface MyIssuesViewProps {
  board: Board | null;
  searchQuery?: string;
  onSelectCard: (card: Card) => void;
  onDeleteCard?: (cardId: string) => void;
  onNewIssue?: () => void;
}

type TabFilter = 'all' | 'todo' | 'inprogress' | 'done';

export const MyIssuesView: React.FC<MyIssuesViewProps> = ({
  board,
  searchQuery = '',
  onSelectCard,
  onDeleteCard,
  onNewIssue,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
        No board selected.
      </div>
    );
  }

  // Extract all cards across all columns with their column metadata
  const allCards = board.columns.flatMap((col) =>
    (col.cards || []).map((card) => ({
      ...card,
      columnName: col.name,
      columnColor: col.color || '#6366F1',
    }))
  );

  // Tab filtering logic
  const getTabCategory = (colName: string): 'todo' | 'inprogress' | 'done' => {
    const lower = colName.toLowerCase();
    if (lower.includes('done') || lower.includes('complete')) return 'done';
    if (lower.includes('progress') || lower.includes('doing') || lower.includes('review')) return 'inprogress';
    return 'todo';
  };

  const todoCount = allCards.filter((c) => getTabCategory(c.columnName) === 'todo').length;
  const inProgressCount = allCards.filter((c) => getTabCategory(c.columnName) === 'inprogress').length;
  const doneCount = allCards.filter((c) => getTabCategory(c.columnName) === 'done').length;
  const urgentCount = allCards.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;

  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase();

  const filteredCards = allCards.filter((card) => {
    // Tab filter
    if (activeTab !== 'all') {
      const cat = getTabCategory(card.columnName);
      if (cat !== activeTab) return false;
    }

    // Search filter
    if (effectiveSearch) {
      const matchTitle = card.title.toLowerCase().includes(effectiveSearch);
      const matchKey = card.issue_key.toLowerCase().includes(effectiveSearch);
      const matchDesc = card.description?.toLowerCase().includes(effectiveSearch) || false;
      if (!matchTitle && !matchKey && !matchDesc) return false;
    }

    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
      default:
        return (
          <span className="text-slate-400 text-[11px]">—</span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Top Banner / Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                My Issues
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {allCards.length}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                All issues in this project assigned to you or created by you
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter issues..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white w-44 sm:w-56 transition-all"
              />
            </div>

            {onNewIssue && (
              <button
                type="button"
                onClick={onNewIssue}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Tab Navigation & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allCards.length})
            </button>
            <button
              onClick={() => setActiveTab('inprogress')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'inprogress'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab('todo')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'todo'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              To Do ({todoCount})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'done'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({doneCount})
            </button>
          </div>

          {/* Quick Counter Chips */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 font-medium">
            {urgentCount > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5" />
                {urgentCount} High Priority
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {doneCount}/{allCards.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Issues Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                {onDeleteCard && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-800 mb-1">
                        No issues found
                      </h2>
                      <p className="text-xs text-slate-500 mb-4">
                        {allCards.length === 0
                          ? 'Get started by creating your first issue in this sprint.'
                          : 'No issues match the selected filter or search keyword.'}
                      </p>
                      {onNewIssue && (
                        <button
                          type="button"
                          onClick={onNewIssue}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                        >
                          + Create New Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    onClick={() => onSelectCard(card)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500 whitespace-nowrap">
                      {card.issue_key}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-md truncate group-hover:text-indigo-600 transition-colors">
                      {card.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${card.columnColor}18`,
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPriorityBadge(card.priority)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={card.assignees?.[0]?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
                          alt={card.assignees?.[0]?.full_name || 'Admin User'}
                          title={card.assignees?.[0]?.full_name || 'Admin User'}
                          className="w-5 h-5 rounded-full border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-600 font-medium">
                          {card.assignees?.[0]?.full_name || 'Admin User'}
                        </span>
                      </div>
                    </td>
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
                    {onDeleteCard && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardToDelete(card);
                          }}
                          title="Delete card"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Card Deletion */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        title="Delete Issue"
        description={`Are you sure you want to delete issue "${cardToDelete?.title}" (${cardToDelete?.issue_key})? This action cannot be undone.`}
        confirmText="Delete Issue"
        onConfirm={() => {
          if (cardToDelete && onDeleteCard) {
            onDeleteCard(cardToDelete.id);
          }
          setCardToDelete(null);
        }}
        onClose={() => setCardToDelete(null)}
      />
    </div>
  );
};
