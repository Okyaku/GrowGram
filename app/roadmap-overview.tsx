import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  ScrollView,
  View,
} from "react-native";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";

type OverviewMilestone = {
  id: string;
  title: string;
  subtitle: string;
  status?: "locked" | "current" | "completed";
};

type UnknownNode = {
  id?: string;
  title?: unknown;
  subtitle?: unknown;
  status?: unknown;
  type?: unknown;
  segmentIndex?: unknown;
  position?: unknown;
};

const isShortTermNode = (node: UnknownNode) => {
  if (node.type === "step" || node.type === "short-term") {
    return true;
  }

  return (
    typeof node.segmentIndex === "number" || typeof node.position === "number"
  );
};

const toOverviewMilestone = (node: UnknownNode): OverviewMilestone | null => {
  if (isShortTermNode(node)) {
    return null;
  }

  const id = typeof node.id === "string" ? node.id : "";
  const title = typeof node.title === "string" ? node.title.trim() : "";
  const subtitle =
    typeof node.subtitle === "string" ? node.subtitle.trim() : "";

  if (!id || !title || !subtitle) {
    return null;
  }

  const status =
    node.status === "locked" ||
    node.status === "current" ||
    node.status === "completed"
      ? node.status
      : undefined;

  return {
    id,
    title,
    subtitle,
    status,
  };
};

const statusToLabel = (status?: OverviewMilestone["status"]) => {
  if (status === "completed") {
    return "COMPLETED";
  }
  if (status === "current") {
    return "CURRENT";
  }
  return "LOCKED";
};

const statusToColor = (status?: OverviewMilestone["status"]) => {
  if (status === "completed") {
    return "#2C9C6A";
  }
  if (status === "current") {
    return "#FF6F00";
  }
  return "#907F74";
};

export default function RoadmapOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    goal?: string;
    milestonesJson?: string;
  }>();
  const [expandedMilestoneId, setExpandedMilestoneId] = React.useState<
    string | null
  >(null);

  const goal =
    typeof params.goal === "string" && params.goal.trim().length > 0
      ? params.goal.trim()
      : "長期目標";

  const milestones = React.useMemo(() => {
    if (typeof params.milestonesJson !== "string") {
      return [] as OverviewMilestone[];
    }

    try {
      const parsed = JSON.parse(params.milestonesJson) as unknown;
      if (!Array.isArray(parsed)) {
        return [] as OverviewMilestone[];
      }

      return parsed
        .map((item) => toOverviewMilestone(item as UnknownNode))
        .filter((item): item is OverviewMilestone => Boolean(item));
    } catch {
      return [] as OverviewMilestone[];
    }
  }, [params.milestonesJson]);

  React.useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const onToggleMilestone = (milestoneId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMilestoneId((prev) =>
      prev === milestoneId ? null : milestoneId,
    );
  };

  const timelineDensityStyle =
    milestones.length >= 7
      ? styles.timelineDense
      : milestones.length >= 5
        ? styles.timelineNormal
        : styles.timelineLoose;

  return (
    <ScreenContainer
      backgroundColor="#F4F6F8"
      padded={false}
      scrollable={false}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#2E3A42" />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Roadmap Overview</Text>
          <Text style={styles.headerSub}>長期目標と中期目標を俯瞰表示</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>LONG-TERM GOAL</Text>
          <Text style={styles.goalTitle}>{goal}</Text>
        </View>

        <View style={[styles.timelineWrap, timelineDensityStyle]}>
          {milestones.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                表示できる中期目標がありません
              </Text>
              <Text style={styles.emptyText}>
                先にロードマップ上でマイルストーンを追加してください。
              </Text>
            </View>
          ) : (
            milestones.map((milestone, index) => {
              const statusColor = statusToColor(milestone.status);
              const statusLabel = statusToLabel(milestone.status);
              const stageLabel = `STAGE ${String(index + 1).padStart(2, "0")}`;
              const expanded = expandedMilestoneId === milestone.id;
              const rowFlex = expanded ? 4 : 1;

              return (
                <View
                  key={milestone.id}
                  style={[styles.timelineRow, { flex: rowFlex }]}
                >
                  <View style={styles.markerCol}>
                    <View
                      style={[
                        styles.markerDot,
                        {
                          borderColor: statusColor,
                          backgroundColor: "#FFFFFF",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.markerDotInner,
                          { backgroundColor: statusColor },
                        ]}
                      />
                    </View>
                    {index < milestones.length - 1 ? (
                      <View style={styles.markerLine} />
                    ) : null}
                  </View>

                  <Pressable
                    style={[
                      styles.stageCard,
                      expanded && styles.stageCardExpanded,
                    ]}
                    onPress={() => onToggleMilestone(milestone.id)}
                  >
                    <View style={styles.stageMetaRow}>
                      <Text style={styles.stageIndex}>{stageLabel}</Text>
                      <Text
                        style={[styles.stageStatus, { color: statusColor }]}
                      >
                        {statusLabel}
                      </Text>
                    </View>

                    <Text
                      style={styles.stageTitle}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                    >
                      {milestone.title}
                    </Text>

                    {expanded ? (
                      <ScrollView
                        style={styles.stageSubtitleScroll}
                        contentContainerStyle={
                          styles.stageSubtitleScrollContent
                        }
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                      >
                        <Text style={styles.stageSubtitle}>
                          {milestone.subtitle}
                        </Text>
                      </ScrollView>
                    ) : null}
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 120, 120, 0.16)",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3F8",
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E3A42",
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#7C8A94",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    justifyContent: "space-between",
    gap: 10,
  },
  goalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 111, 0, 0.32)",
    backgroundColor: "#FFF8F1",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C56A1A",
    letterSpacing: 0.7,
  },
  goalTitle: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: "#3A2F28",
  },
  timelineWrap: {
    flex: 1,
    justifyContent: "space-between",
  },
  timelineLoose: {
    paddingVertical: 10,
    gap: 8,
  },
  timelineNormal: {
    paddingVertical: 8,
    gap: 5,
  },
  timelineDense: {
    paddingVertical: 4,
    gap: 3,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    minHeight: 0,
    flexShrink: 1,
  },
  markerCol: {
    width: 28,
    alignItems: "center",
    paddingTop: 6,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markerDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  markerLine: {
    width: 1,
    flex: 1,
    marginTop: 3,
    backgroundColor: "rgba(122, 144, 160, 0.3)",
  },
  stageCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(84, 106, 122, 0.22)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    flexShrink: 1,
  },
  stageCardExpanded: {
    justifyContent: "flex-start",
  },
  stageSubtitleScroll: {
    flex: 1,
    marginTop: 6,
    minHeight: 0,
  },
  stageSubtitleScrollContent: {
    flexGrow: 1,
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stageIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: "#62727F",
    letterSpacing: 0.6,
  },
  stageStatus: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stageTitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#2B3640",
  },
  stageSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#58656F",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(99, 113, 125, 0.25)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#34414A",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#63727D",
  },
});
