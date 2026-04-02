import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { ScreenContainer } from "../../src/components/common";
import { theme } from "../../src/theme";

type Period = "day" | "month" | "year";

const periodLabels: Record<Period, string> = {
  day: "日",
  month: "月",
  year: "年",
};

const chartData: Record<
  Period,
  {
    points: string;
    delta: string;
    xLabels: string[];
    path: string;
    ranks: {
      icon: React.ComponentProps<typeof Ionicons>["name"];
      title: string;
      value: string;
      sub: string;
    }[];
  }
> = {
  day: {
    points: "126 pts",
    delta: "+4.8%",
    xLabels: ["6:00", "12:00", "18:00", "24:00"],
    path: "M8 92 C38 84, 66 72, 92 56 C112 44, 140 46, 168 68 C188 84, 216 88, 242 54 C258 34, 286 30, 312 38",
    ranks: [
      { icon: "flame", title: "情熱", value: "18位", sub: "/ 50人" },
      { icon: "bulb", title: "論理", value: "11位", sub: "/ 50人" },
      { icon: "checkmark-circle", title: "継続", value: "9位", sub: "/ 50人" },
    ],
  },
  month: {
    points: "1,280 pts",
    delta: "+12%",
    xLabels: ["10/01", "10/10", "10/20", "10/31"],
    path: "M8 96 C38 90, 64 76, 92 52 C114 34, 138 38, 166 68 C188 86, 214 84, 242 44 C264 22, 286 26, 312 44",
    ranks: [
      { icon: "flame", title: "情熱", value: "12位", sub: "/ 450人" },
      { icon: "bulb", title: "論理", value: "5位", sub: "/ 450人" },
      { icon: "checkmark-circle", title: "継続", value: "8位", sub: "/ 450人" },
    ],
  },
  year: {
    points: "14,920 pts",
    delta: "+31%",
    xLabels: ["Q1", "Q2", "Q3", "Q4"],
    path: "M8 106 C36 102, 64 88, 92 72 C118 56, 144 46, 166 52 C188 58, 214 74, 242 62 C266 52, 290 36, 312 24",
    ranks: [
      { icon: "flame", title: "情熱", value: "4位", sub: "/ 2,200人" },
      { icon: "bulb", title: "論理", value: "3位", sub: "/ 2,200人" },
      {
        icon: "checkmark-circle",
        title: "継続",
        value: "2位",
        sub: "/ 2,200人",
      },
    ],
  },
};

const leaders = [
  {
    rank: 1,
    name: "Kenji Tanaka",
    id: "@KNTNKA",
    points: 4820,
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200",
  },
  {
    rank: 2,
    name: "Aria Sato",
    id: "@ARIASATO",
    points: 4150,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  },
  {
    rank: 3,
    name: "Kaito Ito",
    id: "@KTOITO",
    points: 3980,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  },
];

export default function AnalysisScreen() {
  const router = useRouter();
  const [period, setPeriod] = React.useState<Period>("month");
  const data = chartData[period];

  return (
    <ScreenContainer backgroundColor={theme.colors.background}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>分析とランキング</Text>
        <Pressable
          style={styles.guideBtn}
          onPress={() => router.push("/analysis-guide")}
        >
          <Ionicons
            name="help-circle-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.guideText}>ガイド</Text>
        </Pressable>
      </View>

      <View style={styles.segment}>
        {(["day", "month", "year"] as const).map((item) => (
          <Pressable
            key={item}
            style={[
              styles.segmentItem,
              period === item && styles.segmentActive,
            ]}
            onPress={() => setPeriod(item)}
          >
            <Text
              style={[
                styles.segmentText,
                period === item && styles.segmentTextActive,
              ]}
            >
              {periodLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardHeading}>現在の積み上げ</Text>
        <Text style={styles.point}>{data.points}</Text>
        <View style={styles.deltaPill}>
          <Ionicons name="trending-up" size={13} color={theme.colors.success} />
          <Text style={styles.delta}>{data.delta}</Text>
        </View>

        <View style={styles.graphWrap}>
          <Svg width="100%" height={120} viewBox="0 0 320 120">
            <Path
              d={data.path}
              stroke={theme.colors.primary}
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.xRow}>
            {data.xLabels.map((label) => (
              <Text key={label} style={styles.xLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.section}>カテゴリ別ランク</Text>
      <View style={styles.rankGrid}>
        {data.ranks.map((rank) => (
          <View key={rank.title} style={styles.rankCard}>
            <View style={styles.rankIconWrap}>
              <Ionicons
                name={rank.icon}
                size={14}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.rankTitle}>{rank.title}</Text>
            <Text style={styles.rankValue}>{rank.value}</Text>
            <Text style={styles.rankSub}>{rank.sub}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>トップリーダー</Text>
        <Text style={styles.viewAll}>すべて見る</Text>
      </View>
      {leaders.map((leader) => (
        <View key={leader.rank} style={styles.leaderRow}>
          <View
            style={[
              styles.rankCircle,
              leader.rank === 1 && styles.rankCircle1,
              leader.rank === 2 && styles.rankCircle2,
              leader.rank === 3 && styles.rankCircle3,
            ]}
          >
            <Text style={styles.rankNumber}>{leader.rank}</Text>
          </View>
          <Image source={{ uri: leader.avatar }} style={styles.avatar} />
          <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{leader.name}</Text>
            <Text style={styles.leaderId}>{leader.id}</Text>
          </View>
          <Text style={styles.leaderPoints}>
            {leader.points.toLocaleString()}
          </Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  guideText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  segment: {
    backgroundColor: "#112342",
    borderRadius: theme.radius.pill,
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  segmentItem: {
    flex: 1,
    height: 34,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.textSub,
    fontWeight: "700",
    fontSize: 12,
  },
  segmentTextActive: {
    color: theme.colors.onPrimary,
  },
  chartCard: {
    backgroundColor: "#0F2A4A",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "#18345A",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  cardHeading: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: "700",
  },
  point: {
    fontSize: 36,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 4,
  },
  deltaPill: {
    position: "absolute",
    right: theme.spacing.md,
    top: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: "#173E2A",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  delta: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 12,
  },
  graphWrap: {
    marginTop: theme.spacing.md,
  },
  xRow: {
    marginTop: -2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  xLabel: {
    color: theme.colors.textSub,
    fontSize: 10,
    fontWeight: "700",
  },
  section: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  rankGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  rankCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "#18345A",
    backgroundColor: "#0F2A4A",
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  rankIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#173A61",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  rankTitle: {
    color: theme.colors.textSub,
    fontWeight: "700",
    fontSize: 11,
  },
  rankValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  rankSub: {
    color: theme.colors.textSub,
    fontSize: 10,
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAll: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "#18345A",
    backgroundColor: "#0F2A4A",
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1D3559",
    alignItems: "center",
    justifyContent: "center",
  },
  rankCircle1: { backgroundColor: "#7A641C" },
  rankCircle2: { backgroundColor: "#4A5F79" },
  rankCircle3: { backgroundColor: "#6E4738" },
  rankNumber: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: theme.colors.surface,
  },
  leaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  leaderName: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  leaderId: {
    color: theme.colors.textSub,
    fontWeight: "700",
    fontSize: 10,
    marginTop: 2,
  },
  leaderPoints: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});
