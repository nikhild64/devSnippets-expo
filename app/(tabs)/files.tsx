import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../src/context/ThemeContext';
import { FileItem } from '../../src/types';
import { FileItemRow } from '../../src/components/FileItemRow';
import { EmptyState } from '../../src/components/EmptyState';
import {
  listFiles,
  createDirectory,
  deleteItem,
  initAppDirectories,
  getAppDirectory,
} from '../../src/services/fileService';
import { APP_DIRECTORIES } from '../../src/constants';

export default function FilesScreen() {
  const { isDark } = useTheme();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(
    `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`
  );
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFiles = useCallback(async () => {
    await initAppDirectories();
    const items = await listFiles(currentPath);
    setFiles(items);
  }, [currentPath]);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [loadFiles])
  );

  const navigateToFolder = (item: FileItem) => {
    if (item.isDirectory) {
      setCurrentPath(item.path + '/');
    }
  };

  const navigateUp = () => {
    const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
    if (currentPath === basePath) return;
    const parts = currentPath.replace(/\/$/, '').split('/');
    parts.pop();
    setCurrentPath(parts.join('/') + '/');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createDirectory(`${currentPath}${newFolderName.trim()}`);
    setNewFolderName('');
    setShowNewFolderModal(false);
    loadFiles();
  };

  const handleDelete = (item: FileItem) => {
    Alert.alert(
      'Delete',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(item.path);
            loadFiles();
          },
        },
      ]
    );
  };

  const isAtRoot = currentPath === `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;

  const getBreadcrumb = () => {
    const basePath = `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
    const relative = currentPath.replace(basePath, '');
    if (!relative) return 'Files';
    return `Files/${relative.replace(/\/$/, '')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#030712' : '#f3f4f6' }]}>
      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, { backgroundColor: isDark ? '#111827' : '#ffffff', borderBottomColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
        {!isAtRoot && (
          <TouchableOpacity onPress={navigateUp} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
        <Ionicons name="folder-open" size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
        <Text style={[styles.breadcrumbText, { color: isDark ? '#d1d5db' : '#374151' }]} numberOfLines={1}>
          {getBreadcrumb()}
        </Text>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => (
          <FileItemRow
            item={item}
            onPress={() => navigateToFolder(item)}
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="Empty Folder"
            message="Create folders to organize your files. Long-press items to delete."
          />
        }
        contentContainerStyle={files.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - New Folder */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewFolderModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="folder-open" size={22} color="#fff" />
        <Ionicons name="add" size={14} color="#fff" style={{ position: 'absolute', right: 12, bottom: 12 }} />
      </TouchableOpacity>

      {/* New Folder Modal */}
      <Modal visible={showNewFolderModal} transparent animationType="fade" onRequestClose={() => setShowNewFolderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
              New Folder
            </Text>
            <TextInput
              style={[styles.modalInput, {
                color: isDark ? '#f9fafb' : '#111827',
                backgroundColor: isDark ? '#111827' : '#f9fafb',
                borderColor: isDark ? '#374151' : '#e5e7eb',
              }]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={() => { setShowNewFolderModal(false); setNewFolderName(''); }}
              >
                <Text style={{ color: isDark ? '#d1d5db' : '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}
                onPress={handleCreateFolder}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 4 },
  breadcrumbText: { fontSize: 14, fontWeight: '500', flex: 1 },
  list: { paddingTop: 8, paddingBottom: 80 },
  emptyList: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
