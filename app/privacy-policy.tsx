import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { theme } from "../src/theme";

export default function PrivacyPolicyScreen() {
  const styles = React.useMemo(() => createStyles(), []);

  return (
    <ScreenContainer>
      <Text style={styles.title}>プライバシーポリシー</Text>

      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>個人情報の取り扱い</Text>
        </View>
        <Text style={styles.bodyText}>
          投稿データ・プロフィール情報はサービス提供と分析改善の目的で利用します。
        </Text>
      </View>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    title: {
      ...theme.text.title,
      marginBottom: theme.spacing.md,
    },
    sectionBox: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    bodyText: {
      color: theme.colors.textSub,
      lineHeight: 22,
    },
  });
