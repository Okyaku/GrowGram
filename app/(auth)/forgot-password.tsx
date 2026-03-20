import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomButton, InputField, ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <Text style={styles.title}>パスワード再発行</Text>
      <Text style={styles.subtitle}>登録済みメールアドレスに再設定リンクを送信します</Text>
      <Text style={styles.help}>受信メール内のリンクから新しいパスワードを設定できます。</Text>

      <InputField label='メールアドレス' placeholder='example@growgram.com' keyboardType='email-address' />

      <CustomButton label='再設定リンクを送信' onPress={() => router.back()} />
      <CustomButton
        label='ログインへ戻る'
        variant='secondary'
        onPress={() => router.back()}
        style={{ marginTop: theme.spacing.sm }}
      />
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
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  help: {
    color: theme.colors.textSub,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
});
