import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmap } from "../../src/store/roadmap-context";
import { TabScrollTopProvider } from "../../src/store/tab-scroll-top-context";
import { theme } from "../../src/theme";

function TabIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons name={name} size={22} color={color} />;
}

export default function TabsLayoutWeb() {
  const { postCredits } = useRoadmap();

  return (
    <TabScrollTopProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSub,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.label,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "ホーム",
            tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: "分析",
            tabBarIcon: ({ color }) => (
              <TabIcon name="bar-chart" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "",
            tabBarIcon: () => (
              <View style={styles.createIconWrap}>
                <Ionicons
                  name="git-network"
                  size={24}
                  color={theme.colors.onPrimary}
                />
                {postCredits > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{postCredits}</Text>
                  </View>
                ) : null}
              </View>
            ),
            tabBarButton: (props) => (
              <Pressable
                accessibilityRole="button"
                onPress={props.onPress}
                style={styles.createButton}
              >
                {props.children}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="growth"
          options={{
            title: "成長",
            tabBarIcon: ({ color }) => <TabIcon name="star" color={color} />,
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            title: "設定",
            tabBarIcon: ({ color }) => (
              <TabIcon name="settings" color={color} />
            ),
          }}
        />
      </Tabs>
    </TabScrollTopProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 78,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  createButton: {
    top: -18,
    justifyContent: "center",
    alignItems: "center",
  },
  createIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: theme.colors.background,
    ...theme.shadows.soft,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
});
