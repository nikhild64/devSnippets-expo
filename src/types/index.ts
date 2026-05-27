export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string; // JSON array string
  folder_path: string | null; // linked folder in Files
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
  folder_path?: string | null;
}

export interface SnippetUpdateInput {
  title?: string;
  code?: string;
  language?: string;
  tags?: string[];
  is_favorite?: number;
  folder_path?: string | null;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: string;
}

export type ExportFormat = "txt" | "js" | "json";

export type AIAction = "explain" | "summarize" | "improve";

export type ThemeMode = "light" | "dark" | "system";
