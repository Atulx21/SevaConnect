import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while we load auth screens
SplashScreen.preventAutoHideAsync();

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hide splash screen when auth layout is focused
  useFocusEffect(
    useCallback(() => {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Failed to hide splash screen:', error);
        }
      };
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(hideSplash, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const screenOptions = {
    headerShown: false,
    // Smooth transitions between auth screens
    animation: 'slide_from_right' as const,
    animationDuration: 300,
    // Consistent styling across auth flow
    contentStyle: {
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    // Disable swipe back on critical auth screens for security
    gestureEnabled: false,
  };

  return (
    <SafeAreaProvider>
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={isDark ? '#121212' : '#f5f5f5'}
        translucent={false}
      />
      
      <Stack screenOptions={screenOptions}>
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Sign In',
            // Allow going back from login if there's a previous screen
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="role-selection" 
          options={{
            title: 'Select Role',
            // Prevent going back to login after role selection starts
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        
        <Stack.Screen 
          name="profile-setup" 
          options={{
            title: 'Complete Profile',
            // Prevent going back during profile setup
            gestureEnabled: false,
            headerBackVisible: false,
            // Slightly different animation for final step
            animation: 'fade_from_bottom' as const,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

// Export types for better TypeScript support
export type AuthStackParamList = {
  login: undefined;
  'role-selection': undefined;
  'profile-setup': { 
    role: 'worker' | 'provider';
  };
};