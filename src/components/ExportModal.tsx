import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExportFormat, Snippet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { exportSnippet, shareSnippet } from '../services/exportService';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  snippet: Snippet;
}

export function ExportModal({ visible, onClose, snippet }: ExportModalProps) {
  const { isDark } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [status, setStatus] = useState<string>('');

  const formats: { value: ExportFormat; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'txt', label: 'Text (.txt)', icon: 'document-text-outline' },
    { value: 'js', label: 'Code File', icon: 'code-slash-outline' },
    { value: 'json', label: 'JSON (.json)', icon: 'code-slash-outline' },
  ];

  const handleExport = async () => {
    try {
      setStatus('Saving...');
      const path = await exportSnippet(snippet, selectedFormat);
      setStatus('Saved locally!');
      setTimeout(() => { setStatus(''); onClose(); }, 1500);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleShare = async () => {
    try {
      setStatus('Preparing...');
      await shareSnippet(snippet, selectedFormat);
      setStatus('');
      onClose();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, isDark ? styles.modalDark : styles.modalLight]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Export Snippet
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Choose export format:
          </Text>

          <View style={styles.formats}>
            {formats.map((format) => (
              <TouchableOpacity
                key={format.value}
                style={[
                  styles.formatOption,
                  isDark ? styles.formatOptionDark : styles.formatOptionLight,
                  selectedFormat === format.value && styles.formatSelected,
                ]}
                onPress={() => setSelectedFormat(format.value)}
              >
                <Ionicons
                  name={format.icon}
                  size={20}
                  color={selectedFormat === format.value ? '#3b82f6' : isDark ? '#9ca3af' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.formatLabel,
                    { color: selectedFormat === format.value ? '#3b82f6' : isDark ? '#d1d5db' : '#374151' },
                  ]}
                >
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {status ? (
            <Text style={[styles.status, { color: status.startsWith('Error') ? '#ef4444' : '#10b981' }]}>
              {status}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={handleExport}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Save Locally</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.shareButton]} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalDark: { backgroundColor: '#1f2937' },
  modalLight: { backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginBottom: 12 },
  formats: { gap: 8, marginBottom: 16 },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  formatOptionDark: { borderColor: '#374151', backgroundColor: '#111827' },
  formatOptionLight: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  formatSelected: { borderColor: '#3b82f6', borderWidth: 2 },
  formatLabel: { fontSize: 15, fontWeight: '500' },
  status: { textAlign: 'center', marginBottom: 12, fontSize: 13 },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  exportButton: { backgroundColor: '#3b82f6' },
  shareButton: { backgroundColor: '#8b5cf6' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
