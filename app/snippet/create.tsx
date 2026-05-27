import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  APP_DIRECTORIES,
  LANGUAGES,
  LANGUAGE_EXTENSIONS,
} from "../../src/constants";
import { useDatabase } from "../../src/context/DatabaseContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  createDirectory,
  ensureDirectoryExists,
  listFiles,
  saveAttachment,
} from "../../src/services/fileService";
import { FileItem } from "../../src/types";

export default function CreateSnippetScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { isDark } = useTheme();
  const { folder } = useLocalSearchParams<{ folder?: string }>();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tagsInput, setTagsInput] = useState("");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenshots, setScreenshots] = useState<
    { uri: string; name: string }[]
  >([]);

  // Folder picker state
  const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
  const [selectedFolder, setSelectedFolder] = useState<string | null>(
    folder || null,
  );
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pickerPath, setPickerPath] = useState(basePath);
  const [pickerFolders, setPickerFolders] = useState<FileItem[]>([]);

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newShots = result.assets.map((asset, i) => ({
        uri: asset.uri,
        name: `screenshot_${Date.now()}_${i}.jpg`,
      }));
      setScreenshots((prev) => [...prev, ...newShots]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to take photos.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setScreenshots((prev) => [
        ...prev,
        { uri: asset.uri, name: `photo_${Date.now()}.jpg` },
      ]);
    }
  };

  const handleAttachScreenshot = () => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  // Folder picker helpers
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

  const navigatePickerFolder = async (f: FileItem) => {
    const newPath = f.path + "/";
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

  const confirmFolderSelection = () => {
    setSelectedFolder(pickerPath);
    setShowFolderPicker(false);
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

  const getFolderDisplayName = (path: string) => {
    const relative = path.replace(basePath, "").replace(/\/$/, "");
    return relative || "Files (root)";
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!code.trim()) {
      Alert.alert("Error", "Please enter code content");
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const snippetId = await db.create({
        title: title.trim(),
        code: code.trim(),
        language,
        tags,
        folder_path: selectedFolder || null,
      });

      // Save attached screenshots
      for (const shot of screenshots) {
        const savedPath = await saveAttachment(snippetId, shot.uri, shot.name);
        await db.addAttachment(snippetId, savedPath, shot.name, "image");
      }

      // Auto-export snippet file to linked folder
      if (selectedFolder) {
        const ext = LANGUAGE_EXTENSIONS[language] || ".txt";
        const safeName = title.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
        const filePath = `${selectedFolder}${safeName}${ext}`;
        await FileSystem.writeAsStringAsync(filePath, code.trim(), {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      router.back();
    } catch (e: any) {
      Alert.alert("Error", "Failed to save snippet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
        ]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Save to Folder */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Save to Folder
        </Text>
        {selectedFolder ? (
          <View
            style={[
              styles.folderBanner,
              { backgroundColor: isDark ? "#1e3a5f" : "#dbeafe" },
            ]}
          >
            <Ionicons name="folder" size={16} color="#3b82f6" />
            <Text
              style={[
                styles.folderBannerText,
                { color: isDark ? "#93c5fd" : "#1d4ed8" },
              ]}
              numberOfLines={1}
            >
              {getFolderDisplayName(selectedFolder)}
            </Text>
            {!folder && (
              <TouchableOpacity onPress={() => setSelectedFolder(null)}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDark ? "#6b7280" : "#9ca3af"}
                />
              </TouchableOpacity>
            )}
            {!folder && (
              <TouchableOpacity onPress={openFolderPicker}>
                <Ionicons name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.attachButton,
              {
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                borderColor: isDark ? "#374151" : "#e5e7eb",
              },
            ]}
            onPress={openFolderPicker}
          >
            <Ionicons name="folder-outline" size={20} color="#f59e0b" />
            <Text style={{ color: "#f59e0b", fontSize: 14, fontWeight: "500" }}>
              Choose Folder
            </Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Title
        </Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., React useEffect cleanup"
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
        />

        {/* Language */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Language
        </Text>
        <TouchableOpacity
          style={[
            styles.input,
            isDark ? styles.inputDark : styles.inputLight,
            styles.picker,
          ]}
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
        >
          <Text style={{ color: isDark ? "#f9fafb" : "#111827", fontSize: 15 }}>
            {language}
          </Text>
          <Ionicons
            name={showLanguagePicker ? "chevron-up" : "chevron-down"}
            size={18}
            color={isDark ? "#6b7280" : "#9ca3af"}
          />
        </TouchableOpacity>

        {showLanguagePicker && (
          <View
            style={[
              styles.languageList,
              isDark ? styles.inputDark : styles.inputLight,
            ]}
          >
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageItem,
                    language === lang && styles.languageItemActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      {
                        color:
                          language === lang
                            ? "#3b82f6"
                            : isDark
                              ? "#d1d5db"
                              : "#374151",
                      },
                    ]}
                  >
                    {lang}
                  </Text>
                  {language === lang && (
                    <Ionicons name="checkmark" size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Code */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Code
        </Text>
        <TextInput
          style={[
            styles.codeInput,
            isDark ? styles.codeInputDark : styles.codeInputLight,
          ]}
          value={code}
          onChangeText={setCode}
          placeholder="Paste or type your code here..."
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Tags */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Tags (comma-separated)
        </Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="e.g., react, hooks, cleanup"
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          autoCapitalize="none"
        />

        {/* Screenshots */}
        <Text style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>
          Screenshots
        </Text>
        <TouchableOpacity
          style={[
            styles.attachButton,
            {
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e5e7eb",
            },
          ]}
          onPress={handleAttachScreenshot}
        >
          <Ionicons name="image-outline" size={20} color="#3b82f6" />
          <Text style={{ color: "#3b82f6", fontSize: 14, fontWeight: "500" }}>
            Attach Screenshots
          </Text>
        </TouchableOpacity>
        {screenshots.length > 0 && (
          <View style={styles.screenshotList}>
            {screenshots.map((shot, index) => (
              <View
                key={index}
                style={[
                  styles.screenshotItem,
                  { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
                ]}
              >
                <Image
                  source={{ uri: shot.uri }}
                  style={styles.screenshotThumb}
                />
                <Text
                  style={[
                    styles.screenshotName,
                    { color: isDark ? "#d1d5db" : "#374151" },
                  ]}
                  numberOfLines={1}
                >
                  {shot.name}
                </Text>
                <TouchableOpacity onPress={() => removeScreenshot(index)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Snippet"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Folder Picker Modal */}
      <Modal
        visible={showFolderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderPicker(false)}
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
                styles.pickerTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              Select Folder
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
                onPress={confirmFolderSelection}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Select This Folder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  folderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  folderBannerText: { fontSize: 13, fontWeight: "500", flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    color: "#f9fafb",
  },
  inputLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageItemActive: { backgroundColor: "rgba(59, 130, 246, 0.1)" },
  languageItemText: { fontSize: 14 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "monospace",
    minHeight: 200,
    lineHeight: 20,
  },
  codeInputDark: {
    backgroundColor: "#0d1117",
    borderColor: "#30363d",
    color: "#e6edf3",
  },
  codeInputLight: {
    backgroundColor: "#f6f8fa",
    borderColor: "#d0d7de",
    color: "#24292f",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  screenshotList: { marginTop: 8, gap: 6 },
  screenshotItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 10,
  },
  screenshotThumb: { width: 40, height: 40, borderRadius: 6 },
  screenshotName: { flex: 1, fontSize: 13 },
  modalOverlay: {
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
  pickerRowText: {
    flex: 1,
    fontSize: 14,
  },
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
