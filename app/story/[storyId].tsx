import React from 'react';
import { ActivityIndicator, Alert, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import { ScreenContainer } from '../../src/components/common';
import { useRoadmap } from '../../src/store/roadmap-context';
import { theme } from '../../src/theme';

type CloudStory = {
  id: string;
  owner?: string | null;
  imageKey: string;
  caption?: string | null;
  createdAt?: string | null;
};

type CloudProfile = {
  id: string;
  owner?: string | null;
  username?: string | null;
  iconImageKey?: string | null;
};

type StoryReaction = {
  id: string;
  storyId: string;
  owner?: string | null;
  reactionType?: string | null;
};

type ReactionType = 'passion' | 'logic' | 'routine';

const getStoryQuery = /* GraphQL */ `
  query GetStory($id: ID!) {
    getStory(id: $id) {
      id
      owner
      imageKey
      caption
      createdAt
    }
  }
`;

const getProfileQuery = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
      id
      owner
      username
      iconImageKey
    }
  }
`;

const listProfilesQuery = /* GraphQL */ `
  query ListProfiles {
    listProfiles(limit: 1000) {
      items {
        id
        owner
        username
      }
    }
  }
`;

const listStoryReactionsQuery = /* GraphQL */ `
  query ListStoryReactions {
    listStoryReactions(limit: 1000) {
      items {
        id
        storyId
        owner
        reactionType
      }
    }
  }
`;

const createStoryReactionMutation = /* GraphQL */ `
  mutation CreateStoryReaction($input: CreateStoryReactionInput!) {
    createStoryReaction(input: $input) {
      id
      storyId
      reactionType
    }
  }
`;

const deleteStoryReactionMutation = /* GraphQL */ `
  mutation DeleteStoryReaction($input: DeleteStoryReactionInput!) {
    deleteStoryReaction(input: $input) {
      id
    }
  }
`;

const createDirectMessageMutation = /* GraphQL */ `
  mutation CreateDirectMessage($input: CreateDirectMessageInput!) {
    createDirectMessage(input: $input) {
      id
    }
  }
