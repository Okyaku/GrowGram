import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { confirmSignUp, resendSignUpCode, signIn, signUp } from 'aws-amplify/auth';
import { CustomButton, InputField, ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = String((error as { name?: string }).name ?? '');

    if (name === 'UsernameExistsException') {
      return 'このメールアドレスは既に登録されています。';
    }

    if (name === 'InvalidPasswordException') {
      return 'パスワード形式が要件を満たしていません。8文字以上で入力してください。';
    }

    if (name === 'CodeMismatchException') {
      return '確認コードが違います。もう一度入力してください。';
    }

    if (name === 'ExpiredCodeException') {
      return '確認コードの有効期限が切れています。再送してください。';
    }

    if (name === 'NetworkError' || name === 'TimeoutError') {
      return 'ネットワークエラーが発生しました。通信環境を確認してください。';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message === 'An unknown error has occurred.') {
      return '認証処理で不明なエラーが発生しました。少し時間を空けて再試行してください。';
    }
    return error.message;
  }

  return '認証処理に失敗しました。しばらくしてから再試行してください。';
};

const getAuthErrorDebugText = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : '';
    const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
    const underlying =
      'underlyingError' in error
        ? (error as { underlyingError?: unknown }).underlyingError
        : undefined;
    const underlyingMessage =
      typeof underlying === 'object' && underlying !== null && 'message' in underlying
        ? String((underlying as { message?: unknown }).message ?? '')
        : typeof underlying === 'string'
          ? underlying
          : '';
    return [name, message, underlyingMessage].filter(Boolean).join(': ');
  }
  return typeof error === 'string' ? error : 'unknown';
};

export default function SignUpScreen() {
  const router = useRouter();
  const [nickname, setNickname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = React.useState(false);

  const onSignUp = React.useCallback(async () => {
    if (!nickname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('入力不足', 'すべての項目を入力してください。');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('確認エラー', 'パスワード確認が一致しません。');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setIsSubmitting(true);
      const result = await signUp({
        username: normalizedEmail,
        password,
        options: {
          userAttributes: {
            email: normalizedEmail,
          },
        },
      });

      if (result.isSignUpComplete) {
        await signIn({
          username: normalizedEmail,
          password,
          options: {
            authFlowType: 'USER_PASSWORD_AUTH',
          },
        });
        router.replace('/(tabs)/home');
        return;
      }

      setRequiresConfirmation(true);
      Alert.alert('確認コードを送信しました', 'メールに届いた6桁コードを入力してください。');
    } catch (error) {
      if (__DEV__) {
        console.log('[Auth][SignUp] signUp failed:', getAuthErrorDebugText(error));
      }
      const message = getAuthErrorMessage(error);
      Alert.alert('登録失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmPassword, email, nickname, password, router]);

  const onConfirmSignUp = React.useCallback(async () => {
    if (!email.trim() || !confirmationCode.trim()) {
      Alert.alert('入力不足', 'メールアドレスと確認コードを入力してください。');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setIsSubmitting(true);
      await confirmSignUp({
        username: normalizedEmail,
        confirmationCode: confirmationCode.trim(),
      });

      const signInResult = await signIn({
        username: normalizedEmail,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });
      if (signInResult.isSignedIn) {
        router.replace('/(tabs)/home');
        return;
      }

      Alert.alert('確認完了', 'ログイン画面からサインインしてください。');
      router.replace('/(auth)/login');
    } catch (error) {
      if (__DEV__) {
        console.log('[Auth][SignUp] confirmSignUp failed:', getAuthErrorDebugText(error));
      }
      const message = getAuthErrorMessage(error);
      Alert.alert('確認失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmationCode, email, password, router]);

  const onResendCode = React.useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('入力不足', 'メールアドレスを入力してください。');
      return;
    }

    try {
      setIsSubmitting(true);
      await resendSignUpCode({ username: email.trim().toLowerCase() });
      Alert.alert('再送信しました', '確認コードをメールで再送しました。');
    } catch (error) {
      if (__DEV__) {
        console.log('[Auth][SignUp] resendSignUpCode failed:', getAuthErrorDebugText(error));
      }
      const message = getAuthErrorMessage(error);
      Alert.alert('再送信失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>新規登録</Text>
      <Text style={styles.subtitle}>アカウントを作成して、今日から積み上げを始めましょう</Text>

      <InputField label='ニックネーム' placeholder='例: 佐藤健太' value={nickname} onChangeText={setNickname} />
      <InputField
        label='メールアドレス'
        placeholder='example@growgram.com'
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      <InputField
        label='パスワード'
        placeholder='8文字以上で入力'
        secureTextEntry
        autoCapitalize='none'
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />
      <InputField
        label='パスワード確認'
        placeholder='もう一度入力'
        secureTextEntry
        autoCapitalize='none'
        autoCorrect={false}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {requiresConfirmation ? (
        <InputField
          label='確認コード（6桁）'
          placeholder='メールのコードを入力'
          keyboardType='number-pad'
          autoCapitalize='none'
          autoCorrect={false}
          value={confirmationCode}
          onChangeText={setConfirmationCode}
        />
      ) : null}

      <Text style={styles.terms}>登録することで利用規約とプライバシーポリシーに同意したものとみなされます。</Text>

      {requiresConfirmation ? (
        <>
          <CustomButton label='確認して開始' onPress={onConfirmSignUp} loading={isSubmitting} />
          <View style={{ height: theme.spacing.sm }} />
          <CustomButton label='確認コードを再送' variant='secondary' onPress={onResendCode} loading={isSubmitting} />
        </>
      ) : (
        <CustomButton label='アカウント作成' onPress={onSignUp} loading={isSubmitting} />
      )}
      <View style={{ height: theme.spacing.sm }} />
      <CustomButton label='ログインへ戻る' variant='outline' onPress={() => router.back()} disabled={isSubmitting} />
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
