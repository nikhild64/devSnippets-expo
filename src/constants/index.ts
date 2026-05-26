export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'kotlin',
  'swift',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'html',
  'css',
  'sql',
  'shell',
  'dart',
  'yaml',
  'json',
  'markdown',
  'plaintext',
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  kotlin: '.kt',
  swift: '.swift',
  go: '.go',
  rust: '.rs',
  c: '.c',
  cpp: '.cpp',
  csharp: '.cs',
  php: '.php',
  ruby: '.rb',
  html: '.html',
  css: '.css',
  sql: '.sql',
  shell: '.sh',
  dart: '.dart',
  yaml: '.yml',
  json: '.json',
  markdown: '.md',
  plaintext: '.txt',
};

export const STORAGE_KEYS = {
  THEME: 'app_theme',
  SORT_ORDER: 'sort_order',
  ONBOARDED: 'onboarded',
} as const;

export const SECURE_KEYS = {
  GEMINI_API_KEY: 'gemini_api_key',
} as const;

export const APP_DIRECTORIES = {
  ATTACHMENTS: 'attachments',
  EXPORTS: 'exports',
  FILES: 'files',
} as const;
