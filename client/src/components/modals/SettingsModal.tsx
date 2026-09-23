import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Workspace Settings</h3>
                <p className="text-[11px] text-slate-500">Manage preferences and configurations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
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
                  : 'text-rose-600 hover:bg-rose-50'
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Workspace Slug
                  </label>
                  <input
                    type="text"
                    disabled
                    value="my-workspace"
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique identifier used in URLs</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Backend Connection
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-emerald-800 text-xs">
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
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-200 shadow-xs">
                    A
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Admin User</h4>
                    <p className="text-xs text-slate-500">admin@kanban.dev</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      Workspace Owner
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Role</span>
                    <span className="font-semibold text-slate-800">Super Administrator</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Authentication</span>
                    <span className="font-semibold text-slate-800">JWT Bearer Token / Password</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-500 font-medium">Local Storage</span>
                    <span className="font-semibold text-slate-800">Synced</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-rose-800 mb-1">Reset or Clean Board</h4>
                  <p className="text-[11px] text-rose-600/90 leading-relaxed mb-3">
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
