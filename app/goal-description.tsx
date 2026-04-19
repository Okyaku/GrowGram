import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { useRoadmap } from "../src/store/roadmap-context";

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
  const { milestones, clearCurrentMilestone } = useRoadmap();

  const goalType =
    typeof params.goalType === "string" ? params.goalType : "step";
  const goalId = typeof params.goalId === "string" ? params.goalId : "unknown";
  const title = typeof params.title === "string" ? params.title : "未設定";
  const subtitle = typeof params.subtitle === "string" ? params.subtitle : "";

  const noteKey = `${goalType}:${goalId}`;
  const [description, setDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const targetMilestone = React.useMemo(
    () =>
      goalType === "milestone"
        ? milestones.find((milestone) => milestone.id === goalId)
        : null,
    [goalId, goalType, milestones],
  );
  const canCompleteMilestone = targetMilestone?.status === "current";

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

  const onCompleteMilestone = () => {
    if (goalType !== "milestone") {
      return;
    }

    if (!targetMilestone) {
      Alert.alert("対象が見つかりません", "リスト画面から再度開いてください。");
      return;
    }

    if (targetMilestone.status === "completed") {
      Alert.alert("達成済み", "この中期目標はすでに達成済みです。");
      return;
    }

    if (targetMilestone.status === "locked") {
      Alert.alert("未解放", "先に現在の中期目標を達成してください。");
      return;
    }

    clearCurrentMilestone();
    Alert.alert("達成しました", "次の中期目標へ更新しました。", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor="#F8F9FB">
      <View style={styles.container}>
        <Text style={styles.typeLabel}>
          {goalType === "milestone" ? "マイルストーンの説明" : "短期目標の説明"}
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

        {goalType === "milestone" ? (
          <Pressable
            style={[
              styles.completeButton,
              !canCompleteMilestone && styles.completeButtonDisabled,
            ]}
            onPress={onCompleteMilestone}
            disabled={!canCompleteMilestone}
          >
            <Text style={styles.completeButtonText}>この目標を達成する</Text>
          </Pressable>
        ) : null}

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
  completeButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5F00",
    marginBottom: 12,
  },
  completeButtonDisabled: {
    opacity: 0.45,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
