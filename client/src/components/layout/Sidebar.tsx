import React from 'react';
import {
  Inbox,
  CheckSquare,
  Layers,
  Calendar,
  BarChart2,
  Settings,
  Plus,
  FolderGit2,
  Sparkles,
} from 'lucide-react';
import { Project, ViewMode, Workspace } from '../../types/kanban';

interface SidebarProps {
  workspace: Workspace | null;
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenCommand: () => void;
  onNewProject: () => void;
  isMyIssues: boolean;
  onToggleMyIssues: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspace,
  currentProject,
  onSelectProject,
  currentView,
  onSelectView,
  onOpenCommand,
  onNewProject,
  isMyIssues,
  onToggleMyIssues,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 z-20">
      {/* Workspace Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {workspace?.name?.charAt(0) || 'K'}
          </div>
          <div className="truncate">
            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {workspace?.name || 'Workspace'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Pro Plan</p>
          </div>
        </div>
        <button 
          onClick={onOpenCommand}
          title="Command Palette (Ctrl + K)"
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Quick Menu */}
        <div className="space-y-1">
          <button
            onClick={() => alert('Inbox: All recent notifications and mentions are up to date!')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              <span>Inbox</span>
            </div>
          </button>
          <button
            onClick={onToggleMyIssues}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group ${
              isMyIssues
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className={`w-4 h-4 ${isMyIssues ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
              <span>My Issues</span>
            </div>
            {isMyIssues && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Projects
            </span>
            <button
              onClick={onNewProject}
              title="Add New Project"
              className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {workspace?.projects?.map((proj) => {
              const isSelected = currentProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FolderGit2
                    className={`w-4 h-4 ${
                      isSelected ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{proj.name}</span>
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-indigo-100/70 text-indigo-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {proj.key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Views Section */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Views
            </span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('board')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'board'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => onSelectView('list')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'list'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <span>List View</span>
            </button>
            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'calendar'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => onSelectView('timeline')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'timeline'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-purple-500" />
              <span>Timeline (Gantt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
            A
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">Admin</p>
            <p className="text-[10px] text-slate-500 truncate">admin@kanban.dev</p>
          </div>
          <button
            onClick={() => alert('Settings: Workspace and Account preferences configured!')}
            title="Settings"
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
