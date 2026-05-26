import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={isDark ? '#374151' : '#d1d5db'} />
      <Text style={[styles.title, { color: isDark ? '#9ca3af' : '#4b5563' }]}>{title}</Text>
      <Text style={[styles.message, { color: isDark ? '#6b7280' : '#9ca3af' }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
