import "react-native-get-random-values";

import React from "react";
import { Amplify } from "aws-amplify";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { LogBox } from "react-native";
import awsExports from "../src/aws-exports";
import { applyThemeMode, theme } from "../src/theme";
import { readStoredThemeMode } from "../src/theme/theme-storage";
import { RoadmapProvider } from "../src/store/roadmap-context";

Amplify.configure(awsExports);

LogBox.ignoreLogs([
  "props.pointerEvents is deprecated. Use style.pointerEvents",
]);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const [isThemeReady, setIsThemeReady] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapTheme = async () => {
      const storedMode = await readStoredThemeMode();
      if (storedMode) {
        applyThemeMode(storedMode);
      }

      if (isMounted) {
        setIsThemeReady(true);
      }
    };

    void bootstrapTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!fontsLoaded || !isThemeReady) {
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
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="chat/[userId]" />
        <Stack.Screen
          name="story/[storyId]"
          options={{
            presentation: "transparentModal",
            animation: "none",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="story-create" />
        <Stack.Screen name="post-create" />
        <Stack.Screen name="roadmap-overview" />
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
