import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CustomButton, ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";

export default function OnboardingScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <View style={styles.spark}>
          <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.badge}>PEAK OBJECTIVE</Text>
        <Text style={styles.title}>目標達成を、毎日の積み上げで可視化。</Text>
        <Text style={styles.desc}>
          GrowGramは学習・習慣・挑戦を記録し、仲間と共有して継続力を高めるSNSです。
        </Text>
      </View>

      <View style={styles.footer}>
        <CustomButton
          label="ログイン"
          onPress={() => router.push("/(auth)/login")}
        />
        <CustomButton
          label="新規登録"
          variant="outline"
          onPress={() => router.push("/(auth)/signup")}
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    header: {
      flex: 1,
      justifyContent: "center",
    },
    spark: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    badge: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: theme.spacing.sm,
    },
    title: {
      color: theme.colors.text,
      fontSize: 42,
      fontWeight: "900",
      lineHeight: 50,
      marginBottom: theme.spacing.sm,
    },
    desc: {
      color: theme.colors.textSub,
      fontSize: theme.typography.body,
      lineHeight: 24,
    },
    footer: {
      paddingBottom: theme.spacing.lg,
    },
  });
