export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string; // JSON array string
  is_favorite: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  snippet_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export interface SnippetCreateInput {
  title: string;
  code: string;
  language: string;
  tags: string[];
}

export interface SnippetUpdateInput {
  title?: string;
  code?: string;
  language?: string;
  tags?: string[];
  is_favorite?: number;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: string;
}

export type ExportFormat = 'txt' | 'js' | 'json';

export type AIAction = 'explain' | 'summarize' | 'improve';

export interface AIResponse {
  action: AIAction;
  content: string;
  timestamp: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
