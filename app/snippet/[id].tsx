import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CodeBlock } from "../../src/components/CodeBlock";
import { ExportModal } from "../../src/components/ExportModal";
import { LANGUAGES } from "../../src/constants";
import { useDatabase } from "../../src/context/DatabaseContext";
import { useTheme } from "../../src/context/ThemeContext";
import { deleteItem, saveAttachment } from "../../src/services/fileService";
import { Attachment, Snippet } from "../../src/types";

export default function SnippetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const { isDark } = useTheme();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadSnippet();
  }, [id]);

  const loadSnippet = async () => {
    if (!id) return;
    const result = await db.getById(Number(id));
    if (result) {
      setSnippet(result);
      setEditTitle(result.title);
      setEditCode(result.code);
      setEditLanguage(result.language);
      const parsedTags: string[] = JSON.parse(result.tags || "[]");
      setEditTagsInput(parsedTags.join(", "));
      const atts = await db.getAttachments(Number(id));
      setAttachments(atts);
    }
  };

  const handleSaveEdit = async () => {
    if (!snippet) return;
    const tags = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await db.update(snippet.id, {
      title: editTitle.trim(),
      code: editCode.trim(),
      language: editLanguage,
      tags,
    });
    setIsEditing(false);
    setShowLanguagePicker(false);
    loadSnippet();
  };

  const handleDelete = () => {
    Alert.alert("Delete Snippet", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (snippet) {
            await db.delete(snippet.id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleToggleFavorite = async () => {
    if (!snippet) return;
    await db.toggleFavorite(snippet.id);
    loadSnippet();
  };

  const pickFromLibrary = async () => {
    if (!snippet) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = `screenshot_${Date.now()}.jpg`;
      const savedPath = await saveAttachment(snippet.id, asset.uri, fileName);
      await db.addAttachment(snippet.id, savedPath, fileName, "image");
      loadSnippet();
    }
  };

  const takePhoto = async () => {
    if (!snippet) return;
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
      const fileName = `photo_${Date.now()}.jpg`;
      const savedPath = await saveAttachment(snippet.id, asset.uri, fileName);
      await db.addAttachment(snippet.id, savedPath, fileName, "image");
      loadSnippet();
    }
  };

  const handleAttachScreenshot = () => {
    if (!snippet) return;
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDeleteAttachment = (att: Attachment) => {
    Alert.alert("Delete Attachment", `Remove "${att.file_name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(att.file_path);
          await db.deleteAttachment(att.id);
          loadSnippet();
        },
      },
    ]);
  };

  if (!snippet) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
        ]}
      >
        <Text style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>
          Loading...
        </Text>
      </View>
    );
  }

  const tags: string[] = JSON.parse(snippet.tags || "[]");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {isEditing ? (
            <TextInput
              style={[
                styles.titleInput,
                isDark ? styles.inputDark : styles.inputLight,
              ]}
              value={editTitle}
              onChangeText={setEditTitle}
            />
          ) : (
            <Text
              style={[styles.title, { color: isDark ? "#f9fafb" : "#111827" }]}
            >
              {snippet.title}
            </Text>
          )}
        </View>

        {/* Meta */}
        {isEditing ? (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={[
                styles.editLabel,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              Language
            </Text>
            <TouchableOpacity
              style={[
                styles.languagePickerBtn,
                isDark ? styles.inputDark : styles.inputLight,
              ]}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            >
              <Text
                style={{ color: isDark ? "#f9fafb" : "#111827", fontSize: 14 }}
              >
                {editLanguage}
              </Text>
              <Ionicons
                name={showLanguagePicker ? "chevron-up" : "chevron-down"}
                size={16}
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
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.languageItem,
                        editLanguage === lang && styles.languageItemActive,
                      ]}
                      onPress={() => {
                        setEditLanguage(lang);
                        setShowLanguagePicker(false);
                      }}
                    >
                      <Text
                        style={{
                          color:
                            editLanguage === lang
                              ? "#3b82f6"
                              : isDark
                                ? "#d1d5db"
                                : "#374151",
                          fontSize: 13,
                        }}
                      >
                        {lang}
                      </Text>
                      {editLanguage === lang && (
                        <Ionicons name="checkmark" size={16} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text
              style={[
                styles.editLabel,
                { color: isDark ? "#9ca3af" : "#6b7280", marginTop: 10 },
              ]}
            >
              Tags (comma-separated)
            </Text>
            <TextInput
              style={[
                styles.tagsInput,
                isDark ? styles.inputDark : styles.inputLight,
              ]}
              value={editTagsInput}
              onChangeText={setEditTagsInput}
              placeholder="e.g., react, hooks, cleanup"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              autoCapitalize="none"
            />
          </View>
        ) : (
          <View style={styles.meta}>
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? "#1e3a5f" : "#dbeafe" },
              ]}
            >
              <Text
                style={{
                  color: isDark ? "#93c5fd" : "#1d4ed8",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {snippet.language}
              </Text>
            </View>
            {snippet.folder_path ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? "#3b2e1a" : "#fef3c7",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  },
                ]}
              >
                <Ionicons name="folder" size={12} color="#f59e0b" />
                <Text
                  style={{
                    color: isDark ? "#fbbf24" : "#b45309",
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                  numberOfLines={1}
                >
                  {snippet.folder_path.replace(/\/$/, "").split("/").pop() ||
                    "Files"}
                </Text>
              </View>
            ) : null}
            {tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: isDark ? "#1f2937" : "#f3f4f6" },
                ]}
              >
                <Text
                  style={{
                    color: isDark ? "#9ca3af" : "#4b5563",
                    fontSize: 12,
                  }}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={snippet.is_favorite ? "star" : "star-outline"}
              size={18}
              color="#f59e0b"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name={isEditing ? "close" : "pencil"}
              size={18}
              color="#3b82f6"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={() =>
              router.push({
                pathname: "/snippet/explain",
                params: {
                  code: snippet.code,
                  language: snippet.language,
                  title: snippet.title,
                },
              })
            }
          >
            <Ionicons name="bulb" size={18} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={() => setShowExport(true)}
          >
            <Ionicons name="share-outline" size={18} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={handleAttachScreenshot}
          >
            <Ionicons name="image-outline" size={18} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Code */}
        {isEditing ? (
          <TextInput
            style={[
              styles.codeEdit,
              isDark ? styles.codeEditDark : styles.codeEditLight,
            ]}
            value={editCode}
            onChangeText={setEditCode}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <CodeBlock code={snippet.code} language={snippet.language} />
        )}

        {/* Save Edit Button */}
        {isEditing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
            <Ionicons name="save" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <View style={styles.attachments}>
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              Attachments ({attachments.length})
            </Text>
            {attachments.map((att) => (
              <View
                key={att.id}
                style={[
                  styles.attachmentCard,
                  { backgroundColor: isDark ? "#1f2937" : "#fff" },
                ]}
              >
                {att.file_type === "image" && (
                  <Image
                    source={{ uri: att.file_path }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.attachmentInfo}>
                  <Ionicons name="image" size={16} color="#60a5fa" />
                  <Text
                    style={[
                      styles.attachmentName,
                      { color: isDark ? "#d1d5db" : "#374151" },
                    ]}
                    numberOfLines={1}
                  >
                    {att.file_name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.attachmentDelete}
                  onPress={() => handleDeleteAttachment(att)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestamps}>
          <Text
            style={[
              styles.timestamp,
              { color: isDark ? "#4b5563" : "#9ca3af" },
            ]}
          >
            Created: {snippet.created_at}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: isDark ? "#4b5563" : "#9ca3af" },
            ]}
          >
            Updated: {snippet.updated_at}
          </Text>
        </View>
      </ScrollView>

      {snippet && (
        <ExportModal
          visible={showExport}
          onClose={() => setShowExport(false)}
          snippet={snippet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.2)",
  },
  codeEdit: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    fontFamily: "monospace",
    minHeight: 200,
    lineHeight: 20,
  },
  codeEditDark: {
    backgroundColor: "#0d1117",
    borderColor: "#30363d",
    color: "#e6edf3",
  },
  codeEditLight: {
    backgroundColor: "#f6f8fa",
    borderColor: "#d0d7de",
    color: "#24292f",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  attachments: { marginTop: 20 },
  attachmentCard: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.2)",
  },
  attachmentImage: {
    width: "100%",
    height: 180,
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  attachmentName: { fontSize: 13, flex: 1 },
  attachmentDelete: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  editLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  languagePickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    paddingVertical: 8,
  },
  languageItemActive: { backgroundColor: "rgba(59, 130, 246, 0.1)" },
  tagsInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  timestamps: { marginTop: 20, gap: 4 },
  timestamp: { fontSize: 12 },
});
