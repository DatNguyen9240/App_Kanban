import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CheckSquare,
  MessageSquare,
  Clock,
  Trash2,
  Send,
  User,
  Tag,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { Card, Column, Priority } from '../../types/kanban';
import { ConfirmModal } from '../common/ConfirmModal';
import { DatePicker } from '../common/DatePicker';

interface CardDetailModalProps {
  card: Card | null;
  columns: Column[];
  onClose: () => void;
  onUpdate: (cardId: string, data: Partial<Card>) => void;
  onDelete: (cardId: string) => void;
  onAddComment: (cardId: string, content: string) => void;
  onToggleChecklist: (itemId: string) => void;
  onAddChecklistItem: (cardId: string, content: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  columns,
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
  onToggleChecklist,
  onAddChecklistItem,
}) => {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [commentText, setCommentText] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
    }
  }, [card]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteModal && card) {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteModal, card]);

  if (!card) return null;

  const currentColumn = columns.find((c) => c.id === card.column_id);

  const handleTitleBlur = () => {
    if (title.trim() && title !== card.title) {
      onUpdate(card.id, { title: title.trim() });
    }
  };

  const handleDescBlur = () => {
    if (description !== card.description) {
      onUpdate(card.id, { description });
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(card.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
              {card.issue_key}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">
              {currentColumn?.name || 'Status'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete issue"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Editable Title */}
          <div>
            <textarea
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Issue title"
              className="w-full text-lg font-bold text-slate-900 focus:outline-none resize-none bg-transparent hover:bg-slate-50 focus:bg-slate-50 p-1.5 rounded-lg border border-transparent focus:border-slate-200 transition-colors"
            />
          </div>

          {/* Properties Grid (Status, Priority, Due Date) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            {/* Status */}
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Status</span>
              <select
                value={card.column_id}
                onChange={(e) => onUpdate(card.id, { column_id: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-slate-700 font-medium focus:outline-none"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Priority</span>
              <select
                value={card.priority}
                onChange={(e) => onUpdate(card.id, { priority: e.target.value as Priority })}
                className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-slate-700 font-medium focus:outline-none capitalize"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
                <option value="none">⚪ None</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Due Date</span>
              <DatePicker
                value={card.due_date}
                onChange={(newDate) => onUpdate(card.id, { due_date: newDate })}
              />
            </div>

            {/* Assignee */}
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Assignee</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                {card.assignees && card.assignees.length > 0 ? (
                  card.assignees.map((u) => (
                    <div
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      <img
                        src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
                        alt={u.full_name}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="truncate max-w-[100px]">{u.full_name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Description
            </span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="Add detailed markdown description..."
              className="w-full text-xs text-slate-800 p-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-y transition-all leading-relaxed"
            />
          </div>

          {/* Checklists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Checklist
              </span>
            </div>
            <div className="space-y-3">
              {card.checklists && card.checklists.length > 0 ? (
                card.checklists.map((cl) => (
                  <div key={cl.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-800 mb-2">{cl.title}</p>
                    <div className="space-y-1.5 mb-2.5">
                      {cl.items?.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={item.is_done}
                            onChange={() => onToggleChecklist(item.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={item.is_done ? 'line-through text-slate-400' : ''}>
                            {item.content}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Add Item to Checklist */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newCheckItem.trim()) return;
                        onAddChecklistItem(card.id, newCheckItem.trim());
                        setNewCheckItem('');
                      }}
                      className="flex items-center gap-2 pt-1 border-t border-slate-200/60"
                    >
                      <input
                        type="text"
                        placeholder="Add an item..."
                        value={newCheckItem}
                        onChange={(e) => setNewCheckItem(e.target.value)}
                        className="flex-1 text-xs bg-white px-2.5 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 text-xs bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400 mb-2">No checklist yet.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCheckItem.trim()) return;
                      onAddChecklistItem(card.id, newCheckItem.trim());
                      setNewCheckItem('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Add first checklist item..."
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      className="flex-1 text-xs bg-white px-2.5 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
              Activity & Comments
            </span>

            {/* List of comments */}
            <div className="space-y-3 mb-4">
              {card.comments?.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <img
                    src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
                    alt={comment.user?.full_name || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 mt-0.5"
                  />
                  <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900">
                        {comment.user?.full_name || 'Member'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Write Comment */}
            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Leave a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Issue"
        description={`Are you sure you want to delete "${card.issue_key}: ${card.title}"? This action cannot be undone.`}
        confirmText="Delete Issue"
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(card.id);
          onClose();
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
