import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomButton, InputField, ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <Text style={styles.title}>新規登録</Text>
      <Text style={styles.subtitle}>アカウントを作成して、今日から積み上げを始めましょう</Text>

      <InputField label='ニックネーム' placeholder='例: 佐藤健太' />
      <InputField label='メールアドレス' placeholder='example@growgram.com' keyboardType='email-address' />
      <InputField label='パスワード' placeholder='8文字以上で入力' secureTextEntry />
      <InputField label='パスワード確認' placeholder='もう一度入力' secureTextEntry />

      <Text style={styles.terms}>登録することで利用規約とプライバシーポリシーに同意したものとみなされます。</Text>

      <CustomButton label='アカウント作成' onPress={() => router.replace('/(tabs)/home')} />
      <View style={{ height: theme.spacing.sm }} />
      <CustomButton label='ログインへ戻る' variant='outline' onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.text.title,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    ...theme.text.caption,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  terms: {
    color: theme.colors.textSub,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
});
