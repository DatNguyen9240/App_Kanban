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
  isMyIssues?: boolean;
  onToggleMyIssues?: () => void;
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

  // Only auto-close sidebar on mobile devices when selecting an item
  const handleItemClick = (callback: () => void) => {
    callback();
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  // Close context menu on global click or Escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) {
        e.stopImmediatePropagation();
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [contextMenu]);

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
        className={`fixed md:static inset-y-0 left-0 z-40 bg-white dark:bg-[#0D1424] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none shrink-0 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0 shadow-2xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:opacity-0 overflow-hidden'
        }`}
      >
        {/* Workspace Header */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {workspace?.name?.charAt(0) || 'K'}
            </div>
            <div className="truncate">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {workspace?.name || 'Workspace'}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pro Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenCommand}
              title="Command Palette (Ctrl + K)"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
              onClick={() => handleItemClick(onOpenInbox)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                <span>Inbox</span>
              </div>
            </button>
            <button
              onClick={() => handleItemClick(() => onSelectView('my-issues'))}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                currentView === 'my-issues'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className={`w-4 h-4 ${currentView === 'my-issues' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                <span>My Issues</span>
              </div>
            </button>
          </div>

          {/* Views */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-2">
              Views
            </span>
            <div className="space-y-1">
              <button
                onClick={() => handleItemClick(() => onSelectView('board'))}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'board'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Layers className={`w-4 h-4 ${currentView === 'board' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Board</span>
              </button>
              <button
                onClick={() => handleItemClick(() => onSelectView('list'))}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'list'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <CheckSquare className={`w-4 h-4 ${currentView === 'list' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>List (Vikunja)</span>
              </button>
              <button
                onClick={() => handleItemClick(() => onSelectView('calendar'))}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Calendar className={`w-4 h-4 ${currentView === 'calendar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => handleItemClick(() => onSelectView('timeline'))}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'timeline'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${currentView === 'timeline' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Timeline</span>
              </button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={onNewProject}
                title="Add Project"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {!workspace?.projects || workspace.projects.length === 0 ? (
                <button
                  type="button"
                  onClick={onNewProject}
                  className="w-full py-2 px-2.5 flex items-center justify-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 rounded-xl transition-colors border border-dashed border-indigo-200 dark:border-indigo-800/60 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              ) : (
                workspace.projects.map((project) => {
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
                      onClick={() => handleItemClick(() => onSelectProject(project))}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group cursor-pointer ${
                        isActive
                          ? 'bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
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
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono group-hover:text-slate-500 dark:group-hover:text-slate-400">
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
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Project Options (or right-click)"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F17]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800/60 shrink-0">
              A
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Admin</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin@kanban.dev</p>
            </div>
            <button
              onClick={() => handleItemClick(onOpenSettings)}
              title="Settings"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right-click Floating Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 w-44 animate-in fade-in zoom-in-95 duration-100 select-none"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 text-[11px] text-slate-400 dark:text-slate-400 truncate">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{contextMenu.project.name}</span>
            <span className="ml-1 font-mono text-[10px]">({contextMenu.project.key})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setProjectToDelete(contextMenu.project);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
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
