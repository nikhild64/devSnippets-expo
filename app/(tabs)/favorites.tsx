import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { SnippetCard } from "../../src/components/SnippetCard";
import { APP_DIRECTORIES, LANGUAGE_EXTENSIONS } from "../../src/constants";
import { useDatabase } from "../../src/context/DatabaseContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
    createDirectory,
    ensureDirectoryExists,
    listFiles,
} from "../../src/services/fileService";
import { FileItem, Snippet } from "../../src/types";

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
    }, [loadFavorites]),
  );

  const handleToggleFavorite = async (id: number) => {
    await db.toggleFavorite(id);
    loadFavorites();
  };

  // Long-press action sheet state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  // Move to folder picker state
  const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pickerPath, setPickerPath] = useState(basePath);
  const [pickerFolders, setPickerFolders] = useState<FileItem[]>([]);

  const handleLongPress = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    setShowActionSheet(true);
  };

  const handleDelete = () => {
    if (!selectedSnippet) return;
    setShowActionSheet(false);
    Alert.alert(
      "Delete Snippet",
      `Are you sure you want to delete "${selectedSnippet.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await db.delete(selectedSnippet.id);
            loadFavorites();
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    if (!selectedSnippet) return;
    setShowActionSheet(false);
    router.push(`/snippet/${selectedSnippet.id}`);
  };

  const loadPickerFolders = async (path: string) => {
    await ensureDirectoryExists(path);
    const items = await listFiles(path);
    setPickerFolders(items.filter((i) => i.isDirectory));
  };

  const openMovePicker = async () => {
    setShowActionSheet(false);
    setPickerPath(basePath);
    await loadPickerFolders(basePath);
    setShowFolderPicker(true);
  };

  const navigatePickerFolder = async (folder: FileItem) => {
    const newPath = folder.path + "/";
    setPickerPath(newPath);
    await loadPickerFolders(newPath);
  };

  const navigatePickerUp = async () => {
    if (pickerPath === basePath) return;
    const parts = pickerPath.replace(/\/$/, "").split("/");
    parts.pop();
    const newPath = parts.join("/") + "/";
    setPickerPath(newPath);
    await loadPickerFolders(newPath);
  };

  const getPickerBreadcrumb = () => {
    const relative = pickerPath.replace(basePath, "");
    if (!relative) return "Files";
    return `Files/${relative.replace(/\/$/, "")}`;
  };

  // New folder inside picker
  const [showPickerNewFolder, setShowPickerNewFolder] = useState(false);
  const [pickerNewFolderName, setPickerNewFolderName] = useState("");

  const handleCreatePickerFolder = async () => {
    if (!pickerNewFolderName.trim()) return;
    await createDirectory(`${pickerPath}${pickerNewFolderName.trim()}`);
    setPickerNewFolderName("");
    setShowPickerNewFolder(false);
    await loadPickerFolders(pickerPath);
  };

  const confirmMove = async () => {
    if (!selectedSnippet) return;
    try {
      if (selectedSnippet.folder_path) {
        const ext = LANGUAGE_EXTENSIONS[selectedSnippet.language] || ".txt";
        const safeName = selectedSnippet.title.replace(/[^a-zA-Z0-9_-]/g, "_");
        const oldFilePath = `${selectedSnippet.folder_path}${safeName}${ext}`;
        const oldInfo = await FileSystem.getInfoAsync(oldFilePath);
        if (oldInfo.exists) {
          await FileSystem.deleteAsync(oldFilePath, { idempotent: true });
        }
      }
      const ext = LANGUAGE_EXTENSIONS[selectedSnippet.language] || ".txt";
      const safeName = selectedSnippet.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const newFilePath = `${pickerPath}${safeName}${ext}`;
      await FileSystem.writeAsStringAsync(newFilePath, selectedSnippet.code, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await db.update(selectedSnippet.id, { folder_path: pickerPath });
      setShowFolderPicker(false);
      setSelectedSnippet(null);
      loadFavorites();
      Alert.alert("Moved", `Snippet moved to ${getPickerBreadcrumb()}.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to move snippet.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
      ]}
    >
      <FlatList
        data={snippets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="No Favorites"
            message="Star your most-used snippets to find them quickly here"
          />
        }
        contentContainerStyle={
          snippets.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.sheetTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
              numberOfLines={1}
            >
              {selectedSnippet?.title}
            </Text>
            <TouchableOpacity style={styles.sheetOption} onPress={handleEdit}>
              <Ionicons name="create-outline" size={22} color="#3b82f6" />
              <Text
                style={[
                  styles.sheetOptionText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
              >
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={openMovePicker}
            >
              <Ionicons name="folder-outline" size={22} color="#f59e0b" />
              <Text
                style={[
                  styles.sheetOptionText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
              >
                Move to Folder...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.sheetOptionText, { color: "#ef4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetCancel,
                { backgroundColor: isDark ? "#374151" : "#f3f4f6" },
              ]}
              onPress={() => setShowActionSheet(false)}
            >
              <Text
                style={{
                  color: isDark ? "#d1d5db" : "#374151",
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Move to Folder Picker Modal */}
      <Modal
        visible={showFolderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View
            style={[
              styles.pickerModal,
              { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              Move to...
            </Text>
            <View
              style={[
                styles.pickerBreadcrumb,
                { borderBottomColor: isDark ? "#374151" : "#e5e7eb" },
              ]}
            >
              {pickerPath !== basePath && (
                <TouchableOpacity
                  onPress={navigatePickerUp}
                  style={{ marginRight: 8 }}
                >
                  <Ionicons name="arrow-back" size={18} color="#3b82f6" />
                </TouchableOpacity>
              )}
              <Ionicons
                name="folder-open"
                size={16}
                color={isDark ? "#6b7280" : "#9ca3af"}
              />
              <Text
                style={[
                  styles.pickerBreadcrumbText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
                numberOfLines={1}
              >
                {getPickerBreadcrumb()}
              </Text>
            </View>
            {/* New Folder inline */}
            {showPickerNewFolder ? (
              <View style={styles.pickerNewFolderRow}>
                <TextInput
                  style={[
                    styles.pickerNewFolderInput,
                    {
                      color: isDark ? "#f9fafb" : "#111827",
                      backgroundColor: isDark ? "#111827" : "#f9fafb",
                      borderColor: isDark ? "#374151" : "#e5e7eb",
                    },
                  ]}
                  value={pickerNewFolderName}
                  onChangeText={setPickerNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.pickerNewFolderBtn,
                    { backgroundColor: "#10b981" },
                  ]}
                  onPress={handleCreatePickerFolder}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerNewFolderBtn,
                    { backgroundColor: isDark ? "#374151" : "#e5e7eb" },
                  ]}
                  onPress={() => {
                    setShowPickerNewFolder(false);
                    setPickerNewFolderName("");
                  }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? "#d1d5db" : "#374151"}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickerNewFolderLink}
                onPress={() => setShowPickerNewFolder(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#3b82f6" />
                <Text
                  style={{ color: "#3b82f6", fontSize: 13, fontWeight: "500" }}
                >
                  New Folder
                </Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={pickerFolders}
              keyExtractor={(item) => item.path}
              style={{ maxHeight: 250 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerRow,
                    { borderBottomColor: isDark ? "#374151" : "#f3f4f6" },
                  ]}
                  onPress={() => navigatePickerFolder(item)}
                >
                  <Ionicons name="folder" size={20} color="#f59e0b" />
                  <Text
                    style={[
                      styles.pickerRowText,
                      { color: isDark ? "#d1d5db" : "#374151" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? "#4b5563" : "#d1d5db"}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.pickerEmpty,
                    { color: isDark ? "#6b7280" : "#9ca3af" },
                  ]}
                >
                  No subfolders
                </Text>
              }
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { backgroundColor: isDark ? "#374151" : "#e5e7eb" },
                ]}
                onPress={() => setShowFolderPicker(false)}
              >
                <Text style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: "#3b82f6" }]}
                onPress={confirmMove}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Move Here
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: 8, paddingBottom: 20 },
  emptyList: { flex: 1 },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 34,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  sheetOptionText: { fontSize: 16 },
  sheetCancel: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  pickerModal: {
    borderRadius: 14,
    padding: 20,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerBreadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  pickerBreadcrumbText: {
    fontSize: 13,
    flex: 1,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  pickerRowText: { flex: 1, fontSize: 14 },
  pickerEmpty: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 13,
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  pickerButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickerNewFolderLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 4,
  },
  pickerNewFolderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  pickerNewFolderInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  pickerNewFolderBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
