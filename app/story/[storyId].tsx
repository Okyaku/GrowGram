import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  GestureResponderEvent,
  Image,
  ImageBackground,
  Pressable,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text, TextInput } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CloudStory = {
  id: string;
  owner?: string | null;
  imageKey: string;
  caption?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CloudProfile = {
  id: string;
  owner?: string | null;
  username?: string | null;
  displayName?: string | null;
  iconImageKey?: string | null;
};

type StoryReaction = {
  id: string;
  storyId: string;
  owner?: string | null;
  reactionType?: string | null;
};

type ReactionType = "passion" | "logic" | "routine";
type StoryQueueItem = CloudStory & { imageUrl: string };

const STORY_DURATION_MS = 5000;
const STORY_EXPIRATION_MS = 24 * 60 * 60 * 1000;
const STORY_CLOSE_SWIPE_THRESHOLD = 80;
const STORY_VIEWED_STORAGE_KEY = "story-viewed-by-owner-v1";
const STORY_PLACEHOLDER_URL =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200";
const AVATAR_PLACEHOLDER_URL =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

const readViewedStoryState = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORY_VIEWED_STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, string[]>;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return {} as Record<string, string[]>;
    }

    const next: Record<string, string[]> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        next[key] = value.filter(
          (item): item is string => typeof item === "string",
        );
      }
    });
    return next;
  } catch {
    return {} as Record<string, string[]>;
  }
};

const writeViewedStoryState = async (state: Record<string, string[]>) => {
  try {
    await AsyncStorage.setItem(STORY_VIEWED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 永続化失敗時も閲覧体験は継続する
  }
};

const isStoryActive = (story: CloudStory) => {
  if (!story.createdAt) {
    return true;
  }

  const createdAtMs = new Date(story.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return true;
  }

  return Date.now() - createdAtMs < STORY_EXPIRATION_MS;
};

const getStoryQuery = /* GraphQL */ `
  query GetStory($id: ID!) {
    getStory(id: $id) {
      id
      owner
      imageKey
      caption
      createdAt
      updatedAt
    }
  }
`;

const getProfileQuery = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
      id
      owner
      username
      displayName
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
        displayName
        iconImageKey
      }
    }
  }
