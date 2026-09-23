import React, { useState, useEffect } from 'react';
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
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Project, ViewMode, Workspace } from '../../types/kanban';
import { ConfirmModal } from '../common/ConfirmModal';

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
  onDeleteProject?: (projectId: string) => void;
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
  onDeleteProject,
  isOpen = false,
  onClose,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Close context menu on global click or Escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
                  <div
                    key={project.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        x: Math.min(e.clientX, window.innerWidth - 190),
                        y: Math.min(e.clientY, window.innerHeight - 100),
                        project,
                      });
                    }}
                    onClick={() => {
                      onSelectProject(project);
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <FolderGit2
                        className="w-4 h-4 shrink-0"
                        style={{ color: project.color || '#6366F1' }}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-500">
                        {project.key}
                      </span>
                      {/* 3-dots trigger button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            x: Math.min(rect.right - 140, window.innerWidth - 190),
                            y: Math.min(rect.bottom + 4, window.innerHeight - 100),
                            project,
                          });
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Project Options (or right-click)"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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

      {/* Right-click Floating Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-44 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-400 truncate">
            <span className="font-semibold text-slate-700">{contextMenu.project.name}</span>
            <span className="ml-1 font-mono text-[10px]">({contextMenu.project.key})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setProjectToDelete(contextMenu.project);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Project</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal for Project Deletion */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        description={`Are you sure you want to delete project "${projectToDelete?.name} (${projectToDelete?.key})"? All boards and cards inside this project will be deleted. This action cannot be undone.`}
        confirmText="Delete Project"
        onConfirm={() => {
          if (projectToDelete && onDeleteProject) {
            onDeleteProject(projectToDelete.id);
          }
          setProjectToDelete(null);
        }}
        onClose={() => setProjectToDelete(null)}
      />
    </>
  );
};
