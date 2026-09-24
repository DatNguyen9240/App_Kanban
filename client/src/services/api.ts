import { Workspace, Board, Card, Column, Comment, Project, ChecklistItem } from '../types/kanban';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

export const api = {
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch(`${API_BASE}/workspaces`);
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    return res.json();
  },

  async getBoardDetail(boardId: string): Promise<Board> {
    const res = await fetch(`${API_BASE}/boards/${boardId}`);
    if (!res.ok) throw new Error('Failed to fetch board');
    return res.json();
  },

  async createColumn(boardId: string, name: string, color?: string): Promise<Column> {
    const res = await fetch(`${API_BASE}/boards/${boardId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Failed to create column');
    return res.json();
  },

  async updateColumn(columnId: string, data: { name?: string; color?: string }): Promise<Column> {
    const res = await fetch(`${API_BASE}/columns/${columnId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update column');
    return res.json();
  },

  async deleteColumn(columnId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/columns/${columnId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete column');
  },

  async createProject(data: {
    workspace_id: string;
    name: string;
    key: string;
    description?: string;
    color?: string;
  }): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async addChecklistItem(cardId: string, content: string): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/cards/${cardId}/checklists/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add checklist item');
    return res.json();
  },

  async toggleChecklistItem(itemId: string): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/checklists/items/${itemId}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle checklist item');
    return res.json();
  },

  async createCard(data: {
    board_id: string;
    column_id: string;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    cover_image_url?: string;
  }): Promise<Card> {
    const res = await fetch(`${API_BASE}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create card');
    return res.json();
  },

  async moveCard(
    cardId: string,
    targetColumnId: string,
    prevCardId?: string,
    nextCardId?: string
  ): Promise<Card> {
    const res = await fetch(`${API_BASE}/cards/${cardId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_column_id: targetColumnId,
        prev_card_id: prevCardId || null,
        next_card_id: nextCardId || null,
      }),
    });
    if (!res.ok) throw new Error('Failed to move card');
    return res.json();
  },

  async updateCard(cardId: string, data: Partial<Card>): Promise<Card> {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update card');
    return res.json();
  },

  async deleteCard(cardId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete card');
  },

  async addComment(cardId: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/cards/${cardId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload file');
    }
    return res.json();
  },
};
