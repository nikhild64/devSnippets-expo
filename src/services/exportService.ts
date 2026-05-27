import * as FileSystem from "expo-file-system/legacy";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { APP_DIRECTORIES, LANGUAGE_EXTENSIONS } from "../constants";
import { ExportFormat, Snippet } from "../types";
import { ensureDirectoryExists } from "./fileService";

function formatSnippetAsTxt(snippet: Snippet): string {
  const tags = JSON.parse(snippet.tags) as string[];
  return `Title: ${snippet.title}
Language: ${snippet.language}
Tags: ${tags.join(", ")}
Created: ${snippet.created_at}
Updated: ${snippet.updated_at}
${"=".repeat(50)}

${snippet.code}
`;
}

function formatSnippetAsJS(snippet: Snippet): string {
  const tags = JSON.parse(snippet.tags) as string[];
  return `/**
 * ${snippet.title}
 * Language: ${snippet.language}
 * Tags: ${tags.join(", ")}
 * Created: ${snippet.created_at}
 */

${snippet.code}
`;
}

function formatSnippetAsJSON(snippet: Snippet): string {
  const tags = JSON.parse(snippet.tags) as string[];
  return JSON.stringify(
    {
      title: snippet.title,
      language: snippet.language,
      tags,
      code: snippet.code,
      created_at: snippet.created_at,
      updated_at: snippet.updated_at,
    },
    null,
    2,
  );
}

export function formatSnippet(snippet: Snippet, format: ExportFormat): string {
  switch (format) {
    case "txt":
      return formatSnippetAsTxt(snippet);
    case "js":
      return formatSnippetAsJS(snippet);
    case "json":
      return formatSnippetAsJSON(snippet);
  }
}

function getExportExtension(format: ExportFormat, language: string): string {
  if (format === "json") return ".json";
  if (format === "txt") return ".txt";
  return LANGUAGE_EXTENSIONS[language] || ".txt";
}

export async function exportSnippet(
  snippet: Snippet,
  format: ExportFormat,
  customDir?: string,
): Promise<string> {
  const content = formatSnippet(snippet, format);
  const extension = getExportExtension(format, snippet.language);
  const safeName = snippet.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeName}${extension}`;
  const dir =
    customDir || `${FileSystem.documentDirectory}${APP_DIRECTORIES.FILES}/`;
  await ensureDirectoryExists(dir);
  const filePath = `${dir}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
}

export async function shareSnippet(
  snippet: Snippet,
  format: ExportFormat,
): Promise<void> {
  const filePath = await exportSnippet(snippet, format);
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device");
  }
  await Sharing.shareAsync(filePath, {
    mimeType: format === "json" ? "application/json" : "text/plain",
    dialogTitle: `Share: ${snippet.title}`,
  });
}

export async function saveToPhone(
  snippet: Snippet,
  format: ExportFormat,
): Promise<string> {
  const content = formatSnippet(snippet, format);
  const extension = getExportExtension(format, snippet.language);
  const safeName = snippet.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeName}${extension}`;
  const mimeType = format === "json" ? "application/json" : "text/plain";

  if (Platform.OS === "android") {
    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      throw new Error("Storage permission not granted");
    }
    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      safeName,
      mimeType,
    );
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileName;
  } else {
    // iOS: use sharing to let user save to Files app
    const tempPath = await exportSnippet(snippet, format);
    await Sharing.shareAsync(tempPath, {
      mimeType,
      dialogTitle: `Save: ${snippet.title}`,
    });
    return fileName;
  }
}
