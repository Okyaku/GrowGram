import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, ScreenContainer } from '../src/components/common';
import { theme } from '../src/theme';

export default function LegalScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>利用規約とプライバシー</Text>

      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}><Ionicons name='document-text' size={16} color={theme.colors.primary} /><Text style={styles.sectionTitle}>利用規約</Text></View>
        <Text style={styles.bodyText}>GrowGramの利用にあたり、他ユーザーへの誹謗中傷や不適切投稿は禁止です。</Text>
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.sectionHeader}><Ionicons name='shield-checkmark' size={16} color={theme.colors.primary} /><Text style={styles.sectionTitle}>プライバシーポリシー</Text></View>
        <Text style={styles.bodyText}>投稿データ・プロフィール情報はサービス提供と分析改善の目的で利用します。</Text>
      </View>

      <View style={styles.withdrawCard}>
        <Text style={styles.withdrawTitle}>アカウントの退会</Text>
        <Text style={styles.withdrawText}>退会すると、投稿履歴・プロフィール・バッジ情報にアクセスできなくなります。</Text>
        <CustomButton label='アカウント退会' variant='danger' onPress={() => Alert.alert('退会手続き', '退会申請を受け付けました。')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.text.title,
    marginBottom: theme.spacing.md,
  },
  sectionBox: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bodyText: {
    color: theme.colors.textSub,
    lineHeight: 22,
  },
  withdrawCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  withdrawTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 4,
  },
  withdrawText: {
    color: theme.colors.textSub,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
});
