import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../src/components/common';
import { useRoadmap } from '../src/store/roadmap-context';
import { theme } from '../src/theme';

const settingMenus = [
  { label: '通知', route: '/notifications' as const, icon: 'notifications' as const },
  { label: '利用規約', route: '/legal' as const, icon: 'document-text' as const },
  { label: 'プライバシーポリシー', route: '/legal' as const, icon: 'shield-checkmark' as const },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useRoadmap();

  const onDeleteAccount = () => {
    Alert.alert('アカウント退会', 'この操作は取り消せません。退会しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '退会する',
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name='chevron-back' size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>設定</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.card}>
        {settingMenus.map((menu) => (
          <Pressable key={menu.label} style={styles.menuItem} onPress={() => router.push(menu.route)}>
            <View style={styles.menuLeft}>
              <Ionicons name={menu.icon} size={18} color={theme.colors.primary} />
              <Text style={styles.menuText}>{menu.label}</Text>
            </View>
            <Ionicons name='chevron-forward' size={18} color={theme.colors.textSub} />
          </Pressable>
        ))}
      </View>

      <View style={styles.bottomArea}>
        <Pressable onPress={onDeleteAccount} hitSlop={12}>
          <Text style={styles.deleteLink}>アカウント退会</Text>
        </Pressable>
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
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  menuItem: {
    height: 56,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  menuText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  bottomArea: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  deleteLink: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
