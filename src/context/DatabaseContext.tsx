import React, { createContext, useContext, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { createSnippetRepository } from '../database/snippetRepository';

type SnippetRepository = ReturnType<typeof createSnippetRepository>;

const DatabaseContext = createContext<SnippetRepository | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const repository = useMemo(() => createSnippetRepository(db), [db]);

  return (
    <DatabaseContext.Provider value={repository}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): SnippetRepository {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
