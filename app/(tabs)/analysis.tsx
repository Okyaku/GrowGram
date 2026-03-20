import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

const leaders = [
  { rank: 1, name: 'Kenji Tanaka', points: 4820 },
  { rank: 2, name: 'Aria Sato', points: 4150 },
  { rank: 3, name: 'Kaito Ito', points: 3980 },
];

export default function AnalysisScreen() {
  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.title}>分析とランキング</Text>

      <View style={styles.segment}>
        <Text style={styles.segmentItem}>日</Text>
        <View style={styles.segmentActive}><Text style={styles.segmentActiveText}>月</Text></View>
        <Text style={styles.segmentItem}>年</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardHeading}>現在の積み上げ</Text>
        <Text style={styles.point}>1,280 pts</Text>
        <View style={styles.deltaPill}>
          <Ionicons name='trending-up' size={13} color={theme.colors.success} />
          <Text style={styles.delta}>+12%</Text>
        </View>
        <View style={styles.graphMock}>
          <View style={styles.graphLine1} />
          <View style={styles.graphLine2} />
        </View>
      </View>

      <Text style={styles.section}>カテゴリ別ランク</Text>
      <View style={styles.rankGrid}>
        <View style={styles.rankCard}><Text style={styles.rankTitle}>情熱</Text><Text style={styles.rankValue}>12位</Text></View>
        <View style={styles.rankCard}><Text style={styles.rankTitle}>論理</Text><Text style={styles.rankValue}>5位</Text></View>
        <View style={styles.rankCard}><Text style={styles.rankTitle}>継続</Text><Text style={styles.rankValue}>8位</Text></View>
      </View>

      <Text style={styles.section}>トップリーダー</Text>
      {leaders.map((leader) => (
        <View key={leader.rank} style={styles.leaderRow}>
          <Text style={styles.leaderRank}>{leader.rank}</Text>
          <Text style={styles.leaderName}>{leader.name}</Text>
          <Text style={styles.leaderPoints}>{leader.points.toLocaleString()} pts</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.text.title,
    marginBottom: theme.spacing.md,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  cardHeading: {
    color: theme.colors.textSub,
    fontWeight: '700',
  },
  segment: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textSub,
    fontWeight: '700',
  },
  segmentActive: {
    flex: 1,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActiveText: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  point: {
    fontSize: 40,
    fontWeight: '900',
    color: theme.colors.text,
    marginTop: 4,
  },
  graphMock: {
    marginTop: theme.spacing.md,
    height: 140,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  graphLine1: {
    height: 4,
    backgroundColor: theme.colors.primary,
    width: '100%',
    borderRadius: 3,
    transform: [{ rotate: '-10deg' }],
  },
  graphLine2: {
    marginTop: 26,
    height: 4,
    backgroundColor: theme.colors.primary,
    width: '75%',
    borderRadius: 3,
    alignSelf: 'flex-end',
    transform: [{ rotate: '14deg' }],
  },
  deltaPill: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  delta: {
    color: theme.colors.success,
    fontWeight: '800',
  },
  section: {
    ...theme.text.section,
    marginBottom: theme.spacing.sm,
  },
  rankGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  rankCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  rankTitle: {
    color: theme.colors.textSub,
    fontWeight: '700',
  },
  rankValue: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  leaderRank: {
    width: 32,
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  leaderName: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  leaderPoints: {
    color: theme.colors.primary,
    fontWeight: '900',
  },
});
