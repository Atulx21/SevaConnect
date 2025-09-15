import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="post" />
      <Stack.Screen name="my-jobs" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}