import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Column, Priority } from '../../types/kanban';
import { Select, PRIORITY_OPTIONS, SelectOption } from '../common/Select';
import { ImageUpload } from '../common/ImageUpload';

interface NewCardModalProps {
  isOpen: boolean;
  columns: Column[];
  onClose: () => void;
  onSubmit: (data: {
    column_id: string;
    title: string;
    description: string;
    priority: Priority;
    cover_image_url?: string;
  }) => void;
}

export const NewCardModal: React.FC<NewCardModalProps> = ({
  isOpen,
  columns,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('none');
  const [coverUrl, setCoverUrl] = useState('');

  const columnOptions: SelectOption<string>[] = columns.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color || '#6366f1',
  }));

  useEffect(() => {
    if (!columnId && columns.length > 0) {
      setColumnId(columns[0].id);
    }
  }, [columns, columnId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    onSubmit({
      column_id: columnId,
      title: title.trim(),
      description: description.trim(),
      priority,
      cover_image_url: coverUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#0D1424] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create New Issue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Title *</label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Issue title (e.g. Implement user login flow)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/90 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status (Column)</label>
              <Select
                value={columnId}
                onChange={(val) => setColumnId(val)}
                options={columnOptions}
                placeholder="Select column..."
                buttonClassName="py-2 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
              <Select
                value={priority}
                onChange={(val) => setPriority(val)}
                options={PRIORITY_OPTIONS}
                placeholder="Select priority..."
                buttonClassName="py-2 rounded-xl"
              />
            </div>
          </div>

          <ImageUpload
            value={coverUrl}
            onChange={(url) => setCoverUrl(url || '')}
            label="Cover Image (Optional)"
          />

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-xs transition-colors"
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
