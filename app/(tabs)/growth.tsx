import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

const skills = [
  { label: '情熱 (Passion)', value: 85 },
  { label: '論理 (Logic)', value: 42 },
  { label: '継続 (Consistency)', value: 92 },
];

export default function GrowthScreen() {
  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.title}>成長ログ</Text>

      <View style={styles.objectiveCard}>
        <Text style={styles.objectiveLabel}>PEAK OBJECTIVE</Text>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.objectiveTitle}>Full-stack Developer</Text>
            <Text style={styles.objectiveDate}>Target: October 2025</Text>
          </View>
          <View style={styles.objectiveIcon}><Ionicons name='code-slash' size={20} color={theme.colors.white} /></View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>スキルバランス</Text>
          <Text style={styles.level}>Lv.42</Text>
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
        {Array.from({ length: 56 }).map((_, index) => (
          <View key={index} style={[styles.cell, index % 7 === 0 ? styles.hot : index % 5 === 0 ? styles.mid : styles.cool]} />
        ))}
      </View>

      <Text style={styles.sectionLarge}>獲得バッジ</Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}><Text style={styles.badgeEmoji}>🔥</Text><Text style={styles.badgeText}>7日連続</Text></View>
        <View style={styles.badge}><Text style={styles.badgeEmoji}>⚡️</Text><Text style={styles.badgeText}>情熱の塊</Text></View>
        <View style={[styles.badge, styles.badgeMuted]}><Text style={styles.badgeEmoji}>🏆</Text><Text style={styles.badgeText}>月間リーダー</Text></View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.text.title,
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
  mid: { backgroundColor: theme.colors.border },
  hot: { backgroundColor: theme.colors.primary },
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
    backgroundColor: theme.colors.white,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeText: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: '800',
  },
});
