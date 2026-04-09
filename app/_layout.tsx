import 'react-native-get-random-values';

import React from 'react';
import { Amplify } from 'aws-amplify';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Text, TextInput } from 'react-native';
import awsExports from '../src/aws-exports';
import { theme } from '../src/theme';
import { RoadmapProvider } from '../src/store/roadmap-context';

Amplify.configure(awsExports);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  React.useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const GlobalText = Text as unknown as { defaultProps?: { style?: unknown } };
    const textDefaults = GlobalText.defaultProps ?? {};
    GlobalText.defaultProps = {
      ...textDefaults,
      style: [textDefaults.style, { fontFamily: 'SpaceGrotesk_400Regular' }],
    };

    const GlobalTextInput = TextInput as unknown as { defaultProps?: { style?: unknown } };
    const inputDefaults = GlobalTextInput.defaultProps ?? {};
    GlobalTextInput.defaultProps = {
      ...inputDefaults,
      style: [inputDefaults.style, { fontFamily: 'SpaceGrotesk_400Regular' }],
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
        <Stack.Screen name="chat/[userId]" />
        <Stack.Screen name="story/[storyId]" />
        <Stack.Screen name="story-create" />
        <Stack.Screen name="post-create" />
        <Stack.Screen name="goal-setup" />
        <Stack.Screen name="analysis-guide" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="legal" />
      </Stack>
    </RoadmapProvider>
  );
}
