import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { confirmSignUp, fetchUserAttributes, getCurrentUser, resendSignUpCode, signIn } from 'aws-amplify/auth';
import { CustomButton, InputField, ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = String((error as { name?: string }).name ?? '');

    if (name === 'NotAuthorizedException') {
      return 'メールアドレスまたはパスワードが正しくありません。';
    }

    if (name === 'UserNotFoundException') {
      return 'このメールアドレスのアカウントが見つかりません。';
    }

    if (name === 'UserNotConfirmedException') {
      return 'メール確認が完了していません。確認コードを入力してください。';
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
      return '認証処理で不明なエラーが発生しました。メール確認が未完了の場合は確認コードを入力して再試行してください。';
    }
    return error.message;
  }

  return '認証に失敗しました。しばらくしてから再試行してください。';
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

const isUnauthenticatedError = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return false;
  }

  const name = String((error as { name?: unknown }).name ?? '');
  return name === 'UserUnAuthenticatedException' || name === 'NotAuthorizedException';
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const resolvedEmail = attributes.email ?? currentUser.signInDetails?.loginId ?? '';

        if (isMounted) {
          setUserEmail(resolvedEmail);
        }
      } catch (error) {
        // Login screen often loads before authentication; treat that case as expected.
        if (isUnauthenticatedError(error)) {
          if (isMounted) {
            setUserEmail('');
          }
          return;
        }

        if (__DEV__) {
          console.log('[Auth][Login] failed to fetch current user:', getAuthErrorDebugText(error));
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const onLogin = React.useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('入力不足', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setIsSubmitting(true);
      const result = await signIn({
        username: normalizedEmail,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });

      if (result.isSignedIn) {
        router.replace('/(tabs)/home');
        return;
      }

      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setRequiresConfirmation(true);
        Alert.alert('メール確認が必要です', '登録メールに届いた確認コードを入力してください。');
        return;
      }

      Alert.alert('ログイン未完了', '追加の認証ステップが必要です。');
    } catch (error) {
      if (__DEV__) {
        console.log('[Auth][Login] signIn failed:', getAuthErrorDebugText(error));
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'UserNotConfirmedException'
      ) {
        setRequiresConfirmation(true);
        Alert.alert('メール確認が必要です', '確認コードを再送する場合は下のボタンを押してください。');
        return;
      }

      const message = getAuthErrorMessage(error);
      Alert.alert('ログイン失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, router]);

  const onConfirmCode = React.useCallback(async () => {
    if (!email.trim() || !password.trim() || !confirmationCode.trim()) {
      Alert.alert('入力不足', 'メールアドレス・パスワード・確認コードを入力してください。');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setIsSubmitting(true);
      await confirmSignUp({
        username: normalizedEmail,
        confirmationCode: confirmationCode.trim(),
      });

      const loginResult = await signIn({
        username: normalizedEmail,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });

      if (loginResult.isSignedIn) {
        router.replace('/(tabs)/home');
        return;
      }

      Alert.alert('確認完了', 'ログイン処理が未完了です。再度ログインをお試しください。');
    } catch (error) {
      if (__DEV__) {
        console.log('[Auth][Login] confirmSignUp failed:', getAuthErrorDebugText(error));
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
        console.log('[Auth][Login] resendSignUpCode failed:', getAuthErrorDebugText(error));
      }
      const message = getAuthErrorMessage(error);
      Alert.alert('再送信失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

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
      {userEmail ? <Text style={styles.currentUserText}>現在のログインユーザー: {userEmail}</Text> : null}

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
        placeholder='パスワードを入力'
        secureTextEntry
        autoCapitalize='none'
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
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

      <View style={styles.rowRight}>
        <Link href='/(auth)/forgot-password' style={styles.linkText}>パスワードをお忘れですか？</Link>
      </View>

      <CustomButton label='ログイン' onPress={onLogin} loading={isSubmitting} />
      {requiresConfirmation ? (
        <View style={styles.confirmActions}>
          <CustomButton label='確認してログイン' variant='outline' onPress={onConfirmCode} loading={isSubmitting} />
          <View style={{ height: theme.spacing.xs }} />
          <CustomButton label='確認コードを再送' variant='secondary' onPress={onResendCode} loading={isSubmitting} />
        </View>
      ) : null}

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
  currentUserText: {
    color: theme.colors.textSub,
    marginBottom: theme.spacing.md,
    fontSize: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  confirmActions: {
    marginTop: theme.spacing.sm,
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
