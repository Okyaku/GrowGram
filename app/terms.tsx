import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { theme } from "../src/theme";

export default function TermsScreen() {
  const styles = React.useMemo(() => createStyles(), []);

  return (
    <ScreenContainer>
      <Text style={styles.title}>利用規約</Text>

      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="document-text"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>ご利用にあたって</Text>
        </View>
        <Text style={styles.bodyText}>
          GrowGramの利用にあたり、他ユーザーへの誹謗中傷や不適切投稿は禁止です。
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
