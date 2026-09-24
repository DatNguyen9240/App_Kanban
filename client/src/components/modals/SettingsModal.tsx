import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Sliders,
  ShieldAlert,
  X,
  Check,
  Building,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
  onResetBoard?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  workspaceName = 'My Workspace',
  onResetBoard,
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'profile' | 'danger'>('workspace');
  const [name, setName] = useState(workspaceName);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showResetConfirm) {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showResetConfirm, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
        <div
          className="w-full max-w-xl bg-white dark:bg-[#0D1424] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Workspace Settings</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage preferences and configurations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'danger'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'workspace' && (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Workspace Slug
                  </label>
                  <input
                    type="text"
                    disabled
                    value="my-workspace"
                    className="w-full text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-500 dark:text-slate-500 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Unique identifier used in URLs</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Backend Connection
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold">Connected to Go API & Real-time WebSocket</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    {saved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
                    A
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Admin User</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">admin@kanban.dev</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 rounded-full">
                      Workspace Owner
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Role</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Super Administrator</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Authentication</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">JWT Bearer Token / Password</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Local Storage</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Synced</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl">
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">Reset or Clean Board</h4>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-relaxed mb-3">
                    If you want to clear cards and start fresh, you can safely reset this sprint board.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                  >
                    Reset Board Cards
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset Board */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Sprint Board"
        description="Are you sure you want to reset this board? This action requires confirmation."
        confirmText="Confirm Reset"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetBoard?.();
          onClose();
        }}
        onClose={() => setShowResetConfirm(false)}
      />
    </>
  );
};
