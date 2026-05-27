import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { FileItemRow } from "../../src/components/FileItemRow";
import { APP_DIRECTORIES } from "../../src/constants";
import { useDatabase } from "../../src/context/DatabaseContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  copyItem,
  createDirectory,
  deleteItem,
  downloadFile,
  initAppDirectories,
  listFiles,
  moveItem,
} from "../../src/services/fileService";
import { FileItem } from "../../src/types";

export default function FilesScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(
    `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`,
  );
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Action sheet state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);

  // Move/Copy picker state
  const [showMoveCopyPicker, setShowMoveCopyPicker] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<"move" | "copy">("move");
  const [pickerPath, setPickerPath] = useState("");
  const [pickerFolders, setPickerFolders] = useState<FileItem[]>([]);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFilename, setDownloadFilename] = useState("");
  const [downloading, setDownloading] = useState(false);

  // FAB menu state
  const [showFabMenu, setShowFabMenu] = useState(false);

  const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;

  const loadFiles = useCallback(async () => {
    await initAppDirectories();
    const items = await listFiles(currentPath);
    setFiles(items);
  }, [currentPath]);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [loadFiles]),
  );

  const navigateToFolder = async (item: FileItem) => {
    if (item.isDirectory) {
      setCurrentPath(item.path + "/");
    } else {
      // Try to find a snippet linked to this folder
      const folderPath = currentPath;
      const snippet = await db.getByFolderPath(folderPath);
      if (snippet) {
        router.push(`/snippet/${snippet.id}`);
      } else {
        Alert.alert(
          "No Linked Snippet",
          "This file is not linked to a snippet.",
        );
      }
    }
  };

  const navigateUp = () => {
    if (currentPath === basePath) return;
    const parts = currentPath.replace(/\/$/, "").split("/");
    parts.pop();
    setCurrentPath(parts.join("/") + "/");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createDirectory(`${currentPath}${newFolderName.trim()}`);
    setNewFolderName("");
    setShowNewFolderModal(false);
    loadFiles();
  };

  // Long-press opens action sheet
  const handleLongPress = (item: FileItem) => {
    setSelectedItem(item);
    setShowActionSheet(true);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    setShowActionSheet(false);
    Alert.alert(
      "Delete",
      `Are you sure you want to delete "${selectedItem.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteItem(selectedItem.path);
            loadFiles();
          },
        },
      ],
    );
  };

  // Move/Copy flow
  const openMoveCopyPicker = async (mode: "move" | "copy") => {
    setMoveCopyMode(mode);
    setShowActionSheet(false);
    setPickerPath(basePath);
    const items = await listFiles(basePath);
    setPickerFolders(items.filter((i) => i.isDirectory));
    setShowMoveCopyPicker(true);
  };

  const navigatePickerFolder = async (folder: FileItem) => {
    const newPath = folder.path + "/";
    setPickerPath(newPath);
    const items = await listFiles(newPath);
    setPickerFolders(items.filter((i) => i.isDirectory));
  };

  const navigatePickerUp = async () => {
    if (pickerPath === basePath) return;
    const parts = pickerPath.replace(/\/$/, "").split("/");
    parts.pop();
    const newPath = parts.join("/") + "/";
    setPickerPath(newPath);
    const items = await listFiles(newPath);
    setPickerFolders(items.filter((i) => i.isDirectory));
  };

  const confirmMoveCopy = async () => {
    if (!selectedItem) return;
    const destination = `${pickerPath}${selectedItem.name}`;
    try {
      if (moveCopyMode === "move") {
        await moveItem(selectedItem.path, destination);
      } else {
        await copyItem(selectedItem.path, destination);
      }
      setShowMoveCopyPicker(false);
      setSelectedItem(null);
      loadFiles();
      Alert.alert(
        "Success",
        `File ${moveCopyMode === "move" ? "moved" : "copied"} successfully.`,
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || `Failed to ${moveCopyMode} file.`);
    }
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
    const newPath = `${pickerPath}${pickerNewFolderName.trim()}`;
    await createDirectory(newPath);
    setPickerNewFolderName("");
    setShowPickerNewFolder(false);
    const items = await listFiles(pickerPath);
    setPickerFolders(items.filter((i) => i.isDirectory));
  };

  // Import file flow
  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const fileName = asset.name || `import_${Date.now()}`;
        const destination = `${currentPath}${fileName}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destination });
        loadFiles();
        Alert.alert("Success", `Imported "${fileName}" successfully.`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to import file.");
    }
  };

  // Download flow
  const handleDownload = async () => {
    if (!downloadUrl.trim()) {
      Alert.alert("Error", "Please enter a URL.");
      return;
    }
    const filename =
      downloadFilename.trim() ||
      downloadUrl.trim().split("/").pop() ||
      `download_${Date.now()}`;
    setDownloading(true);
    try {
      await downloadFile(downloadUrl.trim(), filename, currentPath);
      setShowDownloadModal(false);
      setDownloadUrl("");
      setDownloadFilename("");
      loadFiles();
      Alert.alert("Success", `Downloaded "${filename}" successfully.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const isAtRoot = currentPath === basePath;

  const getBreadcrumb = () => {
    const relative = currentPath.replace(basePath, "");
    if (!relative) return "Files";
    return `Files/${relative.replace(/\/$/, "")}`;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
      ]}
    >
      {/* Breadcrumb */}
      <View
        style={[
          styles.breadcrumb,
          {
            backgroundColor: isDark ? "#111827" : "#ffffff",
            borderBottomColor: isDark ? "#1f2937" : "#e5e7eb",
          },
        ]}
      >
        {!isAtRoot && (
          <TouchableOpacity onPress={navigateUp} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
        <Ionicons
          name="folder-open"
          size={18}
          color={isDark ? "#6b7280" : "#9ca3af"}
        />
        <Text
          style={[
            styles.breadcrumbText,
            { color: isDark ? "#d1d5db" : "#374151" },
          ]}
          numberOfLines={1}
        >
          {getBreadcrumb()}
        </Text>
        <TouchableOpacity
          onPress={() => setShowDownloadModal(true)}
          style={styles.downloadBtn}
        >
          <Ionicons name="cloud-download-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => (
          <FileItemRow
            item={item}
            onPress={() => navigateToFolder(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="Empty Folder"
            message="Create folders to organize your files. Long-press items for options."
          />
        }
        contentContainerStyle={
          files.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB Menu */}
      {showFabMenu && (
        <>
          <TouchableOpacity
            style={styles.fabOverlay}
            activeOpacity={1}
            onPress={() => setShowFabMenu(false)}
          />
          <View style={styles.fabMenuContainer}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                setShowNewFolderModal(true);
              }}
            >
              <View
                style={[styles.fabMenuIcon, { backgroundColor: "#f59e0b" }]}
              >
                <Ionicons name="folder" size={18} color="#fff" />
              </View>
              <Text
                style={[
                  styles.fabMenuLabel,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                New Folder
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push({
                  pathname: "/snippet/create",
                  params: { folder: currentPath },
                });
              }}
            >
              <View
                style={[styles.fabMenuIcon, { backgroundColor: "#10b981" }]}
              >
                <Ionicons name="code-slash" size={18} color="#fff" />
              </View>
              <Text
                style={[
                  styles.fabMenuLabel,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                Create Snippet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                handleImportFile();
              }}
            >
              <View
                style={[styles.fabMenuIcon, { backgroundColor: "#8b5cf6" }]}
              >
                <Ionicons name="push" size={18} color="#fff" />
              </View>
              <Text
                style={[
                  styles.fabMenuLabel,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                Import File
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                setShowDownloadModal(true);
              }}
            >
              <View
                style={[styles.fabMenuIcon, { backgroundColor: "#3b82f6" }]}
              >
                <Ionicons name="cloud-download" size={18} color="#fff" />
              </View>
              <Text
                style={[
                  styles.fabMenuLabel,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                Download URL
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowFabMenu(!showFabMenu)}
        activeOpacity={0.8}
      >
        <Ionicons name={showFabMenu ? "close" : "add"} size={28} color="#fff" />
      </TouchableOpacity>

      {/* New Folder Modal */}
      <Modal
        visible={showNewFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              New Folder
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: isDark ? "#f9fafb" : "#111827",
                  backgroundColor: isDark ? "#111827" : "#f9fafb",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                },
              ]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: isDark ? "#374151" : "#e5e7eb" },
                ]}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName("");
                }}
              >
                <Text style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#3b82f6" }]}
                onPress={handleCreateFolder}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              {selectedItem?.name}
            </Text>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openMoveCopyPicker("move")}
            >
              <Ionicons
                name="arrow-forward-circle-outline"
                size={22}
                color="#3b82f6"
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
              >
                Move to...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openMoveCopyPicker("copy")}
            >
              <Ionicons name="copy-outline" size={22} color="#10b981" />
              <Text
                style={[
                  styles.sheetOptionText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
              >
                Copy to...
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
                style={[
                  styles.sheetCancelText,
                  { color: isDark ? "#d1d5db" : "#374151" },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Move/Copy Folder Picker Modal */}
      <Modal
        visible={showMoveCopyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoveCopyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModal,
              { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              {moveCopyMode === "move" ? "Move" : "Copy"} to...
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
                  style={styles.backButton}
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
              style={styles.pickerList}
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
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: isDark ? "#374151" : "#e5e7eb" },
                ]}
                onPress={() => setShowMoveCopyPicker(false)}
              >
                <Text style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      moveCopyMode === "move" ? "#3b82f6" : "#10b981",
                  },
                ]}
                onPress={confirmMoveCopy}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {moveCopyMode === "move" ? "Move Here" : "Copy Here"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download Modal */}
      <Modal
        visible={showDownloadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              Download File
            </Text>
            <Text
              style={[
                styles.modalLabel,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              URL
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: isDark ? "#f9fafb" : "#111827",
                  backgroundColor: isDark ? "#111827" : "#f9fafb",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                },
              ]}
              value={downloadUrl}
              onChangeText={setDownloadUrl}
              placeholder="https://example.com/file.txt"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text
              style={[
                styles.modalLabel,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              Filename (optional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: isDark ? "#f9fafb" : "#111827",
                  backgroundColor: isDark ? "#111827" : "#f9fafb",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                },
              ]}
              value={downloadFilename}
              onChangeText={setDownloadFilename}
              placeholder="Auto-detect from URL"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: isDark ? "#374151" : "#e5e7eb" },
                ]}
                onPress={() => {
                  setShowDownloadModal(false);
                  setDownloadUrl("");
                  setDownloadFilename("");
                }}
              >
                <Text style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#3b82f6" }]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Download
                  </Text>
                )}
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
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 4 },
  breadcrumbText: { fontSize: 14, fontWeight: "500", flex: 1 },
  downloadBtn: { padding: 4 },
  list: { paddingTop: 8, paddingBottom: 80 },
  emptyList: { flex: 1 },
  fabOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  fabMenuContainer: {
    position: "absolute",
    right: 20,
    bottom: 86,
    alignItems: "flex-end",
    gap: 10,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabMenuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  fabMenuLabel: {
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  // Action Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
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
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetCancelText: { fontSize: 16, fontWeight: "600" },
  // Move/Copy Picker
  pickerModal: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 16,
    padding: 24,
  },
  pickerBreadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  pickerBreadcrumbText: { fontSize: 13, fontWeight: "500", flex: 1 },
  pickerList: { maxHeight: 250 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerRowText: { fontSize: 15, flex: 1 },
  pickerEmpty: { fontSize: 13, textAlign: "center", paddingVertical: 20 },
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
