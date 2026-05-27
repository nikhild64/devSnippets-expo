import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { APP_DIRECTORIES } from "../constants";
import { useTheme } from "../context/ThemeContext";
import {
    exportSnippet,
    saveToPhone,
    shareSnippet,
} from "../services/exportService";
import { ensureDirectoryExists, listFiles } from "../services/fileService";
import { ExportFormat, FileItem, Snippet } from "../types";

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  snippet: Snippet;
}

export function ExportModal({ visible, onClose, snippet }: ExportModalProps) {
  const { isDark } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("txt");
  const [status, setStatus] = useState<string>("");
  const [savedPath, setSavedPath] = useState<string>("");

  // Folder picker state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
  const [pickerPath, setPickerPath] = useState(basePath);
  const [pickerFolders, setPickerFolders] = useState<FileItem[]>([]);

  const loadPickerFolders = async (path: string) => {
    await ensureDirectoryExists(path);
    const items = await listFiles(path);
    setPickerFolders(items.filter((i) => i.isDirectory));
  };

  const openFolderPicker = async () => {
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

  const handleExportToFolder = async () => {
    try {
      setShowFolderPicker(false);
      setStatus("Saving...");
      const path = await exportSnippet(snippet, selectedFormat, pickerPath);
      const displayPath = path.replace(FileSystem.documentDirectory || "", "");
      setSavedPath(displayPath);
      setStatus("");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const formats: {
    value: ExportFormat;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { value: "txt", label: "Text (.txt)", icon: "document-text-outline" },
    { value: "js", label: "Code File", icon: "code-slash-outline" },
    { value: "json", label: "JSON (.json)", icon: "code-slash-outline" },
  ];

  const handleSaveToPhone = async () => {
    try {
      setStatus("Saving...");
      setSavedPath("");
      const fileName = await saveToPhone(snippet, selectedFormat);
      setSavedPath(fileName);
      setStatus("");
    } catch (e: any) {
      if (e.message === "Storage permission not granted") {
        setStatus("");
      } else {
        setStatus(`Error: ${e.message}`);
      }
    }
  };

  const handleShare = async () => {
    try {
      setStatus("Preparing...");
      setSavedPath("");
      await shareSnippet(snippet, selectedFormat);
      setStatus("");
      onClose();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleClose = () => {
    setSavedPath("");
    setStatus("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.modal, isDark ? styles.modalDark : styles.modalLight]}
        >
          <View style={styles.header}>
            <Text
              style={[styles.title, { color: isDark ? "#f9fafb" : "#111827" }]}
            >
              Export Snippet
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.subtitle, { color: isDark ? "#9ca3af" : "#6b7280" }]}
          >
            Choose export format:
          </Text>

          <View style={styles.formats}>
            {formats.map((format) => (
              <TouchableOpacity
                key={format.value}
                style={[
                  styles.formatOption,
                  isDark ? styles.formatOptionDark : styles.formatOptionLight,
                  selectedFormat === format.value && styles.formatSelected,
                ]}
                onPress={() => setSelectedFormat(format.value)}
              >
                <Ionicons
                  name={format.icon}
                  size={20}
                  color={
                    selectedFormat === format.value
                      ? "#3b82f6"
                      : isDark
                        ? "#9ca3af"
                        : "#6b7280"
                  }
                />
                <Text
                  style={[
                    styles.formatLabel,
                    {
                      color:
                        selectedFormat === format.value
                          ? "#3b82f6"
                          : isDark
                            ? "#d1d5db"
                            : "#374151",
                    },
                  ]}
                >
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {status ? (
            <Text
              style={[
                styles.status,
                { color: status.startsWith("Error") ? "#ef4444" : "#10b981" },
              ]}
            >
              {status}
            </Text>
          ) : null}

          {savedPath ? (
            <View
              style={[
                styles.savedPathBox,
                {
                  backgroundColor: isDark ? "#022c22" : "#f0fdf4",
                  borderColor: isDark ? "#065f46" : "#bbf7d0",
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#10b981", fontSize: 13, fontWeight: "600" }}
                >
                  Saved successfully!
                </Text>
                <Text
                  style={{
                    color: isDark ? "#6ee7b7" : "#047857",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                  selectable
                >
                  📁 {savedPath}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.exportButton]}
              onPress={handleSaveToPhone}
            >
              <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Save to Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#f59e0b" }]}
              onPress={openFolderPicker}
            >
              <Ionicons name="folder-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Save to Folder</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.shareFullButton, { backgroundColor: "#8b5cf6" }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Share with Apps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Folder Picker Modal */}
      <Modal
        visible={showFolderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderPicker(false)}
      >
        <View style={styles.overlay}>
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
              Choose Folder
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
                  style={{ marginRight: 6 }}
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
                  style={{
                    color: isDark ? "#6b7280" : "#9ca3af",
                    textAlign: "center",
                    paddingVertical: 20,
                    fontSize: 13,
                  }}
                >
                  No subfolders — save here or go back
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
                style={[styles.pickerButton, { backgroundColor: "#f59e0b" }]}
                onPress={handleExportToFolder}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Save Here
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalDark: { backgroundColor: "#1f2937" },
  modalLight: { backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14, marginBottom: 12 },
  formats: { gap: 8, marginBottom: 16 },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  formatOptionDark: { borderColor: "#374151", backgroundColor: "#111827" },
  formatOptionLight: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  formatSelected: { borderColor: "#3b82f6", borderWidth: 2 },
  formatLabel: { fontSize: 15, fontWeight: "500" },
  status: { textAlign: "center", marginBottom: 12, fontSize: 13 },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  exportButton: { backgroundColor: "#3b82f6" },
  shareFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  savedPathBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  pickerModal: {
    width: "100%",
    maxHeight: "65%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  pickerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  pickerBreadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  pickerBreadcrumbText: { fontSize: 13, fontWeight: "500", flex: 1 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerRowText: { fontSize: 15, flex: 1 },
  pickerActions: { flexDirection: "row", gap: 12, marginTop: 14 },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
