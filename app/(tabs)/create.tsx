import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { CustomButton, ScreenContainer } from '../../src/components/common';
import { useRoadmap } from '../../src/store/roadmap-context';
import { theme } from '../../src/theme';

export default function CreateScreen() {
  const router = useRouter();
  const { activeRoadmap, milestones, activePostCredits, activeUnlockedMilestones, clearCurrentMilestone } = useRoadmap();

  const renderMilestones = milestones.slice(0, 5).reverse();
  const milestonePositions = [
    { top: 60, left: 160 },
    { top: 220, left: 18 },
    { top: 390, left: 185 },
    { top: 560, left: 30 },
    { top: 700, left: 170 },
  ];

  const onClear = () => {
    const current = milestones.find((milestone) => milestone.status === 'current');
    if (!current) {
      Alert.alert('ロードマップ完了', 'すべてのマイルストーンを達成済みです。');
      return;
    }
    clearCurrentMilestone();
    Alert.alert('マイルストーン達成', '通常投稿が1回解放されました。');
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Ionicons name='sparkles' size={22} color={theme.colors.primary} />
          <Text style={styles.brandText}>GrowGram AI</Text>
        </View>
        <Pressable style={styles.gear} onPress={() => router.push('/goal-setup')}>
          <Ionicons name='settings' size={18} color={theme.colors.textSub} />
        </Pressable>
      </View>

      <Text style={styles.objectiveLabel}>PEAK OBJECTIVE</Text>
      <View style={styles.objectiveCard}>
        <View style={styles.rowBetween}>
          <View style={styles.objectiveTextWrap}>
            <Text style={styles.objectiveTitle} numberOfLines={1}>{activeRoadmap.goal}</Text>
            <Text style={styles.objectiveDate}>
              {activeRoadmap.mode === 'ai-auto' ? 'AI自動生成ロードマップ' : `レベル: ${activeRoadmap.level}`}
            </Text>
          </View>
          <View style={styles.objectiveIcon}><Ionicons name='desktop-outline' size={20} color={theme.colors.onPrimary} /></View>
        </View>
      </View>

      <Text style={styles.creditText}>この目標で投稿可能: {activePostCredits} 回</Text>
      {activePostCredits > 0 ? (
        <View style={styles.noticeCard}>
          <Ionicons name='notifications' size={14} color={theme.colors.primary} />
          <Text style={styles.noticeText} numberOfLines={1}>投稿できます: {activeUnlockedMilestones.map((item) => item.title).join(' / ')}</Text>
        </View>
      ) : null}

      <View style={styles.roadmapWrap}>
        <Svg style={styles.pathLayer} viewBox='0 0 360 860' preserveAspectRatio='none'>
          <Path
            d='M220 20 C130 90, 60 160, 70 270 C80 380, 280 390, 300 510 C320 640, 120 650, 160 850'
            stroke={theme.colors.border}
            strokeWidth={56}
            fill='none'
            strokeLinecap='round'
          />
          <Path
            d='M220 20 C130 90, 60 160, 70 270 C80 380, 280 390, 300 510 C320 640, 120 650, 160 850'
            stroke={theme.colors.primary}
            strokeOpacity={0.35}
            strokeDasharray='16 14'
            strokeWidth={5}
            fill='none'
            strokeLinecap='round'
          />
        </Svg>

        {renderMilestones.map((milestone, index) => {
          const pos = milestonePositions[index] ?? { top: 60 + index * 140, left: index % 2 === 0 ? 170 : 20 };
          const canTap = milestone.status === 'completed';

          return (
            <View key={milestone.id} style={[styles.nodeGroup, { top: pos.top, left: pos.left }]}> 
              <View style={[styles.nodeIcon, milestone.status === 'completed' && styles.nodeCompleted, milestone.status === 'current' && styles.nodeCurrent]}>
                <Ionicons
                  name={milestone.status === 'completed' ? 'checkmark' : milestone.status === 'current' ? 'flash' : 'lock-closed'}
                  size={16}
                  color={milestone.status === 'completed' || milestone.status === 'current' ? theme.colors.onPrimary : theme.colors.textSub}
                />
              </View>
              <Pressable
                style={[
                  styles.nodeCard,
                  milestone.status === 'current' && styles.nodeCardCurrent,
                  milestone.status === 'locked' && styles.nodeCardLocked,
                  canTap && styles.nodeCardTap,
                ]}
                disabled={!canTap}
                onPress={() => router.push({ pathname: '/post-create', params: { milestoneId: milestone.id } })}
              >
                <Text style={[styles.nodeStatus, milestone.status === 'current' && styles.currentText, milestone.status === 'completed' && styles.completeText]}>
                  {milestone.status === 'current' ? 'CURRENT' : milestone.status === 'completed' ? 'COMPLETED' : 'LOCKED'}
                </Text>
                <Text style={styles.nodeTitle}>{milestone.title}</Text>
                <Text style={styles.nodeSub}>{milestone.subtitle}</Text>
                {canTap ? <Text style={styles.tapHint}>タップして投稿</Text> : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.bottomActions}>
        <CustomButton label='目標を設定・追加' variant='outline' onPress={() => router.push('/goal-setup')} style={styles.inlineAction} />
        <CustomButton label='現在のマイルストーンをクリア' onPress={onClear} style={styles.inlineAction} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  gear: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveLabel: {
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  objectiveCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  objectiveTextWrap: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectiveTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  objectiveDate: {
    color: theme.colors.textSub,
    fontSize: 14,
    marginTop: 4,
  },
  objectiveIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditText: {
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  noticeCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  roadmapWrap: {
    height: 860,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  pathLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  nodeGroup: {
    position: 'absolute',
    width: 220,
    alignItems: 'center',
  },
  nodeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...theme.shadows.soft,
  },
  nodeCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  nodeCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  nodeCard: {
    width: 220,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  nodeCardCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  nodeCardLocked: {
    opacity: 0.78,
  },
  nodeCardTap: {
    borderColor: theme.colors.success,
  },
  nodeStatus: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  currentText: {
    color: theme.colors.primary,
  },
  completeText: {
    color: theme.colors.success,
  },
  nodeTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  nodeSub: {
    color: theme.colors.textSub,
    fontSize: 14,
    marginTop: 4,
  },
  tapHint: {
    color: theme.colors.success,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  inlineAction: {
    flex: 1,
    minHeight: 48,
  },
});
