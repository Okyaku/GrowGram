import React, { ReactNode } from "react";
import {
  Animated,
  GestureResponderHandlers,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../theme";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  panHandlers?: GestureResponderHandlers;
  slideAnim?: Animated.Value;
};

export const ScreenContainer: React.FC<Props> = ({
  children,
  scrollable = true,
  padded = true,
  backgroundColor = theme.colors.background,
  panHandlers,
  slideAnim,
}) => {
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
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </Animated.View>
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
