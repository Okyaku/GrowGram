import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../src/components/common';
import { useRoadmap } from '../src/store/roadmap-context';
import { theme } from '../src/theme';

export default function NotificationsScreen() {
  const { notifications } = useRoadmap();

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.title}>通知</Text>
      {notifications.map((item, i) => (
        <View style={styles.card} key={i}>
          <View style={styles.avatar}><Ionicons name='person' size={14} color={theme.colors.textSub} /></View>
          <View style={styles.body}>
            <Text style={styles.item}>{item.message}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Ionicons name='chevron-forward' size={16} color={theme.colors.textSub} />
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...theme.text.title,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    ...theme.shadows.soft,
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  item: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  time: {
    color: theme.colors.textSub,
    fontSize: 12,
    marginTop: 4,
  },
});
