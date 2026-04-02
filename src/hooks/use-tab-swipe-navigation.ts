import React from "react";
import { Animated, PanResponder, Dimensions } from "react-native";
import { useRouter } from "expo-router";

type TabName = "home" | "analysis" | "create" | "growth" | "mypage";

const TAB_ORDER: TabName[] = ["home", "analysis", "create", "growth", "mypage"];
const ACTIVATE_DISTANCE = 20;
const TRIGGER_THRESHOLD = 0.2; // 20% of screen width

const screenWidth = Dimensions.get("window").width;

export interface TabSwipeNavigationResult {
  panHandlers: any;
  slideAnim: Animated.Value;
}

export const useTabSwipeNavigation = (
  currentTab: TabName,
): TabSwipeNavigationResult => {
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [directionRef] = React.useState({ direction: 0 });

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > ACTIVATE_DISTANCE &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5,
        onPanResponderMove: (_, gestureState) => {
          directionRef.direction = gestureState.dx;
          slideAnim.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentIndex = TAB_ORDER.indexOf(currentTab);
          if (currentIndex < 0) {
            return;
          }

          const dragDistance = Math.abs(gestureState.dx);
          const threshold = screenWidth * TRIGGER_THRESHOLD;
          const isForward = gestureState.dx < 0;
          const targetIndex = isForward ? currentIndex + 1 : currentIndex - 1;
          const targetTab = TAB_ORDER[targetIndex];

          if (!targetTab) {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
            return;
          }

          if (dragDistance > threshold) {
            Animated.timing(slideAnim, {
              toValue: isForward ? -screenWidth : screenWidth,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              router.push(`/(tabs)/${targetTab}`);
              slideAnim.setValue(0);
            });
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [currentTab, router, slideAnim],
  );

  return {
    panHandlers: panResponder.panHandlers,
    slideAnim,
  };
};
