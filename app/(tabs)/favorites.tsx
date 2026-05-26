import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabase } from '../../src/context/DatabaseContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Snippet } from '../../src/types';
import { SnippetCard } from '../../src/components/SnippetCard';
import { EmptyState } from '../../src/components/EmptyState';

export default function FavoritesScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { isDark } = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  const loadFavorites = useCallback(async () => {
    const results = await db.getFavorites();
    setSnippets(results);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleToggleFavorite = async (id: number) => {
    await db.toggleFavorite(id);
    loadFavorites();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#030712' : '#f3f4f6' }]}>
      <FlatList
        data={snippets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="No Favorites"
            message="Star your most-used snippets to find them quickly here"
          />
        }
        contentContainerStyle={snippets.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: 8, paddingBottom: 20 },
  emptyList: { flex: 1 },
});
