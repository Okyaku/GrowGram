import React from 'react';
import { Alert, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { useRoadmap } from '../../src/store/roadmap-context';
import { theme } from '../../src/theme';

const skills = [
  { label: '情熱 (Passion)', value: 85 },
  { label: '論理 (Logic)', value: 42 },
  { label: '継続 (Consistency)', value: 92 },
];

export default function GrowthScreen() {
  const router = useRouter();
  const { activeRoadmap, streakDays, level, totalScore, activityByDate } = useRoadmap();

  const badges = React.useMemo(
    () => [
      {
        id: 'b1',
        icon: 'flame',
        title: `${streakDays}日連続`,
        description: '1日1回以上の行動を連続で記録した証です。',
        unlocked: streakDays >= 3,
      },
      {
        id: 'b2',
        icon: 'diamond',
        title: '情熱の塊',
        description: 'ストーリー投稿と達成投稿を合計5回以上行うと解放されます。',
        unlocked: totalScore >= 13000,
      },
      {
        id: 'b3',
        icon: 'trophy',
        title: '月間リーダー',
        description: 'レベル20到達で解放される上位バッジです。',
        unlocked: level >= 20,
      },
    ],
    [level, streakDays, totalScore]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 16,
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 60) {
            router.push('/(tabs)/analysis');
          }
        },
      }),
    [router]
  );

  const days = React.useMemo(() => {
    const count = 56;
    return Array.from({ length: count }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (count - 1 - idx));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        level: activityByDate[key] ?? 0,
      };
    });
  }, [activityByDate]);

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View {...panResponder.panHandlers}>
      <Text style={styles.title}>成長ログ</Text>
      <Text style={styles.swipeHint}>右スクロールで次の画面へ</Text>

      <View style={styles.objectiveCard}>
        <Text style={styles.objectiveLabel}>PEAK OBJECTIVE</Text>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.objectiveTitle}>{activeRoadmap.goal}</Text>
            <Text style={styles.objectiveDate}>現在スコア: {totalScore.toLocaleString()} pts</Text>
          </View>
          <View style={styles.objectiveIcon}><Ionicons name='code-slash' size={20} color={theme.colors.onPrimary} /></View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>スキルバランス</Text>
          <Text style={styles.level}>Lv.{level}</Text>
        </View>

        {skills.map((skill) => (
          <View key={skill.label} style={{ marginTop: theme.spacing.md }}>
            <View style={styles.rowBetween}>
              <Text style={styles.skillLabel}>{skill.label}</Text>
              <Text style={styles.percent}>{skill.value}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${skill.value}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLarge}>地層（積み上げ履歴）</Text>
      <View style={styles.heatmapCard}>
        {days.map((item) => (
          <View
            key={item.key}
            style={[
              styles.cell,
              item.level === 0 && styles.cool,
              item.level === 1 && styles.level1,
              item.level === 2 && styles.level2,
              item.level === 3 && styles.level3,
            ]}
          />
        ))}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.level1]} /><Text style={styles.legendText}>行動した</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.level2]} /><Text style={styles.legendText}>ストーリー投稿</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.level3]} /><Text style={styles.legendText}>達成投稿</Text></View>
      </View>

      <Text style={styles.sectionLarge}>獲得バッジ</Text>
      <View style={styles.badgeRow}>
        {badges.map((badge) => (
          <Pressable
            key={badge.id}
            style={[styles.badge, !badge.unlocked && styles.badgeMuted]}
            onPress={() =>
              Alert.alert(
                badge.title,
                `${badge.description}\n\n状態: ${badge.unlocked ? '解放済み' : '未解放'}`
              )
            }
          >
            <Ionicons
              name={badge.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={22}
              color={badge.unlocked ? theme.colors.primary : theme.colors.textSub}
            />
            <Text style={[styles.badgeText, !badge.unlocked && styles.badgeTextMuted]}>{badge.title}</Text>
          </Pressable>
        ))}
      </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  swipeHint: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  objectiveCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  objectiveLabel: {
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  objectiveTitle: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  objectiveDate: {
    color: theme.colors.textSub,
    marginTop: 2,
    fontWeight: '600',
  },
  objectiveIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 26,
  },
  level: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 28,
  },
  skillLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  percent: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  track: {
    marginTop: 8,
    height: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  sectionLarge: {
    ...theme.text.section,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  heatmapCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    ...theme.shadows.soft,
  },
  cell: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  cool: { backgroundColor: theme.colors.surface },
  level1: { backgroundColor: theme.colors.border },
  level2: { backgroundColor: theme.colors.primary },
  level3: { backgroundColor: theme.colors.success },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  badge: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  badgeMuted: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  badgeText: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 12,
  },
  badgeTextMuted: {
    color: theme.colors.textSub,
  },
});
