import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  Bell,
  Check,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'mention' | 'assignment' | 'comment' | 'system';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'system',
      title: 'Workspace Initialized',
      description: 'Default Kanban board and Sprint columns are ready for production.',
      time: 'Just now',
      isRead: false,
    },
    {
      id: '2',
      type: 'mention',
      title: 'Welcome to Kanban Flow',
      description: 'You are signed in as Admin. Press Ctrl + K to explore quick commands.',
      time: '10m ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'system',
      title: 'Real-time WebSocket Connected',
      description: 'Live sync channel is active on port 8080 with zero-lag updates.',
      time: '25m ago',
      isRead: true,
    },
  ]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
              <Inbox className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Inbox & Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Mentions, alerts and activity feed</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-slate-100">
          {(['all', 'unread', 'mentions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'unread' ? `Unread (${unreadCount})` : 'Mentions'}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-600">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No notifications in this view.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl transition-colors flex items-start gap-3 ${
                  item.isRead ? 'hover:bg-slate-50/80 opacity-80' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'mention'
                      ? 'bg-purple-100 text-purple-700'
                      : item.type === 'comment'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {item.type === 'mention' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : item.type === 'comment' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.description}</p>
                </div>

                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};
