import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

const menus = [
  { label: 'プロフィール編集', route: '/profile-edit' as const, icon: 'person-circle' as const },
  { label: '通知', route: '/notifications' as const, icon: 'notifications' as const },
  { label: '利用規約・プライバシー', route: '/legal' as const, icon: 'document-text' as const },
];

export default function MyPageScreen() {
  const router = useRouter();

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.pageTitle}>設定 / マイページ</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatar} />
        <Text style={styles.name}>佐藤健太</Text>
        <Text style={styles.caption}>Full-stack Developer を目指して学習中</Text>
        <View style={styles.statWrap}>
          <View style={styles.statItem}><Text style={styles.statNumber}>124</Text><Text style={styles.statLabel}>投稿</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>82</Text><Text style={styles.statLabel}>反応</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>210</Text><Text style={styles.statLabel}>積み上げ</Text></View>
        </View>
      </View>

      {menus.map((menu) => (
        <Pressable key={menu.label} style={styles.menuItem} onPress={() => router.push(menu.route)}>
          <View style={styles.menuLeft}>
            <Ionicons name={menu.icon} size={18} color={theme.colors.primary} />
            <Text style={styles.menuText}>{menu.label}</Text>
          </View>
          <Ionicons name='chevron-forward' size={18} color={theme.colors.textSub} />
        </Pressable>
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
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
  },
  caption: {
    color: theme.colors.textSub,
    marginTop: 4,
  },
  statWrap: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: theme.colors.textSub,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 12,
  },
  menuItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 58,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  menuLeft: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  menuText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
