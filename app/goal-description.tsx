import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";

type GoalDescriptionParams = {
  goalType?: string;
  goalId?: string;
  title?: string;
  subtitle?: string;
};

const STORAGE_KEY = "@growgram/goal-description-notes/v1";

export default function GoalDescriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<GoalDescriptionParams>();

  const goalType =
    typeof params.goalType === "string" ? params.goalType : "step";
  const goalId = typeof params.goalId === "string" ? params.goalId : "unknown";
  const title = typeof params.title === "string" ? params.title : "未設定";
  const subtitle = typeof params.subtitle === "string" ? params.subtitle : "";

  const noteKey = `${goalType}:${goalId}`;
  const [description, setDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const loadNote = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !mounted) {
          return;
        }
        const parsed = JSON.parse(raw) as Record<string, string>;
        setDescription(parsed[noteKey] || "");
      } catch {
        if (mounted) {
          setDescription("");
        }
      }
    };

    void loadNote();

    return () => {
      mounted = false;
    };
  }, [noteKey]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      const next = {
        ...current,
        [noteKey]: description.trim(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      Alert.alert("保存しました", "説明メモを保存しました。");
      router.back();
    } catch {
      Alert.alert("保存失敗", "もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#F8F9FB">
      <View style={styles.container}>
        <Text style={styles.typeLabel}>
          {goalType === "milestone" ? "長期目標の説明" : "短期目標の説明"}
        </Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <Text style={styles.sectionLabel}>説明メモ</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="ここに説明やメモを書いてください"
          multiline
          style={styles.textArea}
          textAlignVertical="top"
        />

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>戻る</Text>
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={onSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "保存中..." : "保存"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  typeLabel: {
    color: "#FF5F00",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    color: "#1F2937",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  sectionLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  textArea: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: "rgba(255,95,0,0.24)",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FF5F00",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#FF5F00",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5F00",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
