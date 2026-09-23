import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Layers,
  CheckSquare,
  Calendar,
  BarChart2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { ViewMode } from '../../types/kanban';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewIssue: () => void;
  onSelectView: (view: ViewMode) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewIssue,
  onSelectView,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger handled in parent
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_issue',
      title: 'Create new issue',
      icon: Plus,
      color: 'text-indigo-600',
      action: () => {
        onClose();
        onNewIssue();
      },
    },
    {
      id: 'view_my_issues',
      title: 'Go to My Issues',
      icon: CheckSquare,
      color: 'text-indigo-600',
      action: () => {
        onSelectView('my-issues');
        onClose();
      },
    },
    {
      id: 'view_board',
      title: 'Switch to Kanban Board',
      icon: Layers,
      color: 'text-blue-600',
      action: () => {
        onSelectView('board');
        onClose();
      },
    },
    {
      id: 'view_list',
      title: 'Switch to List View',
      icon: CheckSquare,
      color: 'text-emerald-600',
      action: () => {
        onSelectView('list');
        onClose();
      },
    },
    {
      id: 'view_calendar',
      title: 'Switch to Calendar View',
      icon: Calendar,
      color: 'text-amber-600',
      action: () => {
        onSelectView('calendar');
        onClose();
      },
    },
    {
      id: 'view_timeline',
      title: 'Switch to Timeline View',
      icon: BarChart2,
      color: 'text-purple-600',
      action: () => {
        onSelectView('timeline');
        onClose();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action List */}
        <div className="p-2 max-h-80 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </div>
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
