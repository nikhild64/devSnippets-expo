import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search snippets...' }: SearchBarProps) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <Ionicons name="search" size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
      <TextInput
        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    gap: 10,
  },
  containerDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  containerLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputDark: { color: '#f9fafb' },
  inputLight: { color: '#111827' },
});