`;

const listStoriesQuery = /* GraphQL */ `
  query ListStories {
    listStories(limit: 1000) {
      items {
        id
        owner
        imageKey
        caption
        createdAt
        updatedAt
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
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [storyQueue, setStoryQueue] = React.useState<StoryQueueItem[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [profile, setProfile] = React.useState<CloudProfile | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [recipientUserId, setRecipientUserId] = React.useState("");
  const [reactionRecordIdByStory, setReactionRecordIdByStory] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [reactionRecordIdByType, setReactionRecordIdByType] = React.useState<
    Record<string, string>
  >({});
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [currentUsername, setCurrentUsername] = React.useState("");
  const [viewedStoryIdsByOwner, setViewedStoryIdsByOwner] = React.useState<
    Record<string, string[]>
  >({});
  const [message, setMessage] = React.useState("");
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isPlaybackPaused, setIsPlaybackPaused] = React.useState(false);
  const [gestureFeedback, setGestureFeedback] = React.useState<{
    label: string;
    icon: "flame" | "bulb" | "ribbon";
    backgroundColor: string;
    borderColor: string;
  } | null>(null);
  const dragY = React.useRef(new Animated.Value(0)).current;
  const keyboardOffset = React.useRef(new Animated.Value(0)).current;
  const feedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const suppressTapRef = React.useRef(false);
  const story = storyQueue[activeIndex] ?? null;
  const dragOpacity = React.useMemo(
    () =>
      dragY.interpolate({
        inputRange: [0, 260],
        outputRange: [1, 0.7],
        extrapolate: "clamp",
      }),
    [dragY],
  );
  const backdropOpacity = React.useMemo(
    () =>
      dragY.interpolate({
        inputRange: [0, 260],
        outputRange: [0.94, 0],
        extrapolate: "clamp",
      }),
    [dragY],
  );
  const closeStoryView = React.useCallback(() => {
    router.back();
  }, [router]);

  const loadProfileByOwner = React.useCallback(
    async (owner: string) => {
      const resolveAvatarUrl = async (iconImageKey?: string | null) => {
        if (!iconImageKey) {
          return null;
        }
        try {
          const resolved = await getUrl({ path: iconImageKey });
          return resolved.url.toString();
        } catch {
          return null;
        }
      };

      if (!owner) {
        setProfile(null);
        setProfileAvatarUrl(null);
        setRecipientUserId("");
        return;
      }

      try {
        const profileResponse = await client.graphql({
          query: getProfileQuery,
          variables: { id: owner },
        });
        const loadedProfile = (
          profileResponse as { data?: { getProfile?: CloudProfile | null } }
        ).data?.getProfile;
        if (loadedProfile?.id) {
          setProfile(loadedProfile);
          setProfileAvatarUrl(
            (await resolveAvatarUrl(loadedProfile.iconImageKey)) ??
              AVATAR_PLACEHOLDER_URL,
          );
          setRecipientUserId(loadedProfile.id);
          return;
        }
      } catch {
        // getProfile(id: owner) が取れない場合は owner で list から逆引きする
      }

      try {
        const profileListResponse = await client.graphql({
          query: listProfilesQuery,
        });
        const profiles =
          (
            profileListResponse as {
              data?: {
                listProfiles?: { items?: Array<CloudProfile | null> };
              };
            }
          ).data?.listProfiles?.items ?? [];
        const matched = profiles.find((item) => item?.owner === owner) ?? null;
        setProfile(matched ?? null);
        setProfileAvatarUrl(
          (await resolveAvatarUrl(matched?.iconImageKey)) ??
            AVATAR_PLACEHOLDER_URL,
        );
        setRecipientUserId(matched?.id ?? owner);
      } catch {
        setProfile(null);
        setProfileAvatarUrl(AVATAR_PLACEHOLDER_URL);
        setRecipientUserId(owner);
      }
    },
    [client],
  );

  React.useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        setIsLoading(true);
        const storyResponse = await client.graphql({
          query: getStoryQuery,
          variables: { id: storyId },
        });
        const loadedStory = (
          storyResponse as { data?: { getStory?: CloudStory | null } }
        ).data?.getStory;

        if (!loadedStory) {
          setStoryQueue([]);
          return;
        }
        if (!isStoryActive(loadedStory)) {
          setStoryQueue([]);
          Alert.alert(
            "期限切れ",
            "このストーリーは24時間を過ぎたため閲覧できません。",
            [{ text: "戻る", onPress: () => router.back() }],
          );
          return;
        }

        const storiesResponse = await client.graphql({
          query: listStoriesQuery,
        });
        const stories =
          (
            storiesResponse as {
              data?: { listStories?: { items?: Array<CloudStory | null> } };
            }
          ).data?.listStories?.items ?? [];

        const sameOwnerStories = stories
          .filter((item): item is CloudStory =>
            Boolean(
              item?.id && item.imageKey && item.owner === loadedStory.owner,
            ),
          )
          .filter((item) => isStoryActive(item))
          .sort((a, b) => {
            const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return at - bt;
          });

        const queue =
          sameOwnerStories.length > 0 ? sameOwnerStories : [loadedStory];
        const queueWithImage = await Promise.all(
          queue.map(async (item) => {
            let resolvedImageUrl = STORY_PLACEHOLDER_URL;
            try {
              const resolved = await getUrl({ path: item.imageKey });
              resolvedImageUrl = resolved.url.toString();
            } catch {
              resolvedImageUrl = STORY_PLACEHOLDER_URL;
            }

            return {
              ...item,
              imageUrl: resolvedImageUrl,
            } satisfies StoryQueueItem;
          }),
        );

        setStoryQueue(queueWithImage);
        const ownerKey = loadedStory.owner ?? "";
        const queueIdSet = new Set(queueWithImage.map((item) => item.id));
        const viewedState = await readViewedStoryState();
        const normalizedOwnerViewed = (viewedState[ownerKey] ?? []).filter(
          (id) => queueIdSet.has(id),
        );
        const normalizedViewedState: Record<string, string[]> = {
          ...viewedState,
          [ownerKey]: normalizedOwnerViewed,
        };
        setViewedStoryIdsByOwner(normalizedViewedState);
        void writeViewedStoryState(normalizedViewedState);

        const viewedSet = new Set(normalizedOwnerViewed);
        const firstUnreadIndex = queueWithImage.findIndex(
          (item) => !viewedSet.has(item.id),
        );
        const firstIndex = firstUnreadIndex >= 0 ? firstUnreadIndex : 0;
        setActiveIndex(firstIndex);

        const currentUser = await getCurrentUser();
        setCurrentUserId(currentUser.userId);
        const username = currentUser.username ?? "";
        setCurrentUsername(username);

        await loadProfileByOwner(loadedStory.owner ?? "");

        const reactionsResponse = await client.graphql({
          query: listStoryReactionsQuery,
        });
        const reactionItems =
          (
            reactionsResponse as {
              data?: {
                listStoryReactions?: { items?: Array<StoryReaction | null> };
              };
            }
          ).data?.listStoryReactions?.items ?? [];

        const nextReactionMap: Record<string, Record<string, string>> = {};
        reactionItems
          .filter((item): item is StoryReaction =>
            Boolean(item?.id && item.storyId && item.reactionType),
          )
          .filter((item) => item.owner === username)
          .forEach((item) => {
            if (!nextReactionMap[item.storyId]) {
              nextReactionMap[item.storyId] = {};
            }
            nextReactionMap[item.storyId][item.reactionType ?? ""] = item.id;
          });

        setReactionRecordIdByStory(nextReactionMap);
        setReactionRecordIdByType(
          nextReactionMap[queueWithImage[firstIndex]?.id ?? ""] ?? {},
        );
        setProgress(0);
      } catch (error) {
        console.error("[StoryView] failed to load story:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [client, loadProfileByOwner, router, storyId]);

  React.useEffect(() => {
    if (!story?.id) {
      return;
    }

    const ownerKey = story.owner ?? "";
    setViewedStoryIdsByOwner((prev) => {
      const current = prev[ownerKey] ?? [];
      if (current.includes(story.id)) {
        return prev;
      }

      const next = {
        ...prev,
        [ownerKey]: [...current, story.id],
      };
      void writeViewedStoryState(next);
      return next;
    });
  }, [story?.id, story?.owner]);

  React.useEffect(() => {
    if (!story) {
      setReactionRecordIdByType({});
      return;
    }
    setReactionRecordIdByType(reactionRecordIdByStory[story.id] ?? {});
    setProgress(0);
  }, [activeIndex, reactionRecordIdByStory, story]);

  React.useEffect(() => {
    if (!story || isPlaybackPaused) {
      return;
    }

    const tickMs = 50;
    const step = tickMs / STORY_DURATION_MS;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 1 ? 1 : next;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPlaybackPaused, story]);

  const goNextStory = React.useCallback(() => {
    if (activeIndex >= storyQueue.length - 1) {
      router.back();
      return;
    }

    setProgress(0);
    setActiveIndex((prev) => prev + 1);
  }, [activeIndex, router, storyQueue.length]);

  const goPreviousStory = React.useCallback(() => {
    if (activeIndex <= 0) {
      return;
    }

    setProgress(0);
    setActiveIndex((prev) => prev - 1);
  }, [activeIndex]);

  React.useEffect(() => {
    if (!story || isPlaybackPaused) {
      return;
    }
    if (progress >= 1) {
      goNextStory();
    }
  }, [goNextStory, isPlaybackPaused, progress, story]);

  const displayName =
    profile?.displayName ||
    profile?.username ||
    (story?.owner ?? "USER").split("@")[0].toUpperCase();
  const created = story?.createdAt ? new Date(story.createdAt) : null;
  const timeLabel = created
    ? `${created.getMonth() + 1}/${created.getDate()} ${created.getHours()}:${`${created.getMinutes()}`.padStart(2, "0")}`
    : "たった今";
  const isOwnStory = Boolean(
    story?.owner && currentUsername && story.owner === currentUsername,
  );

  const toggleStoryReaction = React.useCallback(
    async (reactionType: ReactionType) => {
      if (!story?.id) {
        return;
      }

      try {
        const existingId = reactionRecordIdByStory[story.id]?.[reactionType];
        if (existingId) {
          await client.graphql({
            query: deleteStoryReactionMutation,
            variables: { input: { id: existingId } },
          });
          setReactionRecordIdByStory((prev) => {
            const next = { ...prev };
            const nextStoryMap = { ...(next[story.id] ?? {}) };
            delete nextStoryMap[reactionType];
            next[story.id] = nextStoryMap;
            return next;
          });
        } else {
          const response = await client.graphql({
            query: createStoryReactionMutation,
            variables: { input: { storyId: story.id, reactionType } },
          });
          const createdId =
            (response as { data?: { createStoryReaction?: { id?: string } } })
              .data?.createStoryReaction?.id ?? "";
          if (createdId) {
            setReactionRecordIdByStory((prev) => ({
              ...prev,
              [story.id]: {
                ...(prev[story.id] ?? {}),
                [reactionType]: createdId,
              },
            }));
          }
        }
      } catch (error) {
        console.error("[StoryView] failed to toggle reaction:", error);
      }
    },
    [client, reactionRecordIdByStory, story],
  );

  const showGestureFeedback = React.useCallback((type: ReactionType) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    if (type === "passion") {
      setGestureFeedback({
        label: "情熱",
        icon: "flame",
        backgroundColor: "#FF6A3D",
        borderColor: "#FFC1AE",
      });
    }
    if (type === "logic") {
      setGestureFeedback({
        label: "論理",
        icon: "bulb",
        backgroundColor: "#2C7BFF",
        borderColor: "#B8D2FF",
      });
    }
    if (type === "routine") {
      setGestureFeedback({
        label: "一貫性",
        icon: "ribbon",
        backgroundColor: "#10A37F",
        borderColor: "#A7E3D4",
      });
    }

    feedbackTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 650);
  }, []);

  const onHeroTap = React.useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      if (suppressTapRef.current) {
        suppressTapRef.current = false;
        return;
      }
      const tapX = event.nativeEvent.locationX;
      if (tapX < width * 0.35) {
        goPreviousStory();
        return;
      }
      goNextStory();
    },
    [goNextStory, goPreviousStory, width],
  );

  const onHeroTouchStart = React.useCallback((event: GestureResponderEvent) => {
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
    suppressTapRef.current = false;
  }, []);

  const onHeroTouchMove = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!touchStartRef.current) {
        return;
      }

      const dx = event.nativeEvent.pageX - touchStartRef.current.x;
      const dy = event.nativeEvent.pageY - touchStartRef.current.y;
      const isVertical = Math.abs(dy) > Math.abs(dx);
      if (!isVertical || dy <= 10) {
        return;
      }

      setIsPlaybackPaused(true);
      dragY.setValue(dy);
      if (dy > STORY_CLOSE_SWIPE_THRESHOLD) {
        suppressTapRef.current = true;
      }
    },
    [dragY],
  );

  const onHeroTouchEnd = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!touchStartRef.current) {
        setIsPlaybackPaused(false);
        return;
      }

      const dx = event.nativeEvent.pageX - touchStartRef.current.x;
      const dy = event.nativeEvent.pageY - touchStartRef.current.y;
      const isVertical = Math.abs(dy) > Math.abs(dx);
      touchStartRef.current = null;

      if (isVertical && dy > STORY_CLOSE_SWIPE_THRESHOLD) {
        Animated.timing(dragY, {
          toValue: 420,
          duration: 140,
          useNativeDriver: true,
        }).start(() => {
          closeStoryView();
        });
        return;
      }

      Animated.spring(dragY, {
        toValue: 0,
        damping: 18,
        stiffness: 210,
        mass: 0.6,
        useNativeDriver: true,
      }).start();
      setIsPlaybackPaused(false);
    },
    [closeStoryView, dragY],
  );

  const onToggleReaction = React.useCallback(
    (type: ReactionType) => {
      showGestureFeedback(type);
      void toggleStoryReaction(type);
    },
    [showGestureFeedback, toggleStoryReaction],
  );

  const onSendStoryMessage = React.useCallback(async () => {
    if (!story?.id || !recipientUserId || !currentUserId || isSendingMessage) {
      return;
    }
    if (recipientUserId === currentUserId) {
      Alert.alert("送信不可", "自分のストーリーには送信できません。");
      return;
    }
    if (!message.trim()) {
      Alert.alert("入力してください", "メッセージを入力してください。");
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
      setMessage("");
      router.push(`/chat/${recipientUserId}`);
    } catch (error) {
      console.error("[StoryView] failed to send story message:", error);
      Alert.alert("送信失敗", "メッセージ送信に失敗しました。");
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    client,
    currentUserId,
    isSendingMessage,
    message,
    recipientUserId,
    router,
    story?.caption,
    story?.id,
  ]);

  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event?.endCoordinates?.height ?? 0;
      const target = Math.max(0, height - insets.bottom + 24);
      Animated.timing(keyboardOffset, {
        toValue: target,
        duration: Platform.OS === "ios" ? (event?.duration ?? 250) : 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === "ios" ? (event?.duration ?? 200) : 150,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardOffset]);

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
          <Text style={styles.loadingText}>
            ストーリーが見つかりませんでした。
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.modalRoot}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      />
      <Animated.View
        style={[
          styles.container,
          {
            opacity: dragOpacity,
            transform: [{ translateY: dragY }],
          },
        ]}
      >
        <ImageBackground
          source={{ uri: story.imageUrl ?? STORY_PLACEHOLDER_URL }}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="contain"
        >
          <Pressable
            style={styles.heroOverlay}
            onPress={onHeroTap}
            onPressIn={() => setIsPlaybackPaused(true)}
            onPressOut={() => setIsPlaybackPaused(false)}
            onTouchStart={onHeroTouchStart}
            onTouchMove={onHeroTouchMove}
            onTouchEnd={onHeroTouchEnd}
            onTouchCancel={() => {
              touchStartRef.current = null;
              setIsPlaybackPaused(false);
            }}
          >
            <View
              style={[
                styles.topBars,
                { paddingTop: theme.spacing.md + insets.top },
              ]}
            >
              {storyQueue.map((item, index) => {
                const isDone = index < activeIndex;
                const isCurrent = index === activeIndex;
                const fill = isDone ? 1 : isCurrent ? progress : 0;
                return (
                  <View key={item.id} style={styles.bar}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(0, Math.min(1, fill)) * 100}%` },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.topRow}>
              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: profileAvatarUrl ?? AVATAR_PLACEHOLDER_URL }}
                  style={styles.profileAvatar}
                />
                <View>
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.time}>{timeLabel}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.actionBtn}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={16}
                    color={theme.colors.text}
                  />
                </Pressable>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.back()}
                >
                  <Ionicons name="close" size={16} color={theme.colors.text} />
                </Pressable>
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
                <Ionicons
                  name={gestureFeedback.icon}
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.gesturePopupText}>
                  {gestureFeedback.label}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </ImageBackground>

        <Animated.View
          style={[
            styles.bottomPanel,
            {
              paddingBottom: theme.spacing.md,
              transform: [
                { translateY: Animated.multiply(keyboardOffset, -1) },
              ],
            },
          ]}
        >
          {story.caption ? (
            <Text style={styles.caption}>{story.caption}</Text>
          ) : null}
          {isOwnStory ? null : (
            <View style={styles.inputRow}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="DMを送信"
                placeholderTextColor={theme.colors.textSub}
                style={styles.input}
                onFocus={() => setIsPlaybackPaused(true)}
                onBlur={() => setIsPlaybackPaused(false)}
              />
              <View style={styles.reactionActions}>
                <Pressable
                  accessibilityLabel="情熱を送る"
                  style={[
                    styles.reactionActionBtn,
                    reactionRecordIdByType.passion &&
                      styles.reactionActionBtnActive,
                  ]}
                  onPress={() => onToggleReaction("passion")}
                >
                  <Ionicons
                    name="flame"
                    size={18}
                    color={
                      reactionRecordIdByType.passion
                        ? theme.colors.white
                        : theme.colors.primary
                    }
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="論理を送る"
                  style={[
                    styles.reactionActionBtn,
                    reactionRecordIdByType.logic &&
                      styles.reactionActionBtnActive,
                  ]}
                  onPress={() => onToggleReaction("logic")}
                >
                  <Ionicons
                    name="bulb"
                    size={18}
                    color={
                      reactionRecordIdByType.logic
                        ? theme.colors.white
                        : theme.colors.primary
                    }
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="一貫性を送る"
                  style={[
                    styles.reactionActionBtn,
                    reactionRecordIdByType.routine &&
                      styles.reactionActionBtnActive,
                  ]}
                  onPress={() => onToggleReaction("routine")}
                >
                  <Ionicons
                    name="ribbon"
                    size={18}
                    color={
                      reactionRecordIdByType.routine
                        ? theme.colors.white
                        : theme.colors.primary
                    }
                  />
                </Pressable>
              </View>
              <Pressable
                style={[
                  styles.sendBtn,
                  isSendingMessage && styles.sendBtnDisabled,
                ]}
                onPress={() => void onSendStoryMessage()}
                disabled={isSendingMessage}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: "#000000",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000000",
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    hero: {
      width: "100%",
      flex: 1,
      justifyContent: "space-between",
      backgroundColor: "#111111",
    },
    heroImage: {
      resizeMode: "contain",
    },
    heroOverlay: {
      flex: 1,
      justifyContent: "flex-start",
      backgroundColor: "rgba(0,0,0,0.14)",
    },
    gesturePopup: {
      position: "absolute",
      alignSelf: "center",
      top: "42%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 2,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    gesturePopupText: {
      color: theme.colors.onPrimary,
      fontWeight: "900",
      fontSize: 15,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    loadingText: {
      color: theme.colors.text,
      fontWeight: "700",
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
      fontWeight: "800",
    },
    topBars: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    bar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.35)",
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: theme.colors.white,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      marginTop: 10,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    profileAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.9)",
      backgroundColor: theme.colors.surface,
    },
    name: {
      color: theme.colors.onPrimary,
      opacity: 1,
      fontWeight: "900",
      fontSize: 22,
    },
    time: {
      color: theme.colors.onPrimary,
      opacity: 1,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.white,
    },
    bottomPanel: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.white,
      justifyContent: "flex-end",
    },
    caption: {
      color: theme.colors.text,
      fontWeight: "700",
      marginBottom: theme.spacing.sm,
    },
    reactionTitle: {
      color: theme.colors.primary,
      textAlign: "center",
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    reactionGuideHint: {
      textAlign: "center",
      color: theme.colors.textSub,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: theme.spacing.sm,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
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
    reactionActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    reactionActionBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    reactionActionBtnActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    sendBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      opacity: 0.5,
    },
  });
