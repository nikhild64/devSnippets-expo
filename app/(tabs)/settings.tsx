import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { getApiKey, setApiKey, deleteApiKey } from '../../src/services/aiService';
import { useDatabase } from '../../src/context/DatabaseContext';

export default function SettingsScreen() {
  const { isDark, themeMode, setThemeMode } = useTheme();
  const db = useDatabase();
  const [apiKey, setApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [snippetCount, setSnippetCount] = useState(0);

  useEffect(() => {
    checkApiKey();
    loadStats();
  }, []);

  const checkApiKey = async () => {
    const key = await getApiKey();
    setHasApiKey(!!key);
  };

  const loadStats = async () => {
    const count = await db.getCount();
    setSnippetCount(count);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    await setApiKey(apiKey.trim());
    setApiKeyState('');
    setShowApiInput(false);
    setHasApiKey(true);
    Alert.alert('Success', 'API key saved securely.');
  };

  const handleRemoveApiKey = () => {
    Alert.alert('Remove API Key', 'Are you sure you want to remove your Gemini API key?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setHasApiKey(false);
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all snippets and files. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmation', 'Type "DELETE" to confirm... (Feature disabled for safety)');
          },
        },
      ]
    );
  };

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', label: 'Light', icon: 'sunny' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'phone-portrait' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#030712' : '#f3f4f6' }]}
      contentContainerStyle={styles.content}
    >
      {/* App Info */}
      <View style={[styles.section, isDark ? styles.sectionDark : styles.sectionLight]}>
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <Ionicons name="code-slash" size={28} color="#3b82f6" />
          </View>
          <View>
            <Text style={[styles.appName, { color: isDark ? '#f9fafb' : '#111827' }]}>
              DevSnippets AI
            </Text>
            <Text style={[styles.appVersion, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
        <View style={[styles.stat, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Total Snippets
          </Text>
          <Text style={[styles.statValue, { color: isDark ? '#f9fafb' : '#111827' }]}>
            {snippetCount}
          </Text>
        </View>
      </View>

      {/* Theme */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        APPEARANCE
      </Text>
      <View style={[styles.section, isDark ? styles.sectionDark : styles.sectionLight]}>
        <View style={styles.themeRow}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                { backgroundColor: isDark ? '#111827' : '#f9fafb' },
                themeMode === option.value && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={themeMode === option.value ? '#3b82f6' : isDark ? '#6b7280' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.themeLabel,
                  { color: themeMode === option.value ? '#3b82f6' : isDark ? '#d1d5db' : '#374151' },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Settings */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        AI CONFIGURATION
      </Text>
      <View style={[styles.section, isDark ? styles.sectionDark : styles.sectionLight]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="key" size={20} color="#8b5cf6" />
            <View>
              <Text style={[styles.rowTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Gemini API Key
              </Text>
              <Text style={[styles.rowSubtitle, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                {hasApiKey ? 'Key configured ✓' : 'Not configured'}
              </Text>
            </View>
          </View>
          {hasApiKey ? (
            <TouchableOpacity onPress={handleRemoveApiKey}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowApiInput(true)}>
              <Ionicons name="add-circle" size={24} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        {showApiInput && (
          <View style={styles.apiInputContainer}>
            <TextInput
              style={[styles.apiInput, {
                color: isDark ? '#f9fafb' : '#111827',
                backgroundColor: isDark ? '#111827' : '#f9fafb',
                borderColor: isDark ? '#374151' : '#e5e7eb',
              }]}
              value={apiKey}
              onChangeText={setApiKeyState}
              placeholder="Enter your Gemini API key"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.apiActions}>
              <TouchableOpacity
                style={[styles.apiButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={() => { setShowApiInput(false); setApiKeyState(''); }}
              >
                <Text style={{ color: isDark ? '#d1d5db' : '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.apiButton, { backgroundColor: '#3b82f6' }]}
                onPress={handleSaveApiKey}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.hint, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
          Get a free API key from Google AI Studio (aistudio.google.com)
        </Text>
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        DATA
      </Text>
      <View style={[styles.section, isDark ? styles.sectionDark : styles.sectionLight]}>
        <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={styles.dangerText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={[styles.footer, { color: isDark ? '#4b5563' : '#9ca3af' }]}>
        Built with Expo • React Native • TypeScript{'\n'}
        Offline-first architecture with SQLite
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  sectionLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: { fontSize: 18, fontWeight: '700' },
  appVersion: { fontSize: 13 },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 18, fontWeight: '700' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionActive: { borderColor: '#3b82f6' },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  apiInputContainer: { marginTop: 14 },
  apiInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  apiActions: { flexDirection: 'row', gap: 10 },
  apiButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  hint: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dangerText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
