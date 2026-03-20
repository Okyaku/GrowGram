import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common';
import { theme } from '../../src/theme';

export default function StoryViewScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();

  return (
    <ScreenContainer padded={false}>
      <ImageBackground
        source={{ uri: `https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&sig=${storyId}` }}
        style={styles.hero}
      >
        <View style={styles.topBars}>
          {[1, 2, 3, 4].map((item) => <View key={item} style={[styles.bar, item === 2 && styles.barActive]} />)}
        </View>

        <View style={styles.topRow}>
          <View>
            <Text style={styles.name}>佐藤健太</Text>
            <Text style={styles.time}>2時間前</Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn}><Ionicons name='ellipsis-horizontal' size={16} color={theme.colors.text} /></Pressable>
            <Pressable style={styles.actionBtn}><Ionicons name='close' size={16} color={theme.colors.text} /></Pressable>
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.reactionTitle}>REACTION GUIDE</Text>
          <View style={styles.row}>
            <View style={styles.reactionBox}><Ionicons name='flame' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>情熱</Text><Text style={styles.reactionHint}>長押し</Text></View>
            <View style={styles.reactionBox}><Ionicons name='bulb' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>論理</Text><Text style={styles.reactionHint}>2回タップ</Text></View>
            <View style={styles.reactionBox}><Ionicons name='ribbon' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>一貫性</Text><Text style={styles.reactionHint}>3回タップ</Text></View>
          </View>

          <View style={styles.inputRow}>
            <TextInput placeholder='メッセージを送信...' placeholderTextColor={theme.colors.textSub} style={styles.input} />
            <Pressable style={styles.sendBtn}><Ionicons name='send' size={20} color={theme.colors.white} /></Pressable>
          </View>
        </View>
      </ImageBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBars: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  barActive: {
    backgroundColor: theme.colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  name: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 22,
  },
  time: {
    color: theme.colors.textSub,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  bottomPanel: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  reactionTitle: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  reactionBox: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  reactionLabel: {
    color: theme.colors.text,
    marginTop: 6,
    fontWeight: '700',
  },
  reactionHint: {
    color: theme.colors.primary,
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
