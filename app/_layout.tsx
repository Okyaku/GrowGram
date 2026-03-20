import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../src/theme';
import { RoadmapProvider } from '../src/store/roadmap-context';

export default function RootLayout() {
  return (
    <RoadmapProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="story/[storyId]" />
        <Stack.Screen name="story-create" />
        <Stack.Screen name="post-create" />
        <Stack.Screen name="goal-setup" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="legal" />
      </Stack>
    </RoadmapProvider>
  );
}
