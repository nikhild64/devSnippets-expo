import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.header}>
        {language && (
          <Text
            style={[
              styles.language,
              isDark ? styles.languageDark : styles.languageLight,
            ]}
          >
            {language}
          </Text>
        )}
        <TouchableOpacity
          onPress={handleCopy}
          style={styles.copyBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={16}
            color={copied ? "#10b981" : isDark ? "#8b949e" : "#57606a"}
          />
          <Text
            style={[
              styles.copyText,
              { color: copied ? "#10b981" : isDark ? "#8b949e" : "#57606a" },
            ]}
          >
            {copied ? "Copied!" : "Copy"}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView nestedScrollEnabled style={styles.codeScroll}>
          <Text
            style={[styles.code, isDark ? styles.codeDark : styles.codeLight]}
            selectable
          >
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
    overflow: "hidden",
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: "#0d1117",
    borderColor: "#30363d",
  },
  containerLight: {
    backgroundColor: "#f6f8fa",
    borderColor: "#d0d7de",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#30363d",
  },
  language: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  languageDark: { color: "#8b949e" },
  languageLight: { color: "#57606a" },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    fontSize: 11,
    fontWeight: "500",
  },
  codeScroll: {
    padding: 14,
    maxHeight: 400,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
  },
  codeDark: { color: "#e6edf3" },
  codeLight: { color: "#24292f" },
});
