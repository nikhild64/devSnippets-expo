import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/context/DatabaseContext';
import { useTheme } from '../../src/context/ThemeContext';
import { LANGUAGES } from '../../src/constants';

export default function CreateSnippetScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tagsInput, setTagsInput] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter code content');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await db.create({
        title: title.trim(),
        code: code.trim(),
        language,
        tags,
      });

      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save snippet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#030712' : '#f3f4f6' }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>Title</Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., React useEffect cleanup"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        />

        {/* Language */}
        <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>Language</Text>
        <TouchableOpacity
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight, styles.picker]}
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
        >
          <Text style={{ color: isDark ? '#f9fafb' : '#111827', fontSize: 15 }}>{language}</Text>
          <Ionicons
            name={showLanguagePicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={isDark ? '#6b7280' : '#9ca3af'}
          />
        </TouchableOpacity>

        {showLanguagePicker && (
          <View style={[styles.languageList, isDark ? styles.inputDark : styles.inputLight]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.languageItem, language === lang && styles.languageItemActive]}
                  onPress={() => { setLanguage(lang); setShowLanguagePicker(false); }}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      { color: language === lang ? '#3b82f6' : isDark ? '#d1d5db' : '#374151' },
                    ]}
                  >
                    {lang}
                  </Text>
                  {language === lang && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Code */}
        <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>Code</Text>
        <TextInput
          style={[styles.codeInput, isDark ? styles.codeInputDark : styles.codeInputLight]}
          value={code}
          onChangeText={setCode}
          placeholder="Paste or type your code here..."
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Tags */}
        <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>
          Tags (comma-separated)
        </Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="e.g., react, hooks, cleanup"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          autoCapitalize="none"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Snippet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' },
  inputLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  languageList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageItemActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  languageItemText: { fontSize: 14 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 200,
    lineHeight: 20,
  },
  codeInputDark: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#e6edf3' },
  codeInputLight: { backgroundColor: '#f6f8fa', borderColor: '#d0d7de', color: '#24292f' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
