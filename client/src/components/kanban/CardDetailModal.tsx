import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Send,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, Column, Priority } from '../../types/kanban';
import { ConfirmModal } from '../common/ConfirmModal';
import { DatePicker } from '../common/DatePicker';
import { Select, PRIORITY_OPTIONS, SelectOption } from '../common/Select';
import { ImageUpload } from '../common/ImageUpload';

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
  const [dueDate, setDueDate] = useState<string | null>(card?.due_date || null);
  const [commentText, setCommentText] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date || null);
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

  const columnOptions: SelectOption<string>[] = columns.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color || '#6366f1',
  }));

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
              {card.issue_key}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {currentColumn?.name || 'Status'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCoverUpload(!showCoverUpload)}
              title={card.cover_image_url ? 'Change cover image' : 'Add cover image'}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                showCoverUpload || card.cover_image_url
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cover</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete issue"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cover Image Banner */}
        {card.cover_image_url && (
          <div className="relative max-h-80 min-h-[220px] w-full bg-slate-900/5 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 group overflow-hidden shrink-0 flex items-center justify-center">
            {/* Ambient blur background */}
            <img
              src={card.cover_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
            />
            {/* Sharp uncropped image */}
            <img
              src={card.cover_image_url}
              alt="Cover"
              className="relative max-h-80 w-auto max-w-full object-contain z-10 py-2 drop-shadow-sm transition-transform duration-200"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={() => setShowCoverUpload(!showCoverUpload)}
                className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showCoverUpload ? 'Close' : 'Change Cover'}</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdate(card.id, { cover_image_url: '' })}
                className="p-1.5 bg-black/60 hover:bg-rose-600 backdrop-blur-sm text-white rounded-lg transition-colors shadow-sm"
                title="Remove Cover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Expandable Image Upload Area */}
        {showCoverUpload && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in fade-in duration-150 shrink-0">
            <ImageUpload
              value={card.cover_image_url}
              showPreview={!card.cover_image_url}
              onChange={(newUrl) => {
                onUpdate(card.id, { cover_image_url: newUrl || '' });
                if (!newUrl) setShowCoverUpload(false);
              }}
              label={card.cover_image_url ? 'Replace Card Cover' : 'Add Card Cover'}
            />
          </div>
        )}

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
              className="w-full text-lg font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none resize-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/60 focus:bg-slate-50 dark:focus:bg-slate-900/60 p-1.5 rounded-lg border border-transparent focus:border-slate-200 dark:focus:border-slate-700 transition-colors"
            />
          </div>

          {/* Properties Grid (Status, Priority, Due Date) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            {/* Status */}
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">Status</span>
              <Select
                value={card.column_id}
                onChange={(colId) => onUpdate(card.id, { column_id: colId })}
                options={columnOptions}
                placeholder="Select status..."
              />
            </div>

            {/* Priority */}
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">Priority</span>
              <Select
                value={card.priority}
                onChange={(newPriority) => onUpdate(card.id, { priority: newPriority as Priority })}
                options={PRIORITY_OPTIONS}
                placeholder="Select priority..."
              />
            </div>

            {/* Due Date */}
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">Due Date</span>
              <DatePicker
                value={dueDate}
                onChange={(newDate) => {
                  setDueDate(newDate);
                  onUpdate(card.id, { due_date: newDate });
                }}
              />
            </div>

            {/* Assignee */}
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">Assignee</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                {card.assignees && card.assignees.length > 0 ? (
                  card.assignees.map((u) => (
                    <div
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
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
                  <span className="text-slate-400 dark:text-slate-500 text-xs italic">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Description
            </span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="Add detailed markdown description..."
              className="w-full text-xs text-slate-800 dark:text-slate-100 p-3 bg-slate-50/50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 resize-y transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Checklists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Checklist
              </span>
            </div>
            <div className="space-y-3">
              {card.checklists && card.checklists.length > 0 ? (
                card.checklists.map((cl) => (
                  <div key={cl.id} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2">{cl.title}</p>
                    <div className="space-y-1.5 mb-2.5">
                      {cl.items?.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={item.is_done}
                            onChange={() => onToggleChecklist(item.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                          />
                          <span className={item.is_done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
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
                      className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800"
                    >
                      <input
                        type="text"
                        placeholder="Add an item..."
                        value={newCheckItem}
                        onChange={(e) => setNewCheckItem(e.target.value)}
                        className="flex-1 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">No checklist yet.</p>
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
                      className="flex-1 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
              Activity & Comments
            </span>

            {/* List of comments */}
            <div className="space-y-3 mb-4">
              {card.comments?.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <img
                    src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
                    alt={comment.user?.full_name || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 mt-0.5"
                  />
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {comment.user?.full_name || 'Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
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
                className="flex-1 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900"
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
