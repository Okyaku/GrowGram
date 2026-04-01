import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';
import { theme } from '../../src/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        await getCurrentUser();
        if (isMounted) {
          router.replace('/(tabs)/home');
        }
      } catch {
        if (isMounted) {
          router.replace('/(auth)/onboarding');
        }
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}><Ionicons name='flower' size={26} color={theme.colors.primary} /></View>
      <Text style={styles.logo}>GrowGram</Text>
      <Text style={styles.subtitle}>目標達成を毎日の積み上げで可視化</Text>
      <ActivityIndicator color={theme.colors.primary} size='large' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  logo: {
    color: theme.colors.text,
    fontSize: 46,
    fontWeight: '900',
  },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: theme.colors.textSub,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.md,
  },
});
