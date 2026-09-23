import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Command,
  AlignJustify,
  Maximize2,
  Grid,
} from 'lucide-react';
import { Board, CardDensity, Project } from '../../types/kanban';

interface HeaderProps {
  project: Project | null;
  board: Board | null;
  onOpenNewCard: () => void;
  onOpenCommand: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  density: CardDensity;
  onDensityChange: (d: CardDensity) => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  board,
  onOpenNewCard,
  onOpenCommand,
  searchQuery,
  onSearchChange,
  density,
  onDensityChange,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Projects</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">{project?.name || 'Project'}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-medium">{board?.name || 'Sprint Board'}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white w-48 transition-all"
          />
        </div>

        {/* Command shortcut trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Command className="w-3 h-3 text-slate-400" />
          <span>K</span>
        </button>

        {/* Card Density Toggle (PLANKA style) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-slate-600">
          <button
            onClick={() => onDensityChange('compact')}
            title="Compact View"
            className={`p-1 rounded text-xs transition-colors ${
              density === 'compact' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDensityChange('comfortable')}
            title="Comfortable View"
            className={`p-1 rounded text-xs transition-colors ${
              density === 'comfortable' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDensityChange('spacious')}
            title="Spacious View"
            className={`p-1 rounded text-xs transition-colors ${
              density === 'spacious' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Issue Button */}
        <button
          onClick={onOpenNewCard}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow-sm transition-all hover:shadow active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Issue</span>
        </button>
      </div>
    </header>
  );
};
