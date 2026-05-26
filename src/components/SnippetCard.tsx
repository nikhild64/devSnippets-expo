import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Snippet } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SnippetCardProps {
  snippet: Snippet;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function SnippetCard({ snippet, onPress, onToggleFavorite }: SnippetCardProps) {
  const { isDark } = useTheme();
  const tags: string[] = JSON.parse(snippet.tags || '[]');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
          {snippet.title}
        </Text>
        <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={snippet.is_favorite ? 'star' : 'star-outline'}
            size={20}
            color={snippet.is_favorite ? '#f59e0b' : isDark ? '#6b7280' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.codePreview, isDark ? styles.codePreviewDark : styles.codePreviewLight]}>
        <Text style={[styles.codeText, isDark ? styles.codeTextDark : styles.codeTextLight]} numberOfLines={3}>
          {snippet.code}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.languageBadge, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
          <Text style={[styles.languageText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
            {snippet.language}
          </Text>
        </View>
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                <Text style={[styles.tagText, { color: isDark ? '#9ca3af' : '#4b5563' }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {tags.length > 2 && (
              <Text style={[styles.moreText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                +{tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  textLight: { color: '#f9fafb' },
  textDark: { color: '#111827' },
  codePreview: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  codePreviewDark: { backgroundColor: '#111827' },
  codePreviewLight: { backgroundColor: '#f9fafb' },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  codeTextDark: { color: '#d1d5db' },
  codeTextLight: { color: '#374151' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  languageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
  },
  moreText: {
    fontSize: 11,
  },
});
