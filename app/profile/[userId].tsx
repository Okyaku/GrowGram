import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

export default function ProfileDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const postCount = 4;

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.pageTitle}>プロフィール</Text>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}><View style={styles.avatar} /></View>
        <Text style={styles.name}>ユーザー {userId}</Text>
        <Text style={styles.bio}>毎日コツコツ積み上げるのが目標です。開発と学習を継続中。</Text>
        <View style={styles.followRow}>
          <View style={styles.followItem}><Text style={styles.followValue}>82</Text><Text style={styles.followLabel}>フォロー中</Text></View>
          <View style={styles.followItem}><Text style={styles.followValue}>124</Text><Text style={styles.followLabel}>フォロワー</Text></View>
          <View style={styles.followItem}><Text style={styles.followValue}>{postCount}</Text><Text style={styles.followLabel}>投稿数</Text></View>
        </View>
        <View style={styles.badgesRow}>
          <View style={styles.badge}><Ionicons name='flame' size={14} color={theme.colors.primary} /><Text style={styles.badgeText}>情熱</Text></View>
          <View style={styles.badge}><Ionicons name='school' size={14} color={theme.colors.primary} /><Text style={styles.badgeText}>学習</Text></View>
          <View style={styles.badge}><Ionicons name='checkmark-circle' size={14} color={theme.colors.success} /><Text style={styles.badgeText}>継続</Text></View>
        </View>
      </View>

      <Text style={styles.section}>過去の投稿（{postCount}件）</Text>
      {Array.from({ length: postCount }).map((_, i) => (
        <View key={i} style={styles.postCard}>
          <Image
            source={{ uri: `https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1000&sig=${i}` }}
            style={styles.image}
          />
          <Text style={styles.postText}>DAY {40 + i}: TypeScript + React Native の学習ログ</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: theme.spacing.sm,
  },
  headerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: theme.colors.surface,
  },
  name: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  bio: {
    color: theme.colors.textSub,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  followRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  followItem: {
    alignItems: 'center',
  },
  followValue: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  followLabel: {
    color: theme.colors.textSub,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    ...theme.text.section,
    marginVertical: theme.spacing.md,
  },
  postCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  image: {
    height: 140,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  postText: {
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: 8,
  },
});
