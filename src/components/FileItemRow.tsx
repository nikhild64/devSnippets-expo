import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FileItemRowProps {
  item: FileItem;
  onPress: () => void;
  onLongPress: () => void;
}

function getFileIcon(item: FileItem): keyof typeof Ionicons.glyphMap {
  if (item.isDirectory) return 'folder';
  const ext = item.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
      return 'logo-javascript';
    case 'json':
      return 'code-slash';
    case 'md':
    case 'txt':
      return 'document-text';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'image';
    default:
      return 'document';
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileItemRow({ item, onPress, onLongPress }: FileItemRowProps) {
  const { isDark } = useTheme();
  const icon = getFileIcon(item);

  return (
    <TouchableOpacity
      style={[styles.row, isDark ? styles.rowDark : styles.rowLight]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={24}
        color={item.isDirectory ? '#f59e0b' : isDark ? '#60a5fa' : '#3b82f6'}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: isDark ? '#f9fafb' : '#111827' }]} numberOfLines={1}>
          {item.name}
        </Text>
        {!item.isDirectory && item.size !== undefined && (
          <Text style={[styles.meta, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            {formatFileSize(item.size)}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? '#4b5563' : '#d1d5db'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  rowDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  rowLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
});
