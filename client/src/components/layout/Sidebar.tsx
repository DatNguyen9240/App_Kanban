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
  X,
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
  onOpenInbox: () => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  onOpenInbox,
  onOpenSettings,
  isOpen = false,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Workspace Header */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {workspace?.name?.charAt(0) || 'K'}
            </div>
            <div className="truncate">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {workspace?.name || 'Workspace'}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Pro Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenCommand}
              title="Command Palette (Ctrl + K)"
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Quick Menu */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenInbox();
                onClose?.();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                <span>Inbox</span>
              </div>
            </button>
            <button
              onClick={() => {
                onToggleMyIssues();
                onClose?.();
              }}
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
            </button>
          </div>

          {/* Views */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Views
            </span>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onSelectView('board');
                  onClose?.();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'board'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Layers className={`w-4 h-4 ${currentView === 'board' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Board</span>
              </button>
              <button
                onClick={() => {
                  onSelectView('list');
                  onClose?.();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'list'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CheckSquare className={`w-4 h-4 ${currentView === 'list' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>List (Vikunja)</span>
              </button>
              <button
                onClick={() => {
                  onSelectView('calendar');
                  onClose?.();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Calendar className={`w-4 h-4 ${currentView === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => {
                  onSelectView('timeline');
                  onClose?.();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'timeline'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${currentView === 'timeline' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Timeline</span>
              </button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={onNewProject}
                title="Add Project"
                className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {workspace?.projects?.map((project) => {
                const isActive = currentProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project);
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FolderGit2
                        className="w-4 h-4 shrink-0"
                        style={{ color: project.color || '#6366F1' }}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-500 shrink-0">
                      {project.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 shrink-0">
              A
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">Admin</p>
              <p className="text-[10px] text-slate-500 truncate">admin@kanban.dev</p>
            </div>
            <button
              onClick={() => {
                onOpenSettings();
                onClose?.();
              }}
              title="Settings"
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
