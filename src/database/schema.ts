import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'devsnippets.db';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'plaintext',
      tags TEXT DEFAULT '[]',
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snippet_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT DEFAULT 'image',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
    );
  `);

  // FTS5 virtual table for full-text search
  await db.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
      title, code, tags, content='snippets', content_rowid='id'
    );
  `);

  // Triggers to keep FTS in sync
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets BEGIN
      INSERT INTO snippets_fts(rowid, title, code, tags) VALUES (new.id, new.title, new.code, new.tags);
    END;
  `);

  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets BEGIN
      INSERT INTO snippets_fts(snippets_fts, rowid, title, code, tags) VALUES('delete', old.id, old.title, old.code, old.tags);
    END;
  `);

  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets BEGIN
      INSERT INTO snippets_fts(snippets_fts, rowid, title, code, tags) VALUES('delete', old.id, old.title, old.code, old.tags);
      INSERT INTO snippets_fts(rowid, title, code, tags) VALUES (new.id, new.title, new.code, new.tags);
    END;
  `);
}
