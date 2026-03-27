import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../src/components/common';
import { theme } from '../src/theme';

export default function AnalysisGuideScreen() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const isLast = step === 1;

  return (
    <ScreenContainer backgroundColor={theme.colors.background}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => (step === 0 ? router.back() : setStep(0))} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>GrowGram操作ガイド</Text>
        <View style={styles.backBtn} />
      </View>

      {step === 0 ? (
        <View style={styles.pageCard}>
          <Text style={styles.pageTitle}>成長を評価する</Text>
          <Text style={styles.pageAccent}>3つのリアクション</Text>
          <Text style={styles.pageSub}>アクションによって評価の種類が変わります</Text>

          <View style={styles.tipItem}>
            <Ionicons name='flame' size={16} color={theme.colors.primary} />
            <View style={styles.tipBody}><Text style={styles.tipTitle}>情熱：パッション</Text><Text style={styles.tipText}>長押しで評価。勢いと取り組みの熱量。</Text></View>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name='flash' size={16} color={theme.colors.primary} />
            <View style={styles.tipBody}><Text style={styles.tipTitle}>論理：ロジック</Text><Text style={styles.tipText}>2タップで評価。計画性と思考の深さ。</Text></View>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name='checkmark-done' size={16} color={theme.colors.primary} />
            <View style={styles.tipBody}><Text style={styles.tipTitle}>継続：コンスタンシー</Text><Text style={styles.tipText}>3タップで評価。日々の積み上げ力。</Text></View>
          </View>
        </View>
      ) : (
        <View style={styles.pageCard}>
          <View style={styles.heroIcon}>
            <Ionicons name='stats-chart' size={44} color={theme.colors.primary} />
          </View>
          <Text style={styles.pageTitle}>データの力で成長を加速</Text>
          <Text style={styles.pageSub}>分析画面の指標を見れば、次の行動が明確になります。</Text>

          <View style={styles.infoCard}><Ionicons name='trending-up' size={16} color={theme.colors.primary} /><Text style={styles.infoText}>カテゴリ別順位で得意/苦手を可視化</Text></View>
          <View style={styles.infoCard}><Ionicons name='trophy' size={16} color={theme.colors.primary} /><Text style={styles.infoText}>ランキングで現在地を把握</Text></View>
          <View style={styles.infoCard}><Ionicons name='calendar' size={16} color={theme.colors.primary} /><Text style={styles.infoText}>日/月/年の切替で推移を確認</Text></View>
        </View>
      )}

      <Pressable
        style={styles.nextBtn}
        onPress={() => {
          if (isLast) {
            router.back();
            return;
          }
          setStep(1);
        }}
      >
        <Text style={styles.nextText}>{isLast ? '閉じる' : '次へ進む'}</Text>
        <Ionicons name='chevron-forward' size={16} color={theme.colors.onPrimary} />
      </Pressable>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pageCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#18345A',
    backgroundColor: '#0F2A4A',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  pageAccent: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  pageSub: {
    color: theme.colors.textSub,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  tipItem: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  tipText: {
    color: theme.colors.textSub,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
  },
  heroIcon: {
    height: 120,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    fontSize: 13,
  },
  nextBtn: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  nextText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
