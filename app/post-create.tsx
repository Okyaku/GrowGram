import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomButton, InputField, ScreenContainer } from '../src/components/common';
import { useRoadmap } from '../src/store/roadmap-context';
import { theme } from '../src/theme';

export default function PostCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ milestoneId?: string }>();
  const { canCreatePost, postCredits, unlockedMilestones, consumePostCredit } = useRoadmap();
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string>('');

  React.useEffect(() => {
    if (unlockedMilestones.length === 0) {
      if (selectedMilestoneId) {
        setSelectedMilestoneId('');
      }
      return;
    }

    const milestoneIdParam = typeof params.milestoneId === 'string' ? params.milestoneId : '';
    const hasParam = milestoneIdParam.length > 0;
    const paramMilestone = hasParam
      ? unlockedMilestones.find((milestone) => milestone.id === milestoneIdParam)
      : undefined;

    if (paramMilestone && selectedMilestoneId !== paramMilestone.id) {
      setSelectedMilestoneId(paramMilestone.id);
      return;
    }

    const selectedStillAvailable = unlockedMilestones.some((milestone) => milestone.id === selectedMilestoneId);
    if (!selectedStillAvailable) {
      setSelectedMilestoneId(unlockedMilestones[0].id);
    }
  }, [params.milestoneId, selectedMilestoneId, unlockedMilestones]);

  const onPost = () => {
    if (!canCreatePost) {
      Alert.alert('投稿できません', 'ロードマップのマイルストーンを達成すると投稿が解放されます。');
      return;
    }

    if (!selectedMilestoneId) {
      Alert.alert('選択してください', '投稿するマイルストーンを選んでください。');
      return;
    }

    const consumed = consumePostCredit(selectedMilestoneId);
    if (!consumed) {
      Alert.alert('投稿できません', '投稿可能回数が不足しています。');
      return;
    }

    Alert.alert('投稿完了', '通常投稿を公開しました。');
    router.back();
  };

  if (!canCreatePost) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>通常投稿</Text>
        <View style={styles.lockCard}>
          <Text style={styles.lockText}>現在は投稿がロック中です。</Text>
          <Text style={styles.lockSub}>ロードマップのマイルストーンをクリアすると投稿できます。</Text>
        </View>
        <CustomButton label='ロードマップを開く' onPress={() => router.replace('/(tabs)/create')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>通常投稿</Text>
      <Text style={styles.credit}>残り投稿可能回数: {postCredits}</Text>

      <Text style={styles.sectionLabel}>投稿可能なマイルストーン</Text>
      {unlockedMilestones.map((milestone) => {
        const selected = milestone.id === selectedMilestoneId;
        return (
          <View key={milestone.id} style={[styles.milestoneCard, selected && styles.milestoneSelected]}>
            <Text style={styles.milestoneRoadmap}>{milestone.roadmapGoal}</Text>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneSub}>{milestone.subtitle}</Text>
            <CustomButton
              label={selected ? '選択中' : 'このマイルストーンで投稿'}
              variant={selected ? 'primary' : 'outline'}
              onPress={() => setSelectedMilestoneId(milestone.id)}
              style={styles.selectButton}
            />
          </View>
        );
      })}

      <InputField label='タイトル' placeholder='例: DAY 46 / 100 CODE' />
      <InputField label='本文' placeholder='取り組み内容を記録...' multiline style={styles.multiline} />
      <InputField label='タグ' placeholder='例: #engine #render' />
      <CustomButton label='通常投稿を公開' onPress={onPost} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: theme.spacing.sm,
  },
  credit: {
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  milestoneCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  milestoneSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  milestoneTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  milestoneRoadmap: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  milestoneSub: {
    color: theme.colors.textSub,
    marginTop: 2,
    marginBottom: theme.spacing.sm,
  },
  selectButton: {
    minHeight: 42,
  },
  multiline: {
    minHeight: 130,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  lockCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  lockText: {
    color: theme.colors.text,
    fontWeight: '900',
    marginBottom: 4,
  },
  lockSub: {
    color: theme.colors.textSub,
    lineHeight: 22,
  },
});
