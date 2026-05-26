import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { DatabaseProvider } from '../src/context/DatabaseContext';
import { DATABASE_NAME, initializeDatabase } from '../src/database/schema';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
          },
          headerTintColor: isDark ? '#f9fafb' : '#111827',
          contentStyle: {
            backgroundColor: isDark ? '#030712' : '#f3f4f6',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="snippet/create"
          options={{ title: 'New Snippet', presentation: 'modal' }}
        />
        <Stack.Screen
          name="snippet/[id]"
          options={{ title: 'Snippet' }}
        />
        <Stack.Screen
          name="snippet/explain"
          options={{ title: 'AI Explanation', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
