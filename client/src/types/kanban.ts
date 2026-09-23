export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_done: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  card_id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  card_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
}

export interface Activity {
  id: string;
  card_id: string;
  user_id: string;
  user?: User;
  action: string;
  metadata: string;
  created_at: string;
}

export interface Card {
  id: string;
  column_id: string;
  board_id: string;
  issue_key: string;
  title: string;
  description: string;
  position: number;
  priority: Priority;
  due_date?: string;
  cover_image_url?: string;
  creator_id: string;
  assignees?: User[];
  labels?: Label[];
  checklists?: Checklist[];
  comments?: Comment[];
  activities?: Activity[];
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  limit: number;
  cards: Card[];
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  background_url: string;
  background_gradient: string;
  columns: Column[];
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  color: string;
  boards?: Board[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  projects?: Project[];
}

export type ViewMode = 'board' | 'list' | 'calendar' | 'timeline';
export type CardDensity = 'compact' | 'comfortable' | 'spacious';
