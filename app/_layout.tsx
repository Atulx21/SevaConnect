import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4caf50',
    primaryContainer: '#e8f5e8',
    secondary: '#2e7d32',
    surface: '#ffffff',
    background: '#f5f5f5',
    onPrimary: '#ffffff',
    onSurface: '#333333',
  },
};

export default function RootLayout() {
  useFrameworkReady();

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="search" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}