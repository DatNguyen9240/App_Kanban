import React from 'react';
import {
  Search,
  Plus,
  Command,
  AlignJustify,
  Maximize2,
  Grid,
  PanelLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { Board, CardDensity, Project, ViewMode } from '../../types/kanban';

interface HeaderProps {
  project: Project | null;
  board: Board | null;
  currentView?: ViewMode;
  onOpenNewCard: () => void;
  onOpenCommand: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  density: CardDensity;
  onDensityChange: (d: CardDensity) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
  onOpenNewColumn?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  board,
  currentView,
  onOpenNewCard,
  onOpenCommand,
  searchQuery,
  onSearchChange,
  density,
  onDensityChange,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onOpenNewColumn,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800/90 bg-white/80 dark:bg-[#0D1424]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-2 transition-colors duration-200">
      {/* Left: Sidebar Toggle + Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs overflow-hidden shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors shrink-0"
          title="Đóng / Mở menu thanh bên"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-medium">Projects</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
        <span className="hidden sm:inline font-semibold text-slate-800 dark:text-slate-200">{project?.name || 'Project'}</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
        <span className="text-slate-800 dark:text-slate-100 font-semibold truncate max-w-[120px] sm:max-w-xs">
          {currentView === 'my-issues' ? 'My Issues' : (board?.name || 'Sprint Board')}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
                if (searchQuery) onSearchChange('');
              }
            }}
            className="pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 w-24 sm:w-44 focus:w-36 sm:focus:w-52 transition-all"
          />
        </div>

        {/* Command shortcut trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="Command Palette (Ctrl + K)"
        >
          <Command className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>K</span>
        </button>

        {/* Card Density Toggle / Zoom View */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onDensityChange('compact')}
            title="Thu nhỏ - Nhìn rộng toàn cảnh (Overview)"
            className={`px-1.5 sm:px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-all ${
              density === 'compact'
                ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Thu nhỏ</span>
          </button>
          <button
            type="button"
            onClick={() => onDensityChange('comfortable')}
            title="Chuẩn vừa vặn (Standard)"
            className={`px-1.5 sm:px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-all ${
              density === 'comfortable'
                ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Vừa</span>
          </button>
          <button
            type="button"
            onClick={() => onDensityChange('spacious')}
            title="Lớn chi tiết (Spacious)"
            className={`px-1.5 sm:px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-all ${
              density === 'spacious'
                ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Lớn</span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối (Dark Mode)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
        )}

        {/* Add Column Button */}
        {onOpenNewColumn && (
          <button
            onClick={onOpenNewColumn}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
            title="Create New Column"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Add Column</span>
          </button>
        )}

        {/* New Issue Button */}
        <button
          onClick={onOpenNewCard}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-indigo-200 dark:shadow-none transition-all active:scale-95 shrink-0"
          title="Create New Issue"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Issue</span>
        </button>
      </div>
    </header>
  );
};
