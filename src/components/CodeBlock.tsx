import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {language && (
        <View style={styles.header}>
          <Text style={[styles.language, isDark ? styles.languageDark : styles.languageLight]}>
            {language}
          </Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView nestedScrollEnabled style={styles.codeScroll}>
          <Text style={[styles.code, isDark ? styles.codeDark : styles.codeLight]} selectable>
            {code}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: '#0d1117',
    borderColor: '#30363d',
  },
  containerLight: {
    backgroundColor: '#f6f8fa',
    borderColor: '#d0d7de',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  language: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  languageDark: { color: '#8b949e' },
  languageLight: { color: '#57606a' },
  codeScroll: {
    padding: 14,
    maxHeight: 400,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  codeDark: { color: '#e6edf3' },
  codeLight: { color: '#24292f' },
});
