import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { SearchBar } from "../../src/components/SearchBar";
import { SnippetCard } from "../../src/components/SnippetCard";
import { STORAGE_KEYS } from "../../src/constants";
import { useDatabase } from "../../src/context/DatabaseContext";
import { useTheme } from "../../src/context/ThemeContext";
import { Snippet } from "../../src/types";

export default function HomeScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { isDark } = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSnippets = useCallback(async () => {
    try {
      if (searchQuery.trim()) {
        const results = await db.search(searchQuery);
        setSnippets(results);
      } else {
        const sortOrder =
          (await AsyncStorage.getItem(STORAGE_KEYS.SORT_ORDER)) ||
          "updated_at DESC";
        const results = await db.getAll(sortOrder);
        setSnippets(results);
      }
    } catch (e) {
      console.error("Failed to load snippets:", e);
    } finally {
      setLoading(false);
    }
  }, [db, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadSnippets();
    }, [loadSnippets]),
  );

  const handleToggleFavorite = async (id: number) => {
    await db.toggleFavorite(id);
    loadSnippets();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
      ]}
    >
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

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
          !loading ? (
            <EmptyState
              icon="code-slash-outline"
              title={searchQuery ? "No Results" : "No Snippets Yet"}
              message={
                searchQuery
                  ? "Try a different search term"
                  : "Tap the + button to create your first code snippet"
              }
            />
          ) : null
        }
        contentContainerStyle={
          snippets.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/snippet/create")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 80 },
  emptyList: { flex: 1 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
