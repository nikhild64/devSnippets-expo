import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function NotFoundScreen() {
  const { isDark } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#030712" : "#f3f4f6" },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#f9fafb" : "#111827" }]}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#3b82f6",
  },
});
