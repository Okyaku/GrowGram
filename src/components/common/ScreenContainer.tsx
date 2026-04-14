import React, { ReactNode } from "react";
import {
  Animated,
  GestureResponderHandlers,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeMode, theme } from "../../theme";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  panHandlers?: GestureResponderHandlers;
  slideAnim?: Animated.Value;
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  scrollViewRef?: React.RefObject<ScrollView | null>;
};

export const ScreenContainer: React.FC<Props> = ({
  children,
  scrollable = true,
  padded = true,
  backgroundColor = theme.colors.background,
  panHandlers,
  slideAnim,
  keyboardAvoiding = true,
  keyboardVerticalOffset = 0,
  scrollViewRef,
}) => {
  const statusBarStyle =
    getThemeMode() === "dark" ? "light-content" : "dark-content";

  const content = (
    <View style={[styles.inner, padded && styles.padded]}>{children}</View>
  );

  const animatedStyle = slideAnim
    ? {
        transform: [{ translateX: slideAnim }],
      }
    : undefined;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      {...panHandlers}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          keyboardAvoiding
            ? Platform.OS === "ios"
              ? "padding"
              : "height"
            : undefined
        }
        keyboardVerticalOffset={keyboardAvoiding ? keyboardVerticalOffset : 0}
      >
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          {scrollable ? (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  keyboardContainer: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
});
