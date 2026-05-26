import { type SQLiteDatabase } from 'expo-sqlite';
import { Snippet, SnippetCreateInput, SnippetUpdateInput, Attachment } from '../types';

export function createSnippetRepository(db: SQLiteDatabase) {
  return {
    async create(input: SnippetCreateInput): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO snippets (title, code, language, tags) VALUES (?, ?, ?, ?)`,
        [input.title, input.code, input.language, JSON.stringify(input.tags)]
      );
      return result.lastInsertRowId;
    },

    async update(id: number, input: SnippetUpdateInput): Promise<void> {
      const fields: string[] = [];
      const values: (string | number)[] = [];

      if (input.title !== undefined) {
        fields.push('title = ?');
        values.push(input.title);
      }
      if (input.code !== undefined) {
        fields.push('code = ?');
        values.push(input.code);
      }
      if (input.language !== undefined) {
        fields.push('language = ?');
        values.push(input.language);
      }
      if (input.tags !== undefined) {
        fields.push('tags = ?');
        values.push(JSON.stringify(input.tags));
      }
      if (input.is_favorite !== undefined) {
        fields.push('is_favorite = ?');
        values.push(input.is_favorite);
      }

      fields.push("updated_at = datetime('now')");
      values.push(id);

      await db.runAsync(
        `UPDATE snippets SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    },

    async delete(id: number): Promise<void> {
      await db.runAsync(`DELETE FROM snippets WHERE id = ?`, [id]);
    },

    async getById(id: number): Promise<Snippet | null> {
      return await db.getFirstAsync<Snippet>(
        `SELECT * FROM snippets WHERE id = ?`,
        [id]
      );
    },

    async getAll(orderBy: string = 'updated_at DESC'): Promise<Snippet[]> {
      return await db.getAllAsync<Snippet>(
        `SELECT * FROM snippets ORDER BY ${orderBy}`
      );
    },

    async getFavorites(): Promise<Snippet[]> {
      return await db.getAllAsync<Snippet>(
        `SELECT * FROM snippets WHERE is_favorite = 1 ORDER BY updated_at DESC`
      );
    },

    async toggleFavorite(id: number): Promise<void> {
      await db.runAsync(
        `UPDATE snippets SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
    },

    async search(query: string): Promise<Snippet[]> {
      if (!query.trim()) return this.getAll();
      const searchTerm = query.trim().replace(/"/g, '""');
      return await db.getAllAsync<Snippet>(
        `SELECT s.* FROM snippets s 
         INNER JOIN snippets_fts fts ON s.id = fts.rowid 
         WHERE snippets_fts MATCH ? 
         ORDER BY rank`,
        [`"${searchTerm}"*`]
      );
    },

    async getByLanguage(language: string): Promise<Snippet[]> {
      return await db.getAllAsync<Snippet>(
        `SELECT * FROM snippets WHERE language = ? ORDER BY updated_at DESC`,
        [language]
      );
    },

    async getByTag(tag: string): Promise<Snippet[]> {
      return await db.getAllAsync<Snippet>(
        `SELECT * FROM snippets WHERE tags LIKE ? ORDER BY updated_at DESC`,
        [`%"${tag}"%`]
      );
    },

    async addAttachment(snippetId: number, filePath: string, fileName: string, fileType: string): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO attachments (snippet_id, file_path, file_name, file_type) VALUES (?, ?, ?, ?)`,
        [snippetId, filePath, fileName, fileType]
      );
      return result.lastInsertRowId;
    },

    async getAttachments(snippetId: number): Promise<Attachment[]> {
      return await db.getAllAsync<Attachment>(
        `SELECT * FROM attachments WHERE snippet_id = ? ORDER BY created_at DESC`,
        [snippetId]
      );
    },

    async deleteAttachment(id: number): Promise<void> {
      await db.runAsync(`DELETE FROM attachments WHERE id = ?`, [id]);
    },

    async getCount(): Promise<number> {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM snippets`
      );
      return result?.count ?? 0;
    },

    async getAllTags(): Promise<string[]> {
      const snippets = await db.getAllAsync<{ tags: string }>(
        `SELECT DISTINCT tags FROM snippets WHERE tags != '[]'`
      );
      const tagSet = new Set<string>();
      snippets.forEach(s => {
        try {
          const parsed: string[] = JSON.parse(s.tags);
          parsed.forEach(t => tagSet.add(t));
        } catch {}
      });
      return Array.from(tagSet).sort();
    },
  };
}
