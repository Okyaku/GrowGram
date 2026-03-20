import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, InputField, ScreenContainer } from '../src/components/common';
import { useRoadmap } from '../src/store/roadmap-context';
import { theme } from '../src/theme';

export default function GoalSetupScreen() {
  const router = useRouter();
  const { roadmaps, activeRoadmap, activeRoadmapId, setActiveRoadmap, moveRoadmap, addRoadmap, updateMilestone } = useRoadmap();

  const [goalInput, setGoalInput] = React.useState('');
  const [mode, setMode] = React.useState<'ai-auto' | 'manual-level'>('ai-auto');
  const [level, setLevel] = React.useState<'easy' | 'normal' | 'hard'>('normal');
  const [editingMilestoneId, setEditingMilestoneId] = React.useState('');
  const [editTitle, setEditTitle] = React.useState('');
  const [editSubtitle, setEditSubtitle] = React.useState('');

  const onAddRoadmap = () => {
    if (!goalInput.trim()) {
      Alert.alert('目標を入力してください', '抽象的な目標でもAIがマイルストーンを作成します。');
      return;
    }

    addRoadmap({ goal: goalInput, mode, level });
    setGoalInput('');
    setMode('ai-auto');
    setLevel('normal');
    Alert.alert('作成しました', '新しいロードマップを追加しました。');
  };

  const onStartEdit = (milestoneId: string, title: string, subtitle: string) => {
    setEditingMilestoneId(milestoneId);
    setEditTitle(title);
    setEditSubtitle(subtitle);
  };

  const onSaveEdit = () => {
    if (!editingMilestoneId) {
      return;
    }
    if (!editTitle.trim() || !editSubtitle.trim()) {
      Alert.alert('入力不足', 'タイトルと補足を入力してください。');
      return;
    }

    updateMilestone({
      roadmapId: activeRoadmap.id,
      milestoneId: editingMilestoneId,
      title: editTitle,
      subtitle: editSubtitle,
    });

    setEditingMilestoneId('');
    setEditTitle('');
    setEditSubtitle('');
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name='chevron-back' size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>目標とAI設定</Text>
        <View style={styles.iconButton} />
      </View>

      <Text style={styles.sectionTitle}>目標一覧</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {roadmaps.map((item) => {
          const active = item.id === activeRoadmapId;
          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveRoadmap(item.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text numberOfLines={1} style={[styles.tabText, active && styles.tabTextActive]}>
                {item.goal}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>現在ある目標</Text>
        {roadmaps.map((item, index) => {
          const active = item.id === activeRoadmapId;
          return (
            <View key={item.id} style={[styles.goalRow, active && styles.goalRowActive]}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalIndex}>#{index + 1}</Text>
                <Text style={styles.goalName} numberOfLines={1}>{item.goal}</Text>
                {active ? <Text style={styles.activeBadge}>選択中</Text> : null}
              </View>
              <View style={styles.goalActions}>
                <Pressable onPress={() => setActiveRoadmap(item.id)} style={styles.iconAction}>
                  <Ionicons name='checkmark-circle' size={18} color={theme.colors.primary} />
                </Pressable>
                <Pressable onPress={() => moveRoadmap(item.id, 'up')} style={styles.iconAction}>
                  <Ionicons name='chevron-up' size={18} color={theme.colors.text} />
                </Pressable>
                <Pressable onPress={() => moveRoadmap(item.id, 'down')} style={styles.iconAction}>
                  <Ionicons name='chevron-down' size={18} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
          );
        })}
        <Text style={styles.helpText}>チェックで切替、矢印で並び順を移動できます。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>新しい目標を追加</Text>
        <InputField
          label='目標（抽象的でもOK）'
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder='例: 海外で働けるフルスタック開発者になる'
        />

        <View style={styles.modeRow}>
          <CustomButton
            label='AIに全て任せる'
            onPress={() => setMode('ai-auto')}
            variant={mode === 'ai-auto' ? 'primary' : 'outline'}
            style={styles.modeButton}
          />
          <CustomButton
            label='レベルを自分で決める'
            onPress={() => setMode('manual-level')}
            variant={mode === 'manual-level' ? 'primary' : 'outline'}
            style={styles.modeButton}
          />
        </View>

        {mode === 'manual-level' ? (
          <View style={styles.levelRow}>
            {(['easy', 'normal', 'hard'] as const).map((item) => (
              <CustomButton
                key={item}
                label={item === 'easy' ? '初級(3)' : item === 'normal' ? '中級(5)' : '上級(7)'}
                onPress={() => setLevel(item)}
                variant={level === item ? 'primary' : 'secondary'}
                style={styles.levelButton}
              />
            ))}
          </View>
        ) : null}

        <CustomButton label='ロードマップを作成' onPress={onAddRoadmap} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>現在の目標のマイルストーン編集</Text>
        {activeRoadmap.milestoneTemplates.map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneSub}>{milestone.subtitle}</Text>
            <CustomButton
              label='編集する'
              onPress={() => onStartEdit(milestone.id, milestone.title, milestone.subtitle)}
              variant='outline'
              style={styles.editButton}
            />
          </View>
        ))}
      </View>

      {editingMilestoneId ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>マイルストーンを編集</Text>
          <InputField label='タイトル' value={editTitle} onChangeText={setEditTitle} />
          <InputField label='補足' value={editSubtitle} onChangeText={setEditSubtitle} />
          <View style={styles.actionRow}>
            <CustomButton label='保存' onPress={onSaveEdit} style={styles.actionBtn} />
            <CustomButton label='キャンセル' onPress={() => setEditingMilestoneId('')} variant='secondary' style={styles.actionBtn} />
          </View>
        </View>
      ) : null}

      <CustomButton label='ロードマップに戻る' onPress={() => router.replace('/(tabs)/create')} />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    marginBottom: 8,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tab: {
    minWidth: 140,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
  },
  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  goalRow: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalIndex: {
    color: theme.colors.textSub,
    width: 26,
    fontWeight: '800',
  },
  goalName: {
    color: theme.colors.text,
    fontWeight: '800',
    flex: 1,
  },
  activeBadge: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: theme.colors.textSub,
    fontSize: 12,
    marginTop: 2,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: theme.spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
  },
  levelRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  levelButton: {
    flex: 1,
    minHeight: 40,
  },
  milestoneCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  milestoneTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  milestoneSub: {
    color: theme.colors.textSub,
    marginTop: 4,
    marginBottom: 8,
  },
  editButton: {
    minHeight: 38,
    width: 100,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
  },
});
