import * as FileSystem from 'expo-file-system/legacy';
import { FileItem } from '../types';
import { APP_DIRECTORIES } from '../constants';

const BASE_DIR = FileSystem.documentDirectory!;

export function getAppDirectory(subdir?: string): string {
  if (subdir) {
    return `${BASE_DIR}${subdir}/`;
  }
  return BASE_DIR;
}

export async function ensureDirectoryExists(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function initAppDirectories(): Promise<void> {
  for (const dir of Object.values(APP_DIRECTORIES)) {
    await ensureDirectoryExists(`${BASE_DIR}${dir}/`);
  }
}

export async function listFiles(directory: string): Promise<FileItem[]> {
  await ensureDirectoryExists(directory);
  const items = await FileSystem.readDirectoryAsync(directory);

  const fileItems: FileItem[] = await Promise.all(
    items.map(async (name) => {
      const path = `${directory}${name}`;
      const info = await FileSystem.getInfoAsync(path);
      return {
        name,
        path,
        isDirectory: info.isDirectory ?? false,
        size: info.exists ? (info as any).size : undefined,
        modifiedAt: info.exists ? (info as any).modificationTime?.toString() : undefined,
      };
    })
  );

  // Sort: directories first, then alphabetically
  return fileItems.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function createDirectory(path: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

export async function deleteItem(path: string): Promise<void> {
  await FileSystem.deleteAsync(path, { idempotent: true });
}

export async function copyItem(source: string, destination: string): Promise<void> {
  await FileSystem.copyAsync({ from: source, to: destination });
}

export async function moveItem(source: string, destination: string): Promise<void> {
  await FileSystem.moveAsync({ from: source, to: destination });
}

export async function writeFile(path: string, content: string): Promise<void> {
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function readFile(path: string): Promise<string> {
  return await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function getFileInfo(path: string): Promise<FileSystem.FileInfo> {
  return await FileSystem.getInfoAsync(path);
}

export async function downloadFile(
  url: string,
  filename: string,
  directory?: string
): Promise<string> {
  const dir = directory || `${BASE_DIR}${APP_DIRECTORIES.FILES}/`;
  await ensureDirectoryExists(dir);
  const destination = `${dir}${filename}`;
  const result = await FileSystem.downloadAsync(url, destination);
  return result.uri;
}

export async function saveAttachment(
  snippetId: number,
  sourceUri: string,
  fileName: string
): Promise<string> {
  const dir = `${BASE_DIR}${APP_DIRECTORIES.ATTACHMENTS}/${snippetId}/`;
  await ensureDirectoryExists(dir);
  const destination = `${dir}${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}
