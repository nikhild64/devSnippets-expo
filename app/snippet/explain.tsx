import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { generateAIResponse } from '../../src/services/aiService';
import { AIAction } from '../../src/types';
import { CodeBlock } from '../../src/components/CodeBlock';

export default function ExplainScreen() {
  const { code, language, title } = useLocalSearchParams<{
    code: string;
    language: string;
    title: string;
  }>();
  const { isDark } = useTheme();

  const [selectedAction, setSelectedAction] = useState<AIAction>('explain');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const actions: { value: AIAction; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'explain', label: 'Explain', icon: 'book-outline' },
    { value: 'summarize', label: 'Summarize', icon: 'text-outline' },
    { value: 'improve', label: 'Improve', icon: 'rocket-outline' },
  ];

  const handleGenerate = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await generateAIResponse(
        code as string,
        (language as string) || 'plaintext',
        selectedAction
      );
      setResult(response);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#030712' : '#f3f4f6' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Snippet Preview */}
        <Text style={[styles.snippetTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
          {title || 'Code Snippet'}
        </Text>
        <View style={styles.codePreview}>
          <CodeBlock code={(code as string)?.slice(0, 200) + ((code as string)?.length > 200 ? '\n...' : '')} language={language as string} />
        </View>

        {/* Action Selector */}
        <View style={styles.actionSelector}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.value}
              style={[
                styles.actionTab,
                { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
                selectedAction === action.value && styles.actionTabActive,
              ]}
              onPress={() => setSelectedAction(action.value)}
            >
              <Ionicons
                name={action.icon}
                size={18}
                color={selectedAction === action.value ? '#3b82f6' : isDark ? '#6b7280' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.actionTabText,
                  {
                    color: selectedAction === action.value ? '#3b82f6' : isDark ? '#d1d5db' : '#374151',
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#fff" />
          )}
          <Text style={styles.generateBtnText}>
            {loading ? 'Generating...' : `Generate ${actions.find(a => a.value === selectedAction)?.label}`}
          </Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#1c1917' : '#fef2f2' }]}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
          </View>
        ) : null}

        {/* Result */}
        {result ? (
          <View style={[styles.resultBox, isDark ? styles.resultBoxDark : styles.resultBoxLight]}>
            <View style={styles.resultHeader}>
              <Ionicons name="sparkles" size={16} color="#8b5cf6" />
              <Text style={[styles.resultTitle, { color: isDark ? '#e9d5ff' : '#6b21a8' }]}>
                AI {actions.find(a => a.value === selectedAction)?.label}
              </Text>
            </View>
            <Text style={[styles.resultText, { color: isDark ? '#d1d5db' : '#374151' }]} selectable>
              {result}
            </Text>
          </View>
        ) : null}

        {/* Help text when no result */}
        {!result && !loading && !error && (
          <View style={styles.helpBox}>
            <Ionicons name="information-circle-outline" size={20} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={[styles.helpText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
              Select an action and tap Generate to get AI-powered insights about your code.
              Make sure you have configured your Gemini API key in Settings.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  snippetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  codePreview: { marginBottom: 20 },
  actionSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionTabActive: { borderColor: '#3b82f6' },
  actionTabText: { fontSize: 13, fontWeight: '600' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  resultBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  resultBoxDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  resultBoxLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resultTitle: { fontSize: 14, fontWeight: '700' },
  resultText: { fontSize: 14, lineHeight: 22 },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    marginTop: 8,
  },
  helpText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
