import React from "react";
import {
  Alert,
  DevSettings,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "aws-amplify/auth";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { useRoadmap } from "../src/store/roadmap-context";
import { applyThemeMode, getThemeMode, ThemeMode, theme } from "../src/theme";
import { writeStoredThemeMode } from "../src/theme/theme-storage";

const settingMenus = [
  {
    label: "通知",
    route: "/notifications" as const,
    icon: "notifications" as const,
  },
  {
    label: "利用規約",
    route: "/legal" as const,
    icon: "document-text" as const,
  },
  {
    label: "プライバシーポリシー",
    route: "/legal" as const,
    icon: "shield-checkmark" as const,
  },
  {
    label: "保存・アーカイブ",
    route: "/saved-archived-posts" as const,
    icon: "bookmark" as const,
  },
];

export default function SettingsScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { logout } = useRoadmap();
  const [isLightMode, setIsLightMode] = React.useState(
    getThemeMode() === "light",
  );

  const handleToggleTheme = React.useCallback(
    async (nextLightMode: boolean) => {
      const nextMode: ThemeMode = nextLightMode ? "light" : "dark";
      setIsLightMode(nextLightMode);
      applyThemeMode(nextMode);
      await writeStoredThemeMode(nextMode);

      if (__DEV__) {
        DevSettings.reload();
        return;
      }

      Alert.alert(
        "テーマを変更しました",
        "反映するにはアプリを再起動してください。",
      );
    },
    [],
  );

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut();
    } catch {
      // Ignore auth provider errors and always clear local app state.
    } finally {
      logout({ clearProgress: true });
      router.replace("/(auth)/login");
    }
  }, [logout, router]);

  const onDeleteAccount = () => {
    Alert.alert("アカウント退会", "この操作は取り消せません。退会しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "退会する",
        style: "destructive",
        onPress: () => {
          void handleSignOut();
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: () => {
          void handleSignOut();
        },
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>設定</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <View style={styles.menuLeft}>
            <Ionicons
              name={isLightMode ? "sunny" : "moon"}
              size={18}
              color={theme.colors.primary}
            />
            <View>
              <Text style={styles.menuText}>ライトモード</Text>
              <Text style={styles.modeHint}>
                白とオレンジ基調に切り替えます
              </Text>
            </View>
          </View>
          <Switch
            value={isLightMode}
            onValueChange={(value) => {
              void handleToggleTheme(value);
            }}
            trackColor={{ false: theme.colors.border, true: "#FFC089" }}
            thumbColor={
              isLightMode ? theme.colors.primary : theme.colors.textSub
            }
          />
        </View>

        <View style={styles.modeDivider} />

        {settingMenus.map((menu) => (
          <Pressable
            key={menu.label}
            style={styles.menuItem}
            onPress={() => router.push(menu.route)}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name={menu.icon}
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.menuText}>{menu.label}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textSub}
            />
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.menuItem, styles.logoutItem]}
        onPress={onLogout}
      >
        <View style={styles.menuLeft}>
          <Ionicons name="log-out" size={18} color={theme.colors.danger} />
          <Text style={styles.logoutText}>ログアウト</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textSub}
        />
      </Pressable>
      <View style={styles.bottomArea}>
        <Pressable onPress={onDeleteAccount} hitSlop={12}>
          <Text style={styles.deleteLink}>アカウント退会</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.white,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "900",
    },
    card: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      padding: theme.spacing.sm,
      ...theme.shadows.soft,
    },
    menuItem: {
      height: 56,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modeRow: {
      minHeight: 64,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modeDivider: {
      height: 1,
      marginHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.border,
    },
    menuLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    menuText: {
      color: theme.colors.text,
      fontWeight: "700",
    },
    bottomArea: {
      marginTop: "auto",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
    },
    deleteLink: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    logoutItem: {
      borderColor: theme.colors.danger,
    },
    logoutText: {
      color: theme.colors.danger,
      fontWeight: "800",
    },
    modeHint: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
    },
  });
