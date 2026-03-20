import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, InputField, ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}><Ionicons name='flower' size={18} color={theme.colors.primary} /></View>
        <Text style={styles.brandText}>GrowGram</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTag}>COMMUNITY</Text>
      </View>

      <Text style={styles.title}>おかえりなさい</Text>
      <Text style={styles.subtitle}>GrowGramにログインして、積み上げを続けましょう</Text>

      <InputField label='メールアドレス' placeholder='example@growgram.com' keyboardType='email-address' />
      <InputField label='パスワード' placeholder='パスワードを入力' secureTextEntry />

      <View style={styles.rowRight}>
        <Link href='/(auth)/forgot-password' style={styles.linkText}>パスワードをお忘れですか？</Link>
      </View>

      <CustomButton label='ログイン' onPress={() => router.replace('/(tabs)/home')} />

      <View style={styles.separatorRow}>
        <View style={styles.separator} />
        <Text style={styles.separatorText}>または</Text>
        <View style={styles.separator} />
      </View>

      <View style={styles.socialRow}>
        <CustomButton label='Google' variant='secondary' onPress={() => {}} style={styles.socialButton} textStyle={styles.socialText} />
        <CustomButton label='LINE' variant='secondary' onPress={() => {}} style={styles.socialButton} textStyle={styles.socialText} />
      </View>

      <Pressable style={styles.signUpRow} onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.note}>アカウントをお持ちでないですか？</Text>
        <Text style={styles.signUpLink}> 新規登録</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '900',
  },
  heroCard: {
    height: 120,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  heroTag: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    ...theme.text.title,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.text.caption,
    marginBottom: theme.spacing.lg,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.lg,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  separatorText: {
    color: theme.colors.textSub,
    fontSize: theme.typography.caption,
  },
  socialRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  socialButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  socialText: {
    color: theme.colors.text,
  },
  signUpRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  note: {
    color: theme.colors.textSub,
  },
  signUpLink: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
});
