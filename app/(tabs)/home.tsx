import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { CustomButton, ScreenContainer } from "../../src/components/common";
import { useRoadmap } from "../../src/store/roadmap-context";
import { theme } from "../../src/theme";

type CloudPost = {
  id: string;
  content: string;
  owner?: string | null;
  createdAt?: string | null;
  title?: string | null;
  tags?: string[] | null;
  imageKey?: string | null;
  isArchived?: boolean | null;
  passion?: number | null;
  logic?: number | null;
  routine?: number | null;
};

type CloudProfile = {
  id: string;
  owner?: string | null;
  username?: string | null;
  iconImageKey?: string | null;
};

type CloudStory = {
  id: string;
  owner?: string | null;
  imageKey: string;
  caption?: string | null;
  createdAt?: string | null;
};

type CloudLike = {
  id: string;
  owner?: string | null;
  postId: string;
  reactionType?: string | null;
};

type CloudSave = {
  id: string;
  owner?: string | null;
  postId: string;
};

type FeedPost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  image: string;
  log: string;
  tags: string[];
  createdAt: string;
  imageKey?: string;
  passionCount: number;
  logicCount: number;
  routineCount: number;
  likeCount: number;
  saveCount: number;
};

type ReactionType = "passion" | "logic" | "routine";

type StoryItem = {
  id: string;
  userName: string;
  image: string;
  active: boolean;
  owner: string;
};

const listPostsQuery = /* GraphQL */ `
  query ListPosts {
    listPosts(limit: 100) {
      items {
        id
        content
        owner
        createdAt
        title
        tags
        imageKey
        isArchived
        passion
        logic
        routine
      }
    }
  }
`;

const listProfilesQuery = /* GraphQL */ `
  query ListProfiles {
    listProfiles(limit: 100) {
      items {
        id
        owner
        username
        iconImageKey
      }
    }
  }
`;

const listStoriesQuery = /* GraphQL */ `
  query ListStories {
    listStories(limit: 100) {
      items {
        id
        owner
        imageKey
        caption
        createdAt
      }
    }
  }
`;

const listPostLikesQuery = /* GraphQL */ `
  query ListPostLikes {
    listPostLikes(limit: 1000) {
      items {
        id
        owner
        postId
        reactionType
      }
    }
  }
`;

const listPostSavesQuery = /* GraphQL */ `
  query ListPostSaves {
    listPostSaves(limit: 1000) {
      items {
        id
        owner
        postId
      }
    }
  }
`;

const createPostMutation = /* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
    }
  }
`;

const updatePostMutation = /* GraphQL */ `
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      id
      isArchived
    }
  }
`;

const deletePostMutation = /* GraphQL */ `
  mutation DeletePost($input: DeletePostInput!) {
    deletePost(input: $input) {
      id
    }
  }
`;

const createPostLikeMutation = /* GraphQL */ `
  mutation CreatePostLike($input: CreatePostLikeInput!) {
    createPostLike(input: $input) {
      id
      postId
      reactionType
    }
  }
`;

const deletePostLikeMutation = /* GraphQL */ `
  mutation DeletePostLike($input: DeletePostLikeInput!) {
    deletePostLike(input: $input) {
      id
      postId
      reactionType
    }
  }
`;

const createPostSaveMutation = /* GraphQL */ `
  mutation CreatePostSave($input: CreatePostSaveInput!) {
    createPostSave(input: $input) {
      id
      postId
    }
  }
`;

const deletePostSaveMutation = /* GraphQL */ `
  mutation DeletePostSave($input: DeletePostSaveInput!) {
    deletePostSave(input: $input) {
      id
      postId
    }
  }
`;

