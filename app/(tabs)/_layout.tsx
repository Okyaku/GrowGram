import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PagerView from "../../src/components/navigation/PagerViewCompat";
import { TabScrollTopProvider, useTabScrollTop } from "../../src/store/tab-scroll-top-context";
import { useRoadmap } from "../../src/store/roadmap-context";
import { theme } from "../../src/theme";
import HomeScreen from "./home";
import AnalysisScreen from "./analysis";
import CreateScreen from "./create";
import GrowthScreen from "./growth";
import MyPageScreen from "./mypage";

type TabConfig = {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isCenterTab?: boolean;
};

const tabs: TabConfig[] = [
  { name: "home", label: "ホーム", icon: "home" },
  { name: "analysis", label: "分析", icon: "bar-chart" },
  { name: "create", label: "", icon: "git-network", isCenterTab: true },
  { name: "growth", label: "成長", icon: "star" },
  { name: "mypage", label: "設定", icon: "settings" },
];

function TabIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons name={name} size={22} color={color} />;
}

function NativeTabsLayout() {
  const { postCredits } = useRoadmap();
  const { scrollToTop } = useTabScrollTop();
  const pagerRef = React.useRef<any>(null);
  const [currentPage, setCurrentPage] = React.useState(0);

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
    scrollToTop(tabs[e.nativeEvent.position]?.name ?? "home");
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        scrollEnabled={true}
      >
        {[
          HomeScreen,
          AnalysisScreen,
          CreateScreen,
          GrowthScreen,
          MyPageScreen,
        ].map((Comp, idx) => (
          <View key={tabs[idx].name} style={styles.page}>
            <Comp />
          </View>
        ))}
      </PagerView>

      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = currentPage === index;
          const isCenterTab = tab.isCenterTab;

          if (isCenterTab) {
            return (
              <Pressable
                key={tab.name}
                style={styles.createButton}
                onPress={() => {
                  if (currentPage === index) {
                    scrollToTop(tab.name);
                    return;
                  }
                  pagerRef.current?.setPage(index);
                }}
              >
                <View style={styles.createIconWrap}>
                  <Ionicons
                    name={tab.icon}
                    size={24}
                    color={theme.colors.onPrimary}
                  />
                  {postCredits > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{postCredits}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => {
                if (currentPage === index) {
                  scrollToTop(tab.name);
                  return;
                }
                pagerRef.current?.setPage(index);
              }}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? theme.colors.primary : theme.colors.textSub}
              />
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  !isActive && styles.labelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WebTabsLayout() {
  const { postCredits } = useRoadmap();

  return (
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
          tabBarIcon: ({ color }) => <TabIcon name="bar-chart" color={color} />,
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
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <TabScrollTopProvider>
      {Platform.OS === "web" ? <WebTabsLayout /> : <NativeTabsLayout />}
    </TabScrollTopProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
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
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  labelActive: {
    color: theme.colors.primary,
  },
  labelInactive: {
    color: theme.colors.textSub,
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
