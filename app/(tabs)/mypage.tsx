import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../src/components/common';
import { ScreenContainer } from '../../src/components/common';
import { useRoadmap } from '../../src/store/roadmap-context';
import { theme } from '../../src/theme';

const menus = [
  { label: 'プロフィール編集', route: '/profile-edit' as const, icon: 'person-circle' as const },
  { label: '設定', route: '/settings' as const, icon: 'settings' as const },
];

export default function MyPageScreen() {
  const router = useRouter();
  const { logout } = useRoadmap();

  const onLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

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
        <CustomButton label='プロフィールを編集' onPress={() => router.push('/profile-edit')} style={styles.editProfileButton} />
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

      <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
        <View style={styles.menuLeft}>
          <Ionicons name='log-out' size={18} color={theme.colors.danger} />
          <Text style={styles.logoutText}>ログアウト</Text>
        </View>
        <Ionicons name='chevron-forward' size={18} color={theme.colors.textSub} />
      </Pressable>
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
  editProfileButton: {
    marginTop: theme.spacing.md,
    width: '100%',
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
  logoutItem: {
    borderColor: theme.colors.danger,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: '800',
  },
});
