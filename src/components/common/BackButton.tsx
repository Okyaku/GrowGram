import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View, StyleSheet } from "react-native";
import { Text } from "./Typography";
import { theme } from "../../theme";
import React, { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export const BackButton = (props: Props) => {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { children } = props;
  return (
    <View style={styles.headerRow}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </Pressable>
      {children}
      <View style={styles.backBtnDummy} />
    </View>
  );
};

const createStyles = () =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    backBtnDummy: {
      width: 36,
      height: 36,
    },
    title: {
      ...theme.text.title,
      marginBottom: 0,
    },
  });