`;

export default function StoryViewScreen() {
  const router = useRouter();
  const client = React.useMemo(() => generateClient(), []);
  const { recordDailyActivity, adjustScore } = useRoadmap();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [story, setStory] = React.useState<CloudStory | null>(null);
  const [profile, setProfile] = React.useState<CloudProfile | null>(null);
  const [recipientUserId, setRecipientUserId] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200');
  const [reactionRecordIdByType, setReactionRecordIdByType] = React.useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const [gestureFeedback, setGestureFeedback] = React.useState<{
    label: string;
    icon: 'flame' | 'bulb' | 'ribbon';
    backgroundColor: string;
    borderColor: string;
  } | null>(null);
  const tapStateRef = React.useRef<{ count: number; timer?: ReturnType<typeof setTimeout> }>({ count: 0 });
  const feedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        setIsLoading(true);
        const storyResponse = await client.graphql({ query: getStoryQuery, variables: { id: storyId } });
        const loadedStory = (storyResponse as { data?: { getStory?: CloudStory | null } }).data?.getStory;

        if (!loadedStory) {
          setStory(null);
          return;
        }
        setStory(loadedStory);

        if (loadedStory.imageKey) {
          try {
            const resolved = await getUrl({ path: loadedStory.imageKey });
            setImageUrl(resolved.url.toString());
          } catch {
            setImageUrl('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200');
          }
        }

        if (loadedStory.owner) {
          try {
            const profileResponse = await client.graphql({ query: getProfileQuery, variables: { id: loadedStory.owner } });
            const loadedProfile = (profileResponse as { data?: { getProfile?: CloudProfile | null } }).data?.getProfile;
            if (loadedProfile?.id) {
              setProfile(loadedProfile);
              setRecipientUserId(loadedProfile.id);
            } else {
              const profileListResponse = await client.graphql({ query: listProfilesQuery });
              const profiles =
                (profileListResponse as { data?: { listProfiles?: { items?: Array<CloudProfile | null> } } }).data
                  ?.listProfiles?.items ?? [];
              const matched = profiles.find((item) => item?.owner === loadedStory.owner) ?? null;
              setProfile(matched ?? null);
              setRecipientUserId(matched?.id ?? loadedStory.owner);
            }
          } catch {
            setProfile(null);
            setRecipientUserId(loadedStory.owner);
          }
        }

        try {
          const currentUser = await getCurrentUser();
          setCurrentUserId(currentUser.userId);
          const reactionsResponse = await client.graphql({ query: listStoryReactionsQuery });
          const items =
            (reactionsResponse as { data?: { listStoryReactions?: { items?: Array<StoryReaction | null> } } }).data
              ?.listStoryReactions?.items ?? [];

          const mine: Record<string, string> = {};
          items
            .filter((item): item is StoryReaction => Boolean(item?.id && item.storyId && item.reactionType))
            .filter((item) => item.storyId === loadedStory.id && item.owner === currentUser.username)
            .forEach((item) => {
              if (item.reactionType) {
                mine[item.reactionType] = item.id;
              }
            });
          setReactionRecordIdByType(mine);
        } catch {
          setReactionRecordIdByType({});
        }
      } catch (error) {
        console.error('[StoryView] failed to load story:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [client, storyId]);

  const displayName = profile?.username || (story?.owner ?? 'USER').split('@')[0].toUpperCase();
  const created = story?.createdAt ? new Date(story.createdAt) : null;
  const timeLabel = created ? `${created.getMonth() + 1}/${created.getDate()} ${created.getHours()}:${`${created.getMinutes()}`.padStart(2, '0')}` : 'たった今';

  const toggleStoryReaction = React.useCallback(async (reactionType: ReactionType) => {
    if (!story?.id) {
      return;
    }

    try {
      const existingId = reactionRecordIdByType[reactionType];
      if (existingId) {
        await client.graphql({ query: deleteStoryReactionMutation, variables: { input: { id: existingId } } });
        adjustScore(-30);
        setReactionRecordIdByType((prev) => {
          const next = { ...prev };
          delete next[reactionType];
          return next;
        });
      } else {
        const response = await client.graphql({
          query: createStoryReactionMutation,
          variables: { input: { storyId: story.id, reactionType } },
        });
        const createdId =
          (response as { data?: { createStoryReaction?: { id?: string } } }).data?.createStoryReaction?.id ?? '';
        if (createdId) {
          setReactionRecordIdByType((prev) => ({ ...prev, [reactionType]: createdId }));
          recordDailyActivity('action');
          adjustScore(30);
        }
      }
    } catch (error) {
      console.error('[StoryView] failed to toggle reaction:', error);
    }
  }, [adjustScore, client, reactionRecordIdByType, recordDailyActivity, story?.id]);

  const showGestureFeedback = React.useCallback((type: ReactionType) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    if (type === 'passion') {
      setGestureFeedback({
        label: '情熱',
        icon: 'flame',
        backgroundColor: '#FF6A3D',
        borderColor: '#FFC1AE',
      });
    }
    if (type === 'logic') {
      setGestureFeedback({
        label: '論理',
        icon: 'bulb',
        backgroundColor: '#2C7BFF',
        borderColor: '#B8D2FF',
      });
    }
    if (type === 'routine') {
      setGestureFeedback({
        label: '一貫性',
        icon: 'ribbon',
        backgroundColor: '#10A37F',
        borderColor: '#A7E3D4',
      });
    }

    feedbackTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 650);
  }, []);

  const clearTapState = React.useCallback(() => {
    if (tapStateRef.current.timer) {
      clearTimeout(tapStateRef.current.timer);
    }
    tapStateRef.current = { count: 0 };
  }, []);

  const onStoryLongPress = React.useCallback(() => {
    clearTapState();
    showGestureFeedback('passion');
    void toggleStoryReaction('passion');
  }, [clearTapState, showGestureFeedback, toggleStoryReaction]);

  const onStoryTap = React.useCallback(() => {
    const state = tapStateRef.current;
    if (state.timer) {
      clearTimeout(state.timer);
    }
    state.count += 1;
    state.timer = setTimeout(() => {
      const count = state.count;
      tapStateRef.current = { count: 0 };
      if (count >= 3) {
        showGestureFeedback('routine');
        void toggleStoryReaction('routine');
        return;
      }
      if (count === 2) {
        showGestureFeedback('logic');
        void toggleStoryReaction('logic');
      }
    }, 280);
  }, [showGestureFeedback, toggleStoryReaction]);

  const onSendStoryMessage = React.useCallback(async () => {
    if (!story?.id || !recipientUserId || !currentUserId || isSendingMessage) {
      return;
    }
    if (recipientUserId === currentUserId) {
      Alert.alert('送信不可', '自分のストーリーには送信できません。');
      return;
    }
    if (!message.trim()) {
      Alert.alert('入力してください', 'メッセージを入力してください。');
      return;
    }

    try {
      setIsSendingMessage(true);
      await client.graphql({
        query: createDirectMessageMutation,
        variables: {
          input: {
            fromUserId: currentUserId,
            toUserId: recipientUserId,
            body: message.trim(),
            storyId: story.id,
            storyCaption: story.caption ?? null,
          },
        },
      });
      setMessage('');
      router.push(`/chat/${recipientUserId}`);
    } catch (error) {
      console.error('[StoryView] failed to send story message:', error);
      Alert.alert('送信失敗', 'メッセージ送信に失敗しました。');
    } finally {
      setIsSendingMessage(false);
    }
  }, [client, currentUserId, isSendingMessage, message, recipientUserId, router, story?.caption, story?.id]);

  React.useEffect(() => {
    return () => {
      if (tapStateRef.current.timer) {
        clearTimeout(tapStateRef.current.timer);
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>ストーリーを読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!story) {
    return (
      <ScreenContainer>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>ストーリーが見つかりませんでした。</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode='contain'
        >
          <Pressable style={styles.heroOverlay} onPress={onStoryTap} onLongPress={onStoryLongPress}>
            <View style={styles.topBars}>
              {[1, 2, 3, 4].map((item) => <View key={item} style={[styles.bar, item === 2 && styles.barActive]} />)}
            </View>

            <View style={styles.topRow}>
              <View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.time}>{timeLabel}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.actionBtn}><Ionicons name='ellipsis-horizontal' size={16} color={theme.colors.text} /></Pressable>
                <Pressable style={styles.actionBtn} onPress={() => router.back()}><Ionicons name='close' size={16} color={theme.colors.text} /></Pressable>
              </View>
            </View>
            {gestureFeedback ? (
              <View
                style={[
                  styles.gesturePopup,
                  {
                    backgroundColor: gestureFeedback.backgroundColor,
                    borderColor: gestureFeedback.borderColor,
                  },
                ]}
              >
                <Ionicons name={gestureFeedback.icon} size={20} color={theme.colors.onPrimary} />
                <Text style={styles.gesturePopupText}>{gestureFeedback.label}</Text>
              </View>
            ) : null}
          </Pressable>
        </ImageBackground>

        <View style={styles.bottomPanel}>
          {story.caption ? <Text style={styles.caption}>{story.caption}</Text> : null}
          <Text style={styles.reactionTitle}>REACTION GUIDE</Text>
          <Text style={styles.reactionGuideHint}>長押し: 情熱 / 2回タップ: 論理 / 3回タップ: 一貫性</Text>
          <View style={styles.row}>
            <View style={[styles.reactionBox, reactionRecordIdByType.passion && styles.reactionBoxActive]}><Ionicons name='flame' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>情熱</Text><Text style={styles.reactionHint}>長押し</Text></View>
            <View style={[styles.reactionBox, reactionRecordIdByType.logic && styles.reactionBoxActive]}><Ionicons name='bulb' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>論理</Text><Text style={styles.reactionHint}>2回タップ</Text></View>
            <View style={[styles.reactionBox, reactionRecordIdByType.routine && styles.reactionBoxActive]}><Ionicons name='ribbon' size={18} color={theme.colors.primary} /><Text style={styles.reactionLabel}>一貫性</Text><Text style={styles.reactionHint}>3回タップ</Text></View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder='ストーリー参照でメッセージを送信'
              placeholderTextColor={theme.colors.textSub}
              style={styles.input}
            />
            <Pressable
              style={[styles.sendBtn, isSendingMessage && styles.sendBtnDisabled]}
              onPress={() => void onSendStoryMessage()}
              disabled={isSendingMessage}
            >
              <Ionicons name='send' size={20} color={theme.colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    width: '100%',
    aspectRatio: 9 / 13,
    justifyContent: 'space-between',
    backgroundColor: '#111111',
  },
  heroImage: {
    resizeMode: 'contain',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  gesturePopup: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  gesturePopupText: {
    color: theme.colors.onPrimary,
    fontWeight: '900',
    fontSize: 15,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  backButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: theme.colors.onPrimary,
    fontWeight: '800',
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
    color: theme.colors.white,
    fontWeight: '900',
    fontSize: 22,
  },
  time: {
    color: theme.colors.white,
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
    flex: 1,
  },
  caption: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  reactionTitle: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  reactionGuideHint: {
    textAlign: 'center',
    color: theme.colors.textSub,
    fontSize: 11,
    fontWeight: '700',
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
  reactionBoxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
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
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