const fallbackPosts: FeedPost[] = [
  {
    id: "fallback",
    userId: "unknown",
    userName: "NO POSTS YET",
    title: "WELCOME",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000",
    log: "最初の投稿を作成するとここに表示されます。",
    tags: ["#welcome"],
    createdAt: "1970-01-01T00:00:00.000Z",
    passionCount: 0,
    logicCount: 0,
    routineCount: 0,
    likeCount: 0,
    saveCount: 0,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const client = React.useMemo(() => generateClient(), []);
  const {
    canCreatePost,
    postCredits,
    streakDays,
    level,
    totalScore,
    recordDailyActivity,
    adjustScore,
  } = useRoadmap();
  const [currentOwner, setCurrentOwner] = React.useState("");
  const [posts, setPosts] = React.useState<FeedPost[]>(fallbackPosts);
  const [stories, setStories] = React.useState<StoryItem[]>([]);
  const [reactionKeys, setReactionKeys] = React.useState<Set<string>>(
    new Set(),
  );
  const [savedPostIds, setSavedPostIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [reactionRecordIdByKey, setReactionRecordIdByKey] = React.useState<
    Record<string, string>
  >({});
  const [saveRecordIdByPost, setSaveRecordIdByPost] = React.useState<
    Record<string, string>
  >({});
  const [gestureFeedback, setGestureFeedback] = React.useState<{
    postId: string;
    label: string;
    icon: "flame" | "bulb" | "ribbon";
    backgroundColor: string;
    borderColor: string;
  } | null>(null);
  const tapCountRef = React.useRef<
    Record<string, { count: number; timer?: ReturnType<typeof setTimeout> }>
  >({});
  const feedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadFeed = React.useCallback(async () => {
    try {
      let owner = "";
      try {
        const user = await getCurrentUser();
        owner = user.username;
      } catch {
        owner = "";
      }
      setCurrentOwner(owner);

      const [
        postsResponse,
        profilesResponse,
        likesResponse,
        savesResponse,
        storiesResponse,
      ] = await Promise.all([
        client.graphql({ query: listPostsQuery }),
        client.graphql({ query: listProfilesQuery }),
        client.graphql({ query: listPostLikesQuery }),
        client.graphql({ query: listPostSavesQuery }),
        client.graphql({ query: listStoriesQuery }),
      ]);

      const postItems =
        (
          postsResponse as {
            data?: { listPosts?: { items?: Array<CloudPost | null> } };
          }
        ).data?.listPosts?.items ?? [];
      const profileItems =
        (
          profilesResponse as {
            data?: { listProfiles?: { items?: Array<CloudProfile | null> } };
          }
        ).data?.listProfiles?.items ?? [];
      const likeItems =
        (
          likesResponse as {
            data?: { listPostLikes?: { items?: Array<CloudLike | null> } };
          }
        ).data?.listPostLikes?.items ?? [];
      const saveItems =
        (
          savesResponse as {
            data?: { listPostSaves?: { items?: Array<CloudSave | null> } };
          }
        ).data?.listPostSaves?.items ?? [];
      const storyItems =
        (
          storiesResponse as {
            data?: { listStories?: { items?: Array<CloudStory | null> } };
          }
        ).data?.listStories?.items ?? [];

      const profileWithAvatar = await Promise.all(
        profileItems
          .filter((item): item is CloudProfile => Boolean(item?.id))
          .map(async (item) => {
            let avatarUrl: string | undefined;
            if (item.iconImageKey) {
              try {
                const resolved = await getUrl({ path: item.iconImageKey });
                avatarUrl = resolved.url.toString();
              } catch {
                avatarUrl = undefined;
              }
            }
            return {
              owner: item.owner ?? "",
              username: item.username ?? "",
              avatarUrl,
            };
          }),
      );
      const profileByOwner = new Map(
        profileWithAvatar.map((profile) => [profile.owner, profile]),
      );

      const passionCountByPost: Record<string, number> = {};
      const logicCountByPost: Record<string, number> = {};
      const routineCountByPost: Record<string, number> = {};
      const myReactionKeys = new Set<string>();
      const myReactionRecordIds: Record<string, string> = {};
      likeItems
        .filter((item): item is CloudLike => Boolean(item?.id && item.postId))
        .forEach((item) => {
          const reactionType = item.reactionType;
          if (reactionType === "passion") {
            passionCountByPost[item.postId] =
              (passionCountByPost[item.postId] ?? 0) + 1;
          }
          if (reactionType === "logic") {
            logicCountByPost[item.postId] =
              (logicCountByPost[item.postId] ?? 0) + 1;
          }
          if (reactionType === "routine") {
            routineCountByPost[item.postId] =
              (routineCountByPost[item.postId] ?? 0) + 1;
          }

          if (owner && item.owner === owner) {
            const key = `${item.postId}:${reactionType ?? ""}`;
            myReactionKeys.add(key);
            myReactionRecordIds[key] = item.id;
          }
        });

      const saveCountByPost: Record<string, number> = {};
      const mySavedIds = new Set<string>();
      const mySaveRecordIds: Record<string, string> = {};
      saveItems
        .filter((item): item is CloudSave => Boolean(item?.id && item.postId))
        .forEach((item) => {
          saveCountByPost[item.postId] =
            (saveCountByPost[item.postId] ?? 0) + 1;
          if (owner && item.owner === owner) {
            mySavedIds.add(item.postId);
            mySaveRecordIds[item.postId] = item.id;
          }
        });

      setReactionKeys(myReactionKeys);
      setSavedPostIds(mySavedIds);
      setReactionRecordIdByKey(myReactionRecordIds);
      setSaveRecordIdByPost(mySaveRecordIds);

      const normalizedPosts = postItems
        .filter((item): item is CloudPost => Boolean(item?.id && item.content))
        .filter((item) => item.isArchived !== true)
        .map((item) => {
          const postOwner = item.owner ?? "unknown";
          const profile = profileByOwner.get(postOwner);
          return {
            id: item.id,
            userId: postOwner,
            userName:
              profile?.username || postOwner.split("@")[0].toUpperCase(),
            userAvatar: profile?.avatarUrl,
            title: item.title ?? "USER POST",
            image:
              "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000",
            log: item.content,
            tags: item.tags ?? [],
            createdAt: item.createdAt ?? "1970-01-01T00:00:00.000Z",
            imageKey: item.imageKey ?? undefined,
            passionCount: passionCountByPost[item.id] ?? 0,
            logicCount: logicCountByPost[item.id] ?? 0,
            routineCount: routineCountByPost[item.id] ?? 0,
            likeCount: 0,
            saveCount: saveCountByPost[item.id] ?? 0,
          } satisfies FeedPost;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      const postsWithImage = await Promise.all(
        normalizedPosts.map(async (post) => {
          if (!post.imageKey) {
            return post;
          }
          try {
            const resolved = await getUrl({ path: post.imageKey });
            return { ...post, image: resolved.url.toString() };
          } catch {
            return post;
          }
        }),
      );

      if (postsWithImage.length > 0) {
        setPosts(postsWithImage);
      } else {
        setPosts(fallbackPosts);
      }

      const storyByOwner = new Map<string, CloudStory>();
      storyItems
        .filter((item): item is CloudStory =>
          Boolean(item?.id && item.imageKey),
        )
        .forEach((item) => {
          const storyOwner = item.owner ?? "";
          const current = storyByOwner.get(storyOwner);
          const currentTime = current?.createdAt
            ? new Date(current.createdAt).getTime()
            : 0;
          const nextTime = item.createdAt
            ? new Date(item.createdAt).getTime()
            : 0;
          if (!current || nextTime > currentTime) {
            storyByOwner.set(storyOwner, item);
          }
        });

      const storyList = await Promise.all(
        Array.from(storyByOwner.values()).map(async (story) => {
          let imageUrl =
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300";
          try {
            const resolved = await getUrl({ path: story.imageKey });
            imageUrl = resolved.url.toString();
          } catch {
            imageUrl =
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300";
          }
          const profile = profileByOwner.get(story.owner ?? "");
          return {
            id: story.id,
            owner: story.owner ?? "",
            userName:
              profile?.username ||
              (story.owner ?? "USER").split("@")[0].toUpperCase(),
            image: imageUrl,
            active: owner === story.owner,
          } satisfies StoryItem;
        }),
      );

      const hasMyStory = storyList.some((story) => story.owner === owner);
      const myProfile = profileByOwner.get(owner);
      const myStoryItem: StoryItem = hasMyStory
        ? (storyList.find((story) => story.owner === owner) as StoryItem)
        : {
            id: "my-create",
            owner,
            userName: myProfile?.username || "MY GROW",
            image:
              myProfile?.avatarUrl ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
            active: true,
          };

      const others = storyList.filter((story) => story.owner !== owner);
      setStories([myStoryItem, ...others]);
    } catch (error) {
      console.error("[Home] failed to fetch feed:", error);
    }
  }, [client]);

  useFocusEffect(
    React.useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  const toggleReaction = React.useCallback(
    async (postId: string, reactionType: ReactionType) => {
      try {
        const key = `${postId}:${reactionType}`;
        const existingId = reactionRecordIdByKey[key];
        if (existingId) {
          await client.graphql({
            query: deletePostLikeMutation,
            variables: { input: { id: existingId } },
          });
          adjustScore(-30);
        } else {
          await client.graphql({
            query: createPostLikeMutation,
            variables: { input: { postId, reactionType } },
          });
          recordDailyActivity("action");
          adjustScore(30);
        }
        await loadFeed();
      } catch (error) {
        console.error("[Home] failed to toggle reaction:", error);
        Alert.alert("失敗", "リアクション更新に失敗しました。");
      }
    },
    [adjustScore, client, loadFeed, reactionRecordIdByKey, recordDailyActivity],
  );

  const clearTapState = React.useCallback((postId: string) => {
    const state = tapCountRef.current[postId];
    if (state?.timer) {
      clearTimeout(state.timer);
    }
    delete tapCountRef.current[postId];
  }, []);

  const showGestureFeedback = React.useCallback(
    (postId: string, type: ReactionType) => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      if (type === "passion") {
        setGestureFeedback({
          postId,
          label: "情熱",
          icon: "flame",
          backgroundColor: "#FF6A3D",
          borderColor: "#FFC1AE",
        });
      }
      if (type === "logic") {
        setGestureFeedback({
          postId,
          label: "論理",
          icon: "bulb",
          backgroundColor: "#2C7BFF",
          borderColor: "#B8D2FF",
        });
      }
      if (type === "routine") {
        setGestureFeedback({
          postId,
          label: "一貫性",
          icon: "ribbon",
          backgroundColor: "#10A37F",
          borderColor: "#A7E3D4",
        });
      }

      feedbackTimerRef.current = setTimeout(() => {
        setGestureFeedback(null);
      }, 650);
    },
    [],
  );

  const onPostLongPress = React.useCallback(
    (postId: string) => {
      clearTapState(postId);
      showGestureFeedback(postId, "passion");
      void toggleReaction(postId, "passion");
    },
    [clearTapState, showGestureFeedback, toggleReaction],
  );

  const onPostTap = React.useCallback(
    (postId: string) => {
      const current = tapCountRef.current[postId] ?? { count: 0 };
      if (current.timer) {
        clearTimeout(current.timer);
      }
      current.count += 1;

      current.timer = setTimeout(() => {
        const count = current.count;
        delete tapCountRef.current[postId];

        if (count >= 3) {
          showGestureFeedback(postId, "routine");
          void toggleReaction(postId, "routine");
          return;
        }

        if (count === 2) {
          showGestureFeedback(postId, "logic");
          void toggleReaction(postId, "logic");
        }
      }, 280);

      tapCountRef.current[postId] = current;
    },
    [showGestureFeedback, toggleReaction],
  );

  React.useEffect(() => {
    return () => {
      Object.values(tapCountRef.current).forEach((state) => {
        if (state.timer) {
          clearTimeout(state.timer);
        }
      });
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const toggleSave = React.useCallback(
    async (postId: string) => {
      try {
        const existingId = saveRecordIdByPost[postId];
        if (existingId) {
          await client.graphql({
            query: deletePostSaveMutation,
            variables: { input: { id: existingId } },
          });
        } else {
          await client.graphql({
            query: createPostSaveMutation,
            variables: { input: { postId } },
          });
        }
        await loadFeed();
      } catch (error) {
        console.error("[Home] failed to toggle save:", error);
        Alert.alert("失敗", "保存更新に失敗しました。");
      }
    },
    [client, loadFeed, saveRecordIdByPost],
  );

  const onArchive = React.useCallback(
    (post: FeedPost) => {
      Alert.alert("アーカイブ", "この投稿をアーカイブしますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "アーカイブする",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await client.graphql({
                  query: updatePostMutation,
                  variables: { input: { id: post.id, isArchived: true } },
                });
                await loadFeed();
              } catch (error) {
                console.error("[Home] failed to archive post:", error);
                Alert.alert("失敗", "アーカイブに失敗しました。");
              }
            })();
          },
        },
      ]);
    },
    [client, loadFeed],
  );

  const onDelete = React.useCallback(
    (post: FeedPost) => {
      Alert.alert("投稿削除", "この投稿を削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await client.graphql({
                  query: deletePostMutation,
                  variables: { input: { id: post.id } },
                });
                await loadFeed();
              } catch (error) {
                console.error("[Home] failed to delete post:", error);
                Alert.alert("失敗", "投稿削除に失敗しました。");
              }
            })();
          },
        },
      ]);
    },
    [client, loadFeed],
  );

  const onRepost = React.useCallback(
    async (post: FeedPost) => {
      try {
        await client.graphql({
          query: createPostMutation,
          variables: {
            input: {
              content: post.log,
              title: post.title ? `REPOST: ${post.title}` : "REPOST",
              tags: Array.from(new Set([...(post.tags ?? []), "#repost"])),
              imageKey: post.imageKey,
            },
          },
        });
        Alert.alert("再投稿完了", "投稿を再投稿しました。");
        await loadFeed();
      } catch (error) {
        console.error("[Home] failed to repost:", error);
        Alert.alert("失敗", "再投稿に失敗しました。");
      }
    },
    [client, loadFeed],
  );

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Ionicons name="flash" size={22} color={theme.colors.primary} />
          <Text style={styles.heading}>GROWGRAM</Text>
        </View>
        <Ionicons name="notifications" size={20} color={theme.colors.textSub} />
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>継続日数</Text>
          <Text style={styles.statValue}>{streakDays}日</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>現在のレベル</Text>
          <Text style={styles.statValueDark}>Lv.{level}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>獲得スコア</Text>
          <Text style={styles.statValue}>
            {totalScore.toLocaleString()} pts
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
      >
        {stories.map((story) => (
          <Pressable
            key={story.id}
            style={styles.storyItem}
            onPress={() =>
              router.push(
                story.id === "my-create"
                  ? "/story-create"
                  : `/story/${story.id}`,
              )
            }
          >
            <View
              style={[styles.storyRing, story.active && styles.storyRingActive]}
            >
              <Image source={{ uri: story.image }} style={styles.storyAvatar} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              {story.userName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <CustomButton
          label="ストーリー投稿"
          onPress={() => router.push("/story-create")}
          style={styles.actionButton}
        />
        <CustomButton
          label={
            canCreatePost ? `通常投稿 (${postCredits})` : "通常投稿 (LOCKED)"
          }
          onPress={() =>
            router.push(canCreatePost ? "/post-create" : "/(tabs)/create")
          }
          variant={canCreatePost ? "outline" : "secondary"}
          style={styles.actionButton}
        />
      </View>

      {posts.map((post) => {
        const isOwner = currentOwner.length > 0 && post.userId === currentOwner;
        return (
          <View key={post.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable
                style={styles.userRow}
                onPress={() => router.push(`/profile/${post.userId}`)}
              >
                {post.userAvatar ? (
                  <Image
                    source={{ uri: post.userAvatar }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={styles.userAvatarPlaceholder} />
                )}
                <Text style={styles.user}>{post.userName}</Text>
              </Pressable>
            </View>

            <Text style={styles.day}>{post.title}</Text>
            <Pressable
              onLongPress={() => onPostLongPress(post.id)}
              onPress={() => onPostTap(post.id)}
              style={styles.imagePressable}
            >
              <Image source={{ uri: post.image }} style={styles.image} />
              {gestureFeedback?.postId === post.id ? (
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
                    size={18}
                    color={theme.colors.onPrimary}
                  />
                  <Text style={styles.gesturePopupText}>
                    {gestureFeedback.label}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Text style={styles.gestureHint}>
              長押し: 情熱 / 2タップ: 論理 / 3タップ: 一貫性
            </Text>

            <Text style={styles.logLabel}>LOG:</Text>
            <Text style={styles.log}>{post.log}</Text>
            <View style={styles.tagRow}>
              <Ionicons
                name="pricetags"
                size={14}
                color={theme.colors.primary}
              />
              <Text style={styles.tags}>{post.tags.join(" ")}</Text>
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Ionicons name="flame" size={14} color={theme.colors.primary} />
                <Text style={styles.scoreLabel}>情熱 {post.passionCount}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Ionicons name="bulb" size={14} color={theme.colors.primary} />
                <Text style={styles.scoreLabel}>論理 {post.logicCount}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Ionicons
                  name="ribbon"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.scoreLabel}>
                  一貫性 {post.routineCount}
                </Text>
              </View>
            </View>

            <View style={styles.postActions}>
              <Pressable
                style={styles.postActionItem}
                onPress={() => void toggleSave(post.id)}
              >
                <Ionicons
                  name={
                    savedPostIds.has(post.id) ? "bookmark" : "bookmark-outline"
                  }
                  size={16}
                  color={theme.colors.textSub}
                />
                <Text style={styles.postActionText}>保存 {post.saveCount}</Text>
              </Pressable>
              <Pressable
                style={styles.postActionItem}
                onPress={() => void onRepost(post)}
              >
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={theme.colors.textSub}
                />
                <Text style={styles.postActionText}>再投稿</Text>
              </Pressable>
              {isOwner ? (
                <Pressable
                  style={styles.postActionItem}
                  onPress={() => onArchive(post)}
                >
                  <Ionicons
                    name="archive-outline"
                    size={16}
                    color={theme.colors.textSub}
                  />
                  <Text style={styles.postActionText}>アーカイブ</Text>
                </Pressable>
              ) : null}
              {isOwner ? (
                <Pressable
                  style={styles.postActionItem}
                  onPress={() => onDelete(post)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <Text
                    style={[
                      styles.postActionText,
                      { color: theme.colors.danger },
                    ]}
                  >
                    削除
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.colors.text,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  storyList: {
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  storyItem: {
    width: 72,
    alignItems: "center",
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
  },
  storyRingActive: {
    borderColor: theme.colors.primary,
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  storyName: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    maxWidth: 68,
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
  statLabel: {
    color: theme.colors.textSub,
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  statValueDark: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  user: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  userAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  day: {
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  imagePressable: {
    position: "relative",
  },
  gesturePopup: {
    position: "absolute",
    alignSelf: "center",
    top: "36%",
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
  gestureHint: {
    marginTop: 8,
    color: theme.colors.textSub,
    fontSize: 11,
    fontWeight: "700",
  },
  logLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: "800",
  },
  log: {
    marginTop: 2,
    color: theme.colors.text,
    lineHeight: 22,
  },
  tagRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tags: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  scoreRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "column",
    gap: 8,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  postActions: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  postActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postActionText: {
    color: theme.colors.textSub,
    fontWeight: "700",
    fontSize: 12,
  },
  postActionTextActive: {
    color: theme.colors.primary,
  },
});
