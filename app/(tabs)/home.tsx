import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, ScreenContainer } from '../../src/components/common';
import { useRoadmap } from '../../src/store/roadmap-context';
import { theme } from '../../src/theme';

const stories = [
  {
    id: 'my-story',
    userName: 'MY GROW',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    active: true,
  },
  {
    id: 'p1',
    userName: 'ALEX_DEV',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    active: false,
  },
  {
    id: 'p2',
    userName: 'MIND_SET',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    active: false,
  },
];

const posts = [
  {
    id: 'p1',
    userId: 'u1',
    userName: 'ALEX_DEV',
    title: 'DAY 45 / 100 CODE',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000',
    log: 'Cracked custom UI rendering logic. Payoff in progress.',
    passion: 124,
    logic: 82,
    routine: 210,
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: 'MIND_SET',
    title: 'DEEP WORK - SESSION 05',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000',
    log: 'Mapping architecture. System logic finalized.',
    passion: 45,
    logic: 312,
    routine: 12,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { canCreatePost, postCredits } = useRoadmap();

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Ionicons name='flash' size={22} color={theme.colors.primary} />
          <Text style={styles.heading}>GROWGRAM</Text>
        </View>
        <Ionicons name='notifications' size={20} color={theme.colors.textSub} />
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>継続日数</Text>
          <Text style={styles.statValue}>45日</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>現在のレベル</Text>
          <Text style={styles.statValueDark}>Lv.12</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>獲得スコア</Text>
          <Text style={styles.statValue}>12,450 pts</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
      >
        {stories.map((story) => (
          <Pressable
            key={story.id}
            style={styles.storyItem}
            onPress={() => router.push(story.id === 'my-story' ? '/story-create' : `/story/${story.id}`)}
          >
            <View style={[styles.storyRing, story.active && styles.storyRingActive]}>
              <Image source={{ uri: story.image }} style={styles.storyAvatar} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>{story.userName}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <CustomButton
          label='ストーリー投稿'
          onPress={() => router.push('/story-create')}
          style={styles.actionButton}
        />
        <CustomButton
          label={canCreatePost ? `通常投稿 (${postCredits})` : '通常投稿 (LOCKED)'}
          onPress={() => router.push(canCreatePost ? '/post-create' : '/(tabs)/create')}
          variant={canCreatePost ? 'outline' : 'secondary'}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.protocolCard}>
        <Text style={styles.protocolTitle}>EVALUATION PROTOCOL</Text>
        <Text style={styles.protocolSub}>Consistency is key. Rate based on effort.</Text>
        <View style={styles.protocolRow}>
          <View style={styles.protocolItem}><Text style={styles.protocolEmoji}>🔥</Text><Text style={styles.protocolText}>PASSION</Text></View>
          <View style={styles.protocolItem}><Text style={styles.protocolEmoji}>🌀</Text><Text style={styles.protocolText}>LOGIC</Text></View>
          <View style={styles.protocolItem}><Text style={styles.protocolEmoji}>☰</Text><Text style={styles.protocolText}>ROUTINE</Text></View>
        </View>
      </View>

      {posts.map((post) => (
        <Pressable key={post.id} style={styles.card} onPress={() => router.push(`/story/${post.id}`)}>
          <View style={styles.cardHeader}>
            <Pressable onPress={() => router.push(`/profile/${post.userId}`)}>
              <Text style={styles.user}>{post.userName}</Text>
            </Pressable>
            <Ionicons name='settings' size={16} color={theme.colors.textSub} />
          </View>

          <Text style={styles.day}>{post.title}</Text>
          <Image source={{ uri: post.image }} style={styles.image} />

          <View style={styles.metrics}>
            <Text style={styles.metric}>🔥 {post.passion}</Text>
            <Text style={styles.metric}>💎 {post.logic}</Text>
            <Text style={styles.metric}>✅ {post.routine}</Text>
          </View>

          <Text style={styles.logLabel}>LOG:</Text>
          <Text style={styles.log}>{post.log}</Text>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.text,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  storyList: {
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  storyItem: {
    width: 72,
    alignItems: 'center',
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  storyRingActive: {
    borderColor: theme.colors.primary,
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  storyName: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 68,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
  statLabel: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  statValueDark: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  protocolCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  protocolTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    letterSpacing: 1,
  },
  protocolSub: {
    color: theme.colors.textSub,
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  protocolRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  protocolItem: {
    flex: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  protocolEmoji: {
    fontSize: 16,
  },
  protocolText: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  user: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  day: {
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  metrics: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  metric: {
    color: theme.colors.textSub,
    fontWeight: '700',
  },
  logLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  log: {
    marginTop: 2,
    color: theme.colors.text,
    lineHeight: 22,
  },
});
