import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text, TextInput } from "../../src/components/common/Typography";
import { toCloudFrontImageUrl } from "../../src/services/aws/cdn";
import { useRoadmap } from "../../src/store/roadmap-context";
import { useTabScrollTop } from "../../src/store/tab-scroll-top-context";
import { theme } from "../../src/theme";

type CloudPost = {
  id: string;
  content: string;
  owner?: string | null;
  createdAt?: string | null;
  title?: string | null;
  tags?: string[] | null;
  imageKey?: string | null;
  imageKeys?: string[] | null;
  isArchived?: boolean | null;
  passion?: number | null;
  logic?: number | null;
  routine?: number | null;
};

type CloudProfile = {
  id: string;
  owner?: string | null;
  username?: string | null;
  displayName?: string | null;
  iconImageKey?: string | null;
};

type CloudStory = {
  id: string;
  owner?: string | null;
  imageKey: string;
  caption?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CloudStoryReaction = {
  id: string;
  owner?: string | null;
  storyId: string;
  reactionType?: string | null;
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

type CloudComment = {
  id: string;
  postId: string;
  owner?: string | null;
  content: string;
  mentionHandles?: string[] | null;
  mentionUserIds?: string[] | null;
  createdAt?: string | null;
};

type CloudCommentLike = {
  id: string;
  commentId: string;
  owner?: string | null;
};

type CloudDirectMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt?: string | null;
};

type CloudReadReceipt = {
  id: string;
  messageId: string;
  readerId: string;
};

type FeedComment = {
  id: string;
  postId: string;
  owner: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
};

type FeedPost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  image: string;
  imageUrls: string[];
  imageCount: number;
  log: string;
  tags: string[];
  createdAt: string;
  imageKey?: string;
  imageKeys?: string[];
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
  allStories: any[]; // ⭕️ これを1行足す！
};

const utf8Bytes = (value: string): Uint8Array => {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.codePointAt(index) ?? 0;
    if (codePoint > 0xffff) {
      index += 1;
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }

  return new Uint8Array(bytes);
};

const hexFromBytes = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const fallbackActorHash = (value: string): string => {
  const bytes = utf8Bytes(value);
  let hash = 0x811c9dc5;

  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
};

const hashActorId = async (value: string): Promise<string> => {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const bytes = utf8Bytes(value);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const digest = await subtle.digest("SHA-256", buffer);
    return hexFromBytes(new Uint8Array(digest));
  }

  return fallbackActorHash(value);
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
        imageKeys
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
        displayName
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
        owner
        storyId
        reactionType
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

const listDirectMessagesQuery = /* GraphQL */ `
  query ListDirectMessages {
    listDirectMessages(limit: 2000) {
      items {
        id
        fromUserId
        toUserId
        body
        createdAt
      }
    }
  }
`;

const listReadReceiptsQuery = /* GraphQL */ `
  query ListReadReceipts {
    listReadReceipts(limit: 2000) {
      items {
        id
        messageId
        readerId
      }
    }
  }
`;

const listPostCommentsQuery = /* GraphQL */ `
  query ListPostComments {
    listPostComments(limit: 1000) {
      items {
        id
        postId
        owner
        content
        mentionHandles
        mentionUserIds
        createdAt
      }
    }
  }
`;

const createPostCommentMutation = /* GraphQL */ `
  mutation CreatePostComment($input: CreatePostCommentInput!) {
    createPostComment(input: $input) {
      id
      postId
    }
  }
`;

const deletePostCommentMutation = /* GraphQL */ `
  mutation DeletePostComment($input: DeletePostCommentInput!) {
    deletePostComment(input: $input) {
      id
      postId
    }
  }
`;

const listCommentLikesQuery = /* GraphQL */ `
  query ListCommentLikes {
    listCommentLikes(limit: 1000) {
      items {
        id
        commentId
        owner
      }
    }
  }
`;

const createCommentLikeMutation = /* GraphQL */ `
  mutation CreateCommentLike($input: CreateCommentLikeInput!) {
    createCommentLike(input: $input) {
      id
      commentId
    }
  }
`;

const deleteCommentLikeMutation = /* GraphQL */ `
  mutation DeleteCommentLike($input: DeleteCommentLikeInput!) {
    deleteCommentLike(input: $input) {
      id
      commentId
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
    image: "",
    imageUrls: [],
    log: "最初の投稿を作成するとここに表示されます。",
    tags: ["#welcome"],
    createdAt: "1970-01-01T00:00:00.000Z",
    passionCount: 0,
    logicCount: 0,
    routineCount: 0,
    likeCount: 0,
    saveCount: 0,
    imageCount: 0,
  },
];

export default function HomeScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardImageWidth = Math.max(220, screenWidth);
  const cardImageHeight = Math.round(cardImageWidth * 1.15);
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const { registerScrollToTop } = useTabScrollTop();
  const scrollViewRef = React.useRef<ScrollView | null>(null);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { streakDays, level, totalScore, adjustScore } = useRoadmap();
  const [currentOwner, setCurrentOwner] = React.useState("");
  const [posts, setPosts] = React.useState<FeedPost[]>(fallbackPosts);
  const [stories, setStories] = React.useState<StoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const [reactionBonusScore, setReactionBonusScore] = React.useState(0);
  const [imageViewerState, setImageViewerState] = React.useState<{
    images: string[];
    initialIndex: number;
  } | null>(null);
  const [visibleImageIndexByPost, setVisibleImageIndexByPost] = React.useState<
    Record<string, number>
  >({});
  const [viewerImageIndex, setViewerImageIndex] = React.useState(0);
  const [reactionKeys, setReactionKeys] = React.useState<Set<string>>(
    new Set(),
  );
  const [savedPostIds, setSavedPostIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [reactionRecordIdByKey, setReactionRecordIdByKey] = React.useState<
    Record<string, string>
  >({});
  const [reactionRecordIdsByKey, setReactionRecordIdsByKey] = React.useState<
    Record<string, string[]>
  >({});
  const [saveRecordIdByPost, setSaveRecordIdByPost] = React.useState<
    Record<string, string>
  >({});
  const [profileIdByUsername, setProfileIdByUsername] = React.useState<
    Record<string, string>
  >({});
  const [commentsByPost, setCommentsByPost] = React.useState<
    Record<string, FeedComment[]>
  >({});
  const [commentInputByPost, setCommentInputByPost] = React.useState<
    Record<string, string>
  >({});
  const [commentPanelOpenByPost, setCommentPanelOpenByPost] = React.useState<
    Record<string, boolean>
  >({});
  const [commentLikeRecordIdByComment, setCommentLikeRecordIdByComment] =
    React.useState<Record<string, string>>({});
  const [commentLikeRecordIdsByComment, setCommentLikeRecordIdsByComment] =
    React.useState<Record<string, string[]>>({});
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
  const inFlightReactionKeysRef = React.useRef<Set<string>>(new Set());
  const inFlightCommentLikeIdsRef = React.useRef<Set<string>>(new Set());
  const inFlightCommentDeleteIdsRef = React.useRef<Set<string>>(new Set());
  const hasLoadedInitialFeedRef = React.useRef(false);
  const isRefreshingRef = React.useRef(false);
  const refreshTriggerArmedRef = React.useRef(true);
  const [isInitialFeedLoading, setIsInitialFeedLoading] = React.useState(true);
  const [isUploadingMyStory, setIsUploadingMyStory] = React.useState(false);
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const isIdentityReady = Boolean(currentOwner && currentUserId);

  React.useEffect(() => {
    if (!isUploadingMyStory) {
      spinValue.stopAnimation();
      spinValue.setValue(0);
      return;
    }

    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    return () => {
      spinLoop.stop();
    };
  }, [isUploadingMyStory, spinValue]);

  const uploadingRingSpinStyle = React.useMemo(
    () => ({
      transform: [
        {
          rotate: spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ],
    }),
    [spinValue],
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      const until = (globalThis as any).storyUploadIndicatorUntil;
      const shouldShow =
        typeof until === "number" && Number.isFinite(until) && until > Date.now();
      setIsUploadingMyStory((prev) => (prev === shouldShow ? prev : shouldShow));

      if (!shouldShow && typeof until === "number") {
        (globalThis as any).storyUploadIndicatorUntil = 0;
      }
    }, 180);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const deleteRecordsInBatches = React.useCallback(
    async (ids: string[], query: string, kind: string) => {
      const batchSize = 5;
      let hadFailures = false;
      for (let index = 0; index < ids.length; index += batchSize) {
        const batch = ids.slice(index, index + batchSize);
        const results = await Promise.allSettled(
          batch.map((id) =>
            client.graphql({
              query,
              variables: { input: { id } },
            }),
          ),
        );

        results.forEach((result, resultIndex) => {
          if (result.status === "rejected") {
            hadFailures = true;
            console.warn(
              `[Home] failed to delete ${kind} record ${batch[resultIndex]}:`,
              result.reason,
            );
          }
        });
      }

      return hadFailures;
    },
    [client],
  );

  const loadFeed = React.useCallback(async () => {
    const hasVisibleFeedData =
      posts.some((post) => post.id !== "fallback") || stories.length > 0;
    const shouldBlockInitialRender =
      !hasLoadedInitialFeedRef.current && !hasVisibleFeedData;
    if (shouldBlockInitialRender) {
      setIsInitialFeedLoading(true);
    }

    try {
      let owner = "";
      let me = "";
      try {
        const user = await getCurrentUser();
        owner = user.username;
        me = user.userId;
        setCurrentUserId(me);
      } catch {
        setCurrentOwner("");
        setCurrentUserId("");
        setPosts(fallbackPosts);
        setStories([]);
        setUnreadChatCount(0);
        hasLoadedInitialFeedRef.current = true;
        setIsInitialFeedLoading(false);
        return;
      }
      setCurrentOwner(owner);

      const isOwnedByMe = (recordOwner?: string | null) => {
        if (!recordOwner) {
          return false;
        }
        if (owner && recordOwner === owner) {
          return true;
        }
        if (me && recordOwner === me) {
          return true;
        }
        if (owner && recordOwner.endsWith(`::${owner}`)) {
          return true;
        }
        return false;
      }

      const normalizeOwner = (recordOwner?: string | null) => {
        if (!recordOwner) {
          return "";
        }

        return recordOwner.split("::").pop() ?? recordOwner;
      };

      const [postsResponse, profilesResponse, storiesResponse] =
        await Promise.all([
          client.graphql({ query: listPostsQuery }),
          client.graphql({ query: listProfilesQuery }),
          client.graphql({ query: listStoriesQuery }),
        ]);

      const deferredMetadataPromise = Promise.all([
        client.graphql({ query: listPostLikesQuery }),
        client.graphql({ query: listPostSavesQuery }),
        client.graphql({ query: listStoryReactionsQuery }),
        client.graphql({ query: listPostCommentsQuery }),
        client.graphql({ query: listCommentLikesQuery }),
        client.graphql({ query: listDirectMessagesQuery }),
        client.graphql({ query: listReadReceiptsQuery }),
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
      const storyItems =
        (
          storiesResponse as {
            data?: { listStories?: { items?: Array<CloudStory | null> } };
          }
        ).data?.listStories?.items ?? [];
      const profileWithAvatar = profileItems
        .filter((item): item is CloudProfile => Boolean(item?.id))
        .map((item) => ({
          id: item.id,
          owner: item.owner ?? "",
          username: item.username ?? "",
          displayName: item.displayName ?? item.username ?? "",
          iconImageKey: item.iconImageKey ?? "",
          avatarUrl: "",
        }));
      const profileByOwner = new Map(
        profileWithAvatar.map((profile) => [profile.owner, profile]),
      );
      const usernameToProfileId: Record<string, string> = {};
      profileItems
        .filter((item): item is CloudProfile =>
          Boolean(item?.id && item.username),
        )
        .forEach((item) => {
          usernameToProfileId[(item.username ?? "").toLowerCase()] = item.id;
        });
      setProfileIdByUsername(usernameToProfileId);

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
              profile?.displayName ||
              profile?.username ||
              postOwner.split("@")[0].toUpperCase(),
            userAvatar: "",
            title: item.title ?? "USER POST",
            image: "",
            imageUrls: [],
            log: item.content,
            tags: item.tags ?? [],
            createdAt: item.createdAt ?? "1970-01-01T00:00:00.000Z",
            imageKey: item.imageKey ?? item.imageKeys?.[0] ?? undefined,
            imageKeys:
              item.imageKeys ?? (item.imageKey ? [item.imageKey] : undefined),
            imageCount: item.imageKeys?.length ?? (item.imageKey ? 1 : 0),
            passionCount: item.passion ?? 0,
            logicCount: item.logic ?? 0,
            routineCount: item.routine ?? 0,
            likeCount: 0,
            saveCount: 0,
          } satisfies FeedPost;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      const storyGroups = new Map<string, CloudStory[]>();
      storyItems
        .filter((item): item is CloudStory => Boolean(item?.id && item.imageKey))
        .filter((item) => {
          if (!item.createdAt) {
            return true;
          }
          return (
            Date.now() - new Date(item.createdAt).getTime() <
            24 * 60 * 60 * 1000
          );
        })
        .forEach((item) => {
          const userOwner = item.owner ?? "";
          const existing = storyGroups.get(userOwner) ?? [];
          storyGroups.set(userOwner, [...existing, item]);
        });

      const immediateStoryList = Array.from(storyGroups.entries()).map(
        ([userOwner, items]) => {
          const profile = profileByOwner.get(userOwner);
          const sorted = [...items].sort(
            (a, b) =>
              new Date(a.createdAt || 0).getTime() -
              new Date(b.createdAt || 0).getTime(),
          );
          const allStories = sorted.map((st) => ({
            ...st,
            imageUrl: "",
            userName:
              profile?.displayName ||
              profile?.username ||
              userOwner.split("@")[0].toUpperCase(),
            userAvatar: "",
          }));

          return {
            id: allStories[0]?.id ?? `${userOwner}-story`,
            owner: userOwner,
            userName:
              profile?.displayName ||
              profile?.username ||
              userOwner.split("@")[0].toUpperCase(),
            // Story ring should always represent the user avatar, never story content.
            image: profile?.avatarUrl ?? "",
            active: true,
            allStories,
          };
        },
      );

      const myProfile = profileByOwner.get(owner) as any;
      let myResolvedAvatar = "";
      if (myProfile?.iconImageKey) {
        try {
          const avatarResult = await getUrl({ path: myProfile.iconImageKey });
          myResolvedAvatar = toCloudFrontImageUrl(
            myProfile.iconImageKey,
            avatarResult.url.toString(),
          );
        } catch {
          myResolvedAvatar = "";
        }
      }

      const existingMyStory = immediateStoryList.find((s) => s.owner === owner);
      const myStoryItem = existingMyStory
        ? {
            ...existingMyStory,
            image: myResolvedAvatar || existingMyStory.image,
          }
        : {
            id: "my-create",
            owner,
            userName: myProfile?.displayName || "MY GROW",
            image: myResolvedAvatar,
            active: true,
            allStories: [] as any[],
          };
      const otherStories = immediateStoryList.filter((s) => s.owner !== owner);

      if (normalizedPosts.length > 0) {
        setPosts(normalizedPosts);
      } else {
        setPosts(fallbackPosts);
      }
      setStories([myStoryItem, ...otherStories] as any);
      hasLoadedInitialFeedRef.current = true;
      setIsInitialFeedLoading(false);

      void (async () => {
        await Promise.all(
          normalizedPosts.map(async (post) => {
            const imageKeys = post.imageKeys ?? [];
            const ownerProfile = profileByOwner.get(post.userId);
            let resolvedAvatar = "";
            if (ownerProfile?.iconImageKey) {
              try {
                const avatarResult = await getUrl({
                  path: ownerProfile.iconImageKey,
                });
                resolvedAvatar = toCloudFrontImageUrl(
                  ownerProfile.iconImageKey,
                  avatarResult.url.toString(),
                );
              } catch {
                resolvedAvatar = "";
              }
            }

            if (imageKeys.length === 0) {
              if (resolvedAvatar) {
                setPosts((prev) =>
                  prev.map((item) =>
                    item.id === post.id ? { ...item, userAvatar: resolvedAvatar } : item,
                  ),
                );
              }
              return;
            }

            const urls = await Promise.all(
              imageKeys.map(async (key) => {
                try {
                  const resolved = await getUrl({ path: key });
                  return toCloudFrontImageUrl(key, resolved.url.toString());
                } catch {
                  return "";
                }
              }),
            );
            const filtered = urls.filter((url) => Boolean(url));

            if (filtered.length > 0) {
              void Promise.all(
                filtered.map((url) => Image.prefetch(url).catch(() => {})),
              );
            }
            if (resolvedAvatar) {
              void Image.prefetch(resolvedAvatar).catch(() => {});
            }

            setPosts((prev) =>
              prev.map((item) =>
                item.id === post.id
                  ? {
                      ...item,
                      userAvatar: resolvedAvatar || item.userAvatar,
                      image: filtered[0] ?? "",
                      imageUrls: filtered,
                      imageCount: filtered.length > 0 ? filtered.length : item.imageCount,
                    }
                  : item,
              ),
            );
          }),
        );
      })();

      void (async () => {
        await Promise.all(
          immediateStoryList.map(async (storyGroup) => {
            const ownerProfile = profileByOwner.get(storyGroup.owner) as any;
            let resolvedAvatar = "";
            if (ownerProfile?.iconImageKey) {
              try {
                const avatarResult = await getUrl({ path: ownerProfile.iconImageKey });
                resolvedAvatar = toCloudFrontImageUrl(
                  ownerProfile.iconImageKey,
                  avatarResult.url.toString(),
                );
              } catch {
                resolvedAvatar = "";
              }
            }

            const updatedStories = await Promise.all(
              (storyGroup.allStories ?? []).map(async (entry: any) => {
                if (!entry.imageKey) {
                  return entry;
                }
                try {
                  const resolved = await getUrl({ path: entry.imageKey });
                  const imageUrl = toCloudFrontImageUrl(
                    entry.imageKey,
                    resolved.url.toString(),
                  );
                  void Image.prefetch(imageUrl).catch(() => {});
                  return {
                    ...entry,
                    imageUrl,
                    userAvatar: resolvedAvatar,
                  };
                } catch {
                  return {
                    ...entry,
                    userAvatar: resolvedAvatar,
                  };
                }
              }),
            );

            setStories((prev) =>
              prev.map((item: any) =>
                item.owner === storyGroup.owner
                  ? {
                      ...item,
                      image: resolvedAvatar,
                      allStories: updatedStories,
                    }
                  : item,
              ),
            );
          }),
        );
      })();

      const [
        likesResponse,
        savesResponse,
        storyReactionsResponse,
        commentsResponse,
        commentLikesResponse,
        directMessagesResponse,
        receiptsResponse,
      ] = await deferredMetadataPromise;

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
      const storyReactionItems =
        (
          storyReactionsResponse as {
            data?: {
              listStoryReactions?: { items?: Array<CloudStoryReaction | null> };
            };
          }
        ).data?.listStoryReactions?.items ?? [];
      const commentItems =
        (
          commentsResponse as {
            data?: {
              listPostComments?: { items?: Array<CloudComment | null> };
            };
          }
        ).data?.listPostComments?.items ?? [];
      const commentLikeItems =
        (
          commentLikesResponse as {
            data?: {
              listCommentLikes?: { items?: Array<CloudCommentLike | null> };
            };
          }
        ).data?.listCommentLikes?.items ?? [];
      const directMessageItems =
        (
          directMessagesResponse as {
            data?: {
              listDirectMessages?: { items?: Array<CloudDirectMessage | null> };
            };
          }
        ).data?.listDirectMessages?.items ?? [];
      const readReceiptItems =
        (
          receiptsResponse as {
            data?: {
              listReadReceipts?: { items?: Array<CloudReadReceipt | null> };
            };
          }
        ).data?.listReadReceipts?.items ?? [];
      const passionCountByPost: Record<string, number> = {};
      const logicCountByPost: Record<string, number> = {};
      const routineCountByPost: Record<string, number> = {};
      const seenLikeIdentities = new Set<string>();
      const myReactionKeys = new Set<string>();
      const myReactionRecordIds: Record<string, string> = {};
      const myReactionRecordIdsByKey: Record<string, string[]> = {};
      const myReactionRecordIdsByKeySet: Record<string, Set<string>> = {};
      const validLikeItems = likeItems.filter((item): item is CloudLike =>
        Boolean(item?.id && item.postId),
      );

      validLikeItems
        .filter((item) => isOwnedByMe(item.owner))
        .forEach((item) => {
          const key = `${item.postId}:${item.reactionType ?? ""}`;
          myReactionKeys.add(key);
          if (!myReactionRecordIdsByKeySet[key]) {
            myReactionRecordIdsByKeySet[key] = new Set();
          }
          myReactionRecordIdsByKeySet[key].add(item.id);
        });

      Object.entries(myReactionRecordIdsByKeySet).forEach(([key, idSet]) => {
        myReactionRecordIdsByKey[key] = Array.from(idSet);
        myReactionRecordIds[key] = myReactionRecordIdsByKey[key][0];
      });

      const dedupedLikeItems = validLikeItems.filter((item) => {
        const reactionType = item.reactionType;
        const normalizedOwner = normalizeOwner(item.owner);
        const likeIdentity = normalizedOwner
          ? `${item.postId}:${reactionType ?? ""}:${normalizedOwner}`
          : `id:${item.id}`;
        if (seenLikeIdentities.has(likeIdentity)) {
          return false;
        }
        seenLikeIdentities.add(likeIdentity);
        return true;
      });

      dedupedLikeItems.forEach((item) => {
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
      });

      const saveCountByPost: Record<string, number> = {};
      const mySavedIds = new Set<string>();
      const mySaveRecordIds: Record<string, string> = {};
      saveItems
        .filter((item): item is CloudSave => Boolean(item?.id && item.postId))
        .forEach((item) => {
          saveCountByPost[item.postId] =
            (saveCountByPost[item.postId] ?? 0) + 1;
          if (isOwnedByMe(item.owner)) {
            mySavedIds.add(item.postId);
            mySaveRecordIds[item.postId] = item.id;
          }
        });

      setReactionKeys(myReactionKeys);
      setSavedPostIds(mySavedIds);
      setReactionRecordIdByKey(myReactionRecordIds);
      setReactionRecordIdsByKey(myReactionRecordIdsByKey);
      setSaveRecordIdByPost(mySaveRecordIds);

      const myPostIds = new Set(
        postItems
          .filter((item): item is CloudPost => Boolean(item?.id && item.owner))
          .filter((item) => isOwnedByMe(item.owner))
          .map((item) => item.id),
      );
      const myStoryIds = new Set(
        storyItems
          .filter((item): item is CloudStory => Boolean(item?.id && item.owner))
          .filter((item) => isOwnedByMe(item.owner))
          .filter((item) => {
            // createdAt から 24 時間以内のストーリーを確認
            if (item.createdAt) {
              const now = new Date();
              const createdAt = new Date(item.createdAt);
              const ageHours =
                (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return ageHours < 24;
            }
            return true;
          })
          .map((item) => item.id),
      );
      const nextReactionBonusScore =
        dedupedLikeItems
          .filter((item) => Boolean(item.owner && item.reactionType))
          .filter(
            (item) => myPostIds.has(item.postId) && !isOwnedByMe(item.owner),
          ).length *
        30 +
        storyReactionItems
          .filter((item): item is CloudStoryReaction =>
            Boolean(
              item?.id && item.storyId && item.owner && item.reactionType,
            ),
          )
          .filter(
            (item) => myStoryIds.has(item.storyId) && item.owner !== owner,
          ).length *
        30;

      if (nextReactionBonusScore !== reactionBonusScore) {
        adjustScore(nextReactionBonusScore - reactionBonusScore);
        setReactionBonusScore(nextReactionBonusScore);
      }

      const readMessageIds = new Set(
        readReceiptItems
          .filter((item): item is CloudReadReceipt =>
            Boolean(item?.id && item.messageId && item.readerId),
          )
          .filter((item) => item.readerId === me)
          .map((item) => item.messageId),
      );
      const unreadIncomingCount = directMessageItems
        .filter((item): item is CloudDirectMessage =>
          Boolean(item?.id && item.body && item.fromUserId && item.toUserId),
        )
        .filter(
          (item) => item.toUserId === me && !readMessageIds.has(item.id),
        ).length;
      setUnreadChatCount(unreadIncomingCount);

      const commentLikeCountByComment: Record<string, number> = {};
      const myCommentLikeRecordIds: Record<string, string> = {};
      const myCommentLikeRecordIdsByComment: Record<string, string[]> = {};
      const myCommentLikeRecordIdsByCommentSet: Record<
        string,
        Set<string>
      > = {};
      const seenCommentLikeIdentities = new Set<string>();
      const validCommentLikeItems = commentLikeItems.filter(
        (item): item is CloudCommentLike => Boolean(item?.id && item.commentId),
      );

      validCommentLikeItems
        .filter((item) => isOwnedByMe(item.owner))
        .forEach((item) => {
          if (!myCommentLikeRecordIdsByCommentSet[item.commentId]) {
            myCommentLikeRecordIdsByCommentSet[item.commentId] = new Set();
          }
          myCommentLikeRecordIdsByCommentSet[item.commentId].add(item.id);
        });

      Object.entries(myCommentLikeRecordIdsByCommentSet).forEach(
        ([commentId, idSet]) => {
          myCommentLikeRecordIdsByComment[commentId] = Array.from(idSet);
          myCommentLikeRecordIds[commentId] =
            myCommentLikeRecordIdsByComment[commentId][0];
        },
      );

      validCommentLikeItems.forEach((item) => {
        const normalizedOwner = normalizeOwner(item.owner);
        const identity = normalizedOwner
          ? `${item.commentId}:${normalizedOwner}`
          : `id:${item.id}`;
        if (seenCommentLikeIdentities.has(identity)) {
          return;
        }
        seenCommentLikeIdentities.add(identity);

        commentLikeCountByComment[item.commentId] =
          (commentLikeCountByComment[item.commentId] ?? 0) + 1;
      });

      const nextCommentsByPost: Record<string, FeedComment[]> = {};
      commentItems
        .filter((item): item is CloudComment =>
          Boolean(item?.id && item.postId && item.content),
        )
        .forEach((item) => {
          const commentOwner = item.owner ?? "";
          const profile = profileByOwner.get(commentOwner);
          const nextComment: FeedComment = {
            id: item.id,
            postId: item.postId,
            owner: commentOwner,
            ownerId: profile?.id ?? commentOwner,
            ownerName:
              profile?.displayName ||
              profile?.username ||
              (commentOwner.split("@")[0] || "USER").toUpperCase(),
            ownerAvatar: profile?.avatarUrl,
            content: item.content,
            createdAt: item.createdAt ?? "1970-01-01T00:00:00.000Z",
            likeCount: commentLikeCountByComment[item.id] ?? 0,
            likedByMe: Boolean(myCommentLikeRecordIds[item.id]),
          };
          if (!nextCommentsByPost[item.postId]) {
            nextCommentsByPost[item.postId] = [];
          }
          nextCommentsByPost[item.postId].push(nextComment);
        });

      Object.keys(nextCommentsByPost).forEach((postId) => {
        nextCommentsByPost[postId].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setCommentsByPost(nextCommentsByPost);
      setCommentLikeRecordIdByComment(myCommentLikeRecordIds);
      setCommentLikeRecordIdsByComment(myCommentLikeRecordIdsByComment);

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          passionCount: passionCountByPost[post.id] ?? post.passionCount,
          logicCount: logicCountByPost[post.id] ?? post.logicCount,
          routineCount: routineCountByPost[post.id] ?? post.routineCount,
          saveCount: saveCountByPost[post.id] ?? post.saveCount,
        })),
      );
    } catch (error) {
      const authErrorText = JSON.stringify(error);
      const isNoCurrentUserError =
        authErrorText.includes("No current user") ||
        authErrorText.includes("NoSignedUser") ||
        authErrorText.includes("NoUserPoolError") ||
        authErrorText.includes("User needs to be authenticated");

      if (isNoCurrentUserError) {
        setCurrentOwner("");
        setCurrentUserId("");
        setPosts(fallbackPosts);
        setStories([]);
        setUnreadChatCount(0);
        hasLoadedInitialFeedRef.current = true;
        setIsInitialFeedLoading(false);
        router.replace("/(auth)/login");
        return;
      }

      console.error("[Home] failed to fetch feed:", error);
      if (!hasLoadedInitialFeedRef.current) {
        setIsInitialFeedLoading(false);
      }
    }
  }, [adjustScore, client, posts, reactionBonusScore, router, stories]);

  React.useEffect(() => {
    void loadFeed();
  }, []);

  const onRefresh = React.useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await loadFeed();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [loadFeed]);

  const isUnauthorizedGraphQLError = React.useCallback((error: unknown) => {
    const serialized = JSON.stringify(error);
    if (
      serialized.includes("Not Authorized") ||
      serialized.includes("Unauthorized")
    ) {
      return true;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      const message = String((error as { message?: unknown }).message ?? "");
      if (
        message.includes("Not Authorized") ||
        message.includes("Unauthorized")
      ) {
        return true;
      }
    }

    return false;
  }, []);

  const isDuplicateRecordError = React.useCallback((error: unknown) => {
    let serialized = "";
    try {
      serialized = JSON.stringify(error);
    } catch {
      serialized = "";
    }

    if (
      serialized.includes("already exists") ||
      serialized.includes("ConditionalCheckFailedException")
    ) {
      return true;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      const message = String((error as { message?: unknown }).message ?? "");
      if (
        message.includes("already exists") ||
        message.includes("ConditionalCheckFailedException")
      ) {
        return true;
      }
    }

    return false;
  }, []);

  const toggleReaction = React.useCallback(
    async (postId: string, reactionType: ReactionType) => {
      if (!isIdentityReady) {
        return;
      }

      const key = `${postId}:${reactionType}`;
      if (inFlightReactionKeysRef.current.has(key)) {
        return;
      }
      inFlightReactionKeysRef.current.add(key);

      try {
        const existingIds =
          reactionRecordIdsByKey[key] ??
          (reactionRecordIdByKey[key] ? [reactionRecordIdByKey[key]] : []);

        if (existingIds.length > 0) {
          const hadCleanupFailures = await deleteRecordsInBatches(
            Array.from(new Set(existingIds)),
            deletePostLikeMutation,
            "reaction",
          );
          await loadFeed();
          if (hadCleanupFailures) {
            Alert.alert(
              "失敗",
              "一部のリアクション解除に失敗しました。もう一度お試しください。",
            );
          }
          return;
        } else {
          const hashedActorId = hashActorId(currentUserId);
          const deterministicId = `${postId}:${reactionType}:${hashedActorId}`;
          await client.graphql({
            query: createPostLikeMutation,
            variables: {
              input: { id: deterministicId, postId, reactionType },
            },
          });
        }
        await loadFeed();
      } catch (error) {
        if (
          isUnauthorizedGraphQLError(error) ||
          isDuplicateRecordError(error)
        ) {
          await loadFeed();
          return;
        }
        console.error("[Home] failed to toggle reaction:", error);
        Alert.alert("失敗", "リアクション更新に失敗しました。");
      } finally {
        inFlightReactionKeysRef.current.delete(key);
      }
    },
    [
      client,
      currentOwner,
      currentUserId,
      isDuplicateRecordError,
      isUnauthorizedGraphQLError,
      isIdentityReady,
      deleteRecordsInBatches,
      loadFeed,
      reactionRecordIdByKey,
      reactionRecordIdsByKey,
    ],
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
      if (!isIdentityReady) {
        return;
      }

      clearTapState(postId);
      showGestureFeedback(postId, "passion");
      void toggleReaction(postId, "passion");
    },
    [clearTapState, isIdentityReady, showGestureFeedback, toggleReaction],
  );

  const onPostTap = React.useCallback(
    (postId: string, images: string[], initialIndex: number) => {
      const current = tapCountRef.current[postId] ?? { count: 0 };
      if (current.timer) {
        clearTimeout(current.timer);
      }
      current.count += 1;

      current.timer = setTimeout(() => {
        const count = current.count;
        delete tapCountRef.current[postId];

        if (count >= 3) {
          if (!isIdentityReady) {
            return;
          }

          showGestureFeedback(postId, "routine");
          void toggleReaction(postId, "routine");
          return;
        }

        if (count === 2) {
          if (!isIdentityReady) {
            return;
          }

          showGestureFeedback(postId, "logic");
          void toggleReaction(postId, "logic");
          return;
        }

        if (count === 1) {
          setViewerImageIndex(initialIndex);
          setImageViewerState({
            images,
            initialIndex,
          });
        }
      }, 280);

      tapCountRef.current[postId] = current;
    },
    [showGestureFeedback, toggleReaction],
  );

  React.useEffect(() => {
    if (imageViewerState) {
      setViewerImageIndex(imageViewerState.initialIndex);
      return;
    }

    setViewerImageIndex(0);
  }, [imageViewerState]);

  React.useEffect(() => {
    registerScrollToTop("home", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => registerScrollToTop("home", null);
  }, [registerScrollToTop]);

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

  React.useEffect(() => {
    const imageUrls = new Set<string>();

    stories.forEach((story) => {
      if (story.image) {
        imageUrls.add(story.image);
      }
    });

    posts.forEach((post) => {
      const postUrls = post.imageUrls.length > 0 ? post.imageUrls : [post.image];
      postUrls.forEach((url) => {
        if (url) {
          imageUrls.add(url);
        }
      });
      if (post.userAvatar) {
        imageUrls.add(post.userAvatar);
      }
    });

    if (imageUrls.size === 0) {
      return;
    }

    void Promise.all(
      Array.from(imageUrls).map(async (url) => {
        try {
          await Image.prefetch(url);
        } catch {
          // Ignore individual prefetch failures to avoid blocking UI.
        }
      }),
    );
  }, [posts, stories]);

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
              imageKeys: post.imageKeys,
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

  const extractMentionHandles = React.useCallback((raw: string) => {
    const matches = raw.match(/@([a-zA-Z0-9_.]+)/g) ?? [];
    return Array.from(
      new Set(matches.map((tag) => tag.replace("@", "").toLowerCase())),
    );
  }, []);

  const onSubmitComment = React.useCallback(
    async (postId: string) => {
      const content = (commentInputByPost[postId] ?? "").trim();
      if (!content) {
        return;
      }

      try {
        const mentionHandles = extractMentionHandles(content);
        const mentionUserIds = mentionHandles
          .map((handle) => profileIdByUsername[handle])
          .filter((id): id is string => Boolean(id));
        await client.graphql({
          query: createPostCommentMutation,
          variables: {
            input: {
              postId,
              content,
              mentionHandles,
              mentionUserIds,
            },
          },
        });
        setCommentInputByPost((prev) => ({ ...prev, [postId]: "" }));
        await loadFeed();
      } catch (error) {
        console.error("[Home] failed to create comment:", error);
        Alert.alert("失敗", "コメント投稿に失敗しました。");
      }
    },
    [
      client,
      commentInputByPost,
      extractMentionHandles,
      loadFeed,
      profileIdByUsername,
    ],
  );

  const onToggleCommentLike = React.useCallback(
    async (comment: FeedComment) => {
      if (!isIdentityReady) {
        return;
      }

      if (inFlightCommentLikeIdsRef.current.has(comment.id)) {
        return;
      }
      inFlightCommentLikeIdsRef.current.add(comment.id);

      try {
        const existingIds =
          commentLikeRecordIdsByComment[comment.id] ??
          (commentLikeRecordIdByComment[comment.id]
            ? [commentLikeRecordIdByComment[comment.id]]
            : []);

        if (existingIds.length > 0) {
          const hadCleanupFailures = await deleteRecordsInBatches(
            Array.from(new Set(existingIds)),
            deleteCommentLikeMutation,
            "comment like",
          );
          await loadFeed();
          if (hadCleanupFailures) {
            Alert.alert(
              "失敗",
              "一部のコメントいいね解除に失敗しました。もう一度お試しください。",
            );
          }
          return;
        } else {
          const hashedActorId = hashActorId(currentUserId);
          const deterministicId = `${comment.id}:${hashedActorId}`;
          await client.graphql({
            query: createCommentLikeMutation,
            variables: {
              input: { id: deterministicId, commentId: comment.id },
            },
          });
        }
        await loadFeed();
      } catch (error) {
        if (
          isUnauthorizedGraphQLError(error) ||
          isDuplicateRecordError(error)
        ) {
          await loadFeed();
          return;
        }
        console.error("[Home] failed to toggle comment like:", error);
        Alert.alert("失敗", "コメントいいね更新に失敗しました。");
      } finally {
        inFlightCommentLikeIdsRef.current.delete(comment.id);
      }
    },
    [
      client,
      commentLikeRecordIdByComment,
      commentLikeRecordIdsByComment,
      currentOwner,
      currentUserId,
      isDuplicateRecordError,
      isUnauthorizedGraphQLError,
      isIdentityReady,
      deleteRecordsInBatches,
      loadFeed,
    ],
  );

  const isOwnedByMeForComment = React.useCallback(
    (commentOwner?: string | null) => {
      if (!commentOwner) {
        return false;
      }
      if (currentOwner && commentOwner === currentOwner) {
        return true;
      }
      if (currentUserId && commentOwner === currentUserId) {
        return true;
      }
      if (currentOwner && commentOwner.endsWith(`::${currentOwner}`)) {
        return true;
      }
      return false;
    },
    [currentOwner, currentUserId],
  );

  const onDeleteComment = React.useCallback(
    (comment: FeedComment) => {
      if (!isOwnedByMeForComment(comment.owner)) {
        return;
      }

      if (inFlightCommentDeleteIdsRef.current.has(comment.id)) {
        return;
      }

      Alert.alert("コメント削除", "このコメントを削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              inFlightCommentDeleteIdsRef.current.add(comment.id);
              try {
                await client.graphql({
                  query: deletePostCommentMutation,
                  variables: { input: { id: comment.id } },
                });
                await loadFeed();
              } catch (error) {
                console.error("[Home] failed to delete comment:", error);
                Alert.alert("失敗", "コメント削除に失敗しました。");
              } finally {
                inFlightCommentDeleteIdsRef.current.delete(comment.id);
              }
            })();
          },
        },
      ]);
    },
    [client, isOwnedByMeForComment, loadFeed],
  );

  const renderCommentContent = React.useCallback(
    (content: string) => {
      const segments = content.split(/(@[a-zA-Z0-9_.]+)/g);
      return segments.map((segment, index) => {
        if (segment.startsWith("@")) {
          const handle = segment.slice(1).toLowerCase();
          const profileId = profileIdByUsername[handle];
          if (profileId) {
            return (
              <Text
                key={`${segment}-${index}`}
                style={styles.mentionText}
                onPress={() => router.push(`/profile/${profileId}`)}
              >
                {segment}
              </Text>
            );
          }
        }
        return (
          <Text key={`${segment}-${index}`} style={styles.commentTextPlain}>
            {segment}
          </Text>
        );
      });
    },
    [profileIdByUsername, router],
  );

  const onFeedScroll = React.useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event) => {
          const y = (event as { nativeEvent: { contentOffset: { y: number } } })
            .nativeEvent.contentOffset.y;

          // Re-arm once the list returns to top so next pull can trigger again.
          if (y >= 0) {
            refreshTriggerArmedRef.current = true;
            return;
          }

          if (
            y <= -42 &&
            refreshTriggerArmedRef.current &&
            !isRefreshingRef.current
          ) {
            refreshTriggerArmedRef.current = false;
            void onRefresh();
          }
        },
      }),
    [onRefresh, scrollY],
  );

  const openStoryWithInitialData = React.useCallback((targetId: string) => {
    const matchedGroup = stories.find(
      (s: any) =>
        s.id === targetId ||
        (s.allStories && s.allStories.some((as: any) => as.id === targetId)),
    );

    if (
      !matchedGroup ||
      !matchedGroup.allStories ||
      matchedGroup.allStories.length === 0
    ) {
      return;
    }
    (globalThis as any).sharedStoryQueue = matchedGroup.allStories;

    const idx = matchedGroup.allStories.findIndex((story: any) => story.id === targetId);
    router.push({
      pathname: "/story/[storyId]",
      params: {
        storyId: targetId,
        initialIndex: String(Math.max(0, idx)),
      },
    });
  }, [router, stories]);

  const headerCompensateTranslateY = React.useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-160, 0, 1],
        outputRange: [-160, 0, 0],
        extrapolateLeft: "extend",
        extrapolateRight: "clamp",
      }),
    [scrollY],
  );

  if (isInitialFeedLoading) {
    return (
      <ScreenContainer
        backgroundColor={theme.colors.surface}
        scrollable={false}
        padded={false}
      >
        <View style={styles.initialLoadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.initialLoadingText}>ホームを読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      backgroundColor={theme.colors.surface}
      scrollable={false}
      padded={false}
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.feedContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onFeedScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            colors={[theme.colors.surface]}
            tintColor={theme.colors.surface}
            progressBackgroundColor={theme.colors.surface}
            progressViewOffset={128}
          />
        }
      >
        <View style={styles.topSection}>
          <Animated.View
            style={{ transform: [{ translateY: headerCompensateTranslateY }] }}
          >
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <Pressable
                  style={styles.brandAddButton}
                  onPress={() => router.push("/post-create")}
                >
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                </Pressable>
                <Text style={styles.heading}>GROWGRAM</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>継続日数</Text>
                <Text style={styles.statValue}>{streakDays}日</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerIconButton}
                  onPress={() => router.push("/chat")}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={18}
                    color={theme.colors.text}
                  />
                  {unreadChatCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadChatCount > 9 ? "9+" : unreadChatCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <Pressable
                  style={styles.headerIconButton}
                  onPress={() => router.push("/notifications")}
                >
                  <Ionicons
                    name="notifications"
                    size={18}
                    color={theme.colors.textSub}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {isRefreshing ? (
            <View style={styles.refreshIndicatorRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storyList}
          >
            {stories.map((story) => {
              const isMyStoryItem =
                story.owner === currentOwner && currentOwner.length > 0;
              const isMyStoryUploading = isMyStoryItem && isUploadingMyStory;

              return (
                <Pressable
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => {
                    if (isMyStoryUploading) {
                      return;
                    }

                    if (story.id === "my-create") {
                      router.push("/story-create");
                      return;
                    }

                    openStoryWithInitialData(story.id);
                  }}
                >
                  <View style={styles.storyRingWrapper}>
                    {isMyStoryUploading ? (
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.storyRingSpinner, uploadingRingSpinStyle]}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.storyRing,
                        story.active && !isMyStoryUploading && styles.storyRingActive,
                        isMyStoryUploading && styles.storyRingUploading,
                      ]}
                    >
                      {story.image ? (
                        <Image
                          source={{ uri: story.image }}
                          style={[
                            styles.storyAvatar,
                            isMyStoryUploading && styles.storyAvatarUploading,
                          ]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          priority="high"
                          transition={0}
                        />
                      ) : (
                        <View
                          style={[
                            styles.storyAvatarPlaceholder,
                            isMyStoryUploading && styles.storyAvatarUploading,
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={18}
                            color={theme.colors.textSub}
                          />
                        </View>
                      )}
                    </View>
                    {isMyStoryItem ? (
                      <Pressable
                        style={[
                          styles.storyAddButton,
                          isMyStoryUploading && styles.storyAddButtonDisabled,
                        ]}
                        disabled={isMyStoryUploading}
                        onPress={(event) => {
                          event.stopPropagation();
                          if (isMyStoryUploading) {
                            return;
                          }
                          router.push("/story-create");
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={12}
                          color={theme.colors.onPrimary}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {isMyStoryUploading ? "投稿中..." : story.userName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {posts.map((post) => {
          const postDisplayUrls =
            post.imageUrls.length > 0
              ? post.imageUrls.filter((url) => Boolean(url))
              : post.image
                ? [post.image]
                : [];
          const isOwner =
            currentOwner.length > 0 && post.userId === currentOwner;
          const commentCount = (commentsByPost[post.id] ?? []).length;
          return (
            <View key={post.id} style={styles.card}>
              <View style={styles.postTopSection}>
                <View style={styles.cardHeader}>
                  <Pressable
                    style={styles.userRow}
                    onPress={() => {
                      const matchedStory = stories.find(
                        (item) =>
                          item.id !== "my-create" && item.owner === post.userId,
                      );

                      if (matchedStory) {
                        // 🔥 修正部分！ `openStoryWithInitialData` を呼び出すように変更！
                        openStoryWithInitialData(matchedStory.id);
                        return;
                      }

                      router.push(`/profile/${post.userId}`);
                    }}
                  >
                    {post.userAvatar ? (
                      <Image
                        source={{ uri: post.userAvatar }}
                        style={styles.userAvatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={0}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder} />
                    )}
                    <Text style={styles.user}>{post.userName}</Text>
                  </Pressable>
                </View>

                <Text style={styles.day}>{post.title}</Text>
              </View>
              <View style={styles.imagePressable}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const pageIndex = Math.round(
                      event.nativeEvent.contentOffset.x / cardImageWidth,
                    );
                    setVisibleImageIndexByPost((prev) => ({
                      ...prev,
                      [post.id]: pageIndex,
                    }));
                  }}
                  style={styles.imageCarousel}
                >
                  {postDisplayUrls.length > 0 ? (
                    postDisplayUrls.map((uri, index) => (
                      <Pressable
                        key={`${post.id}-${index}-${uri}`}
                        onLongPress={() => onPostLongPress(post.id)}
                        onPress={() => onPostTap(post.id, postDisplayUrls, index)}
                        style={[styles.imageSlide, { width: cardImageWidth }]}
                      >
                        <Image
                          source={{ uri }}
                          style={[styles.image, { height: cardImageHeight }]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={0}
                        />
                      </Pressable>
                    ))
                  ) : (
                    <View
                      style={[
                        styles.imageSlide,
                        styles.imageLoadingSkeleton,
                        { width: cardImageWidth, height: cardImageHeight },
                      ]}
                    >
                      <ActivityIndicator size="small" color={theme.colors.textSub} />
                    </View>
                  )}
                </ScrollView>
                <View style={styles.imageDotsRow}>
                  {(postDisplayUrls.length > 0 ? postDisplayUrls : ["pending"]).map((_, index) => {
                    const currentIndex = visibleImageIndexByPost[post.id] ?? 0;
                    const isActive = currentIndex === index;
                    return (
                      <View
                        key={`${post.id}-dot-${index}`}
                        style={[
                          styles.imageDot,
                          isActive && styles.imageDotActive,
                        ]}
                      />
                    );
                  })}
                </View>
                {post.imageCount > 1 ? (
                  <View style={styles.multipleBadge}>
                    <Ionicons
                      name="albums"
                      size={12}
                      color={theme.colors.onPrimary}
                    />
                    <Text style={styles.multipleBadgeText}>
                      {post.imageCount}
                    </Text>
                  </View>
                ) : null}
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
              </View>

              <View style={styles.postBottomSection}>
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
                  <Pressable
                    style={[
                      styles.scoreItem,
                      !isIdentityReady && styles.scoreItemDisabled,
                    ]}
                    disabled={!isIdentityReady}
                    onPress={() => {
                      showGestureFeedback(post.id, "passion");
                      void toggleReaction(post.id, "passion");
                    }}
                  >
                    <Ionicons
                      name="flame"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.scoreLabel}>{post.passionCount}</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.scoreItem,
                      !isIdentityReady && styles.scoreItemDisabled,
                    ]}
                    disabled={!isIdentityReady}
                    onPress={() => {
                      showGestureFeedback(post.id, "logic");
                      void toggleReaction(post.id, "logic");
                    }}
                  >
                    <Ionicons
                      name="bulb"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.scoreLabel}>{post.logicCount}</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.scoreItem,
                      !isIdentityReady && styles.scoreItemDisabled,
                    ]}
                    disabled={!isIdentityReady}
                    onPress={() => {
                      showGestureFeedback(post.id, "routine");
                      void toggleReaction(post.id, "routine");
                    }}
                  >
                    <Ionicons
                      name="ribbon"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.scoreLabel}>{post.routineCount}</Text>
                  </Pressable>
                </View>

                <View style={styles.postActions}>
                  {!isOwner && (
                    <Pressable
                      style={styles.postActionItem}
                      onPress={() => void toggleSave(post.id)}
                    >
                      <Ionicons
                        name={
                          savedPostIds.has(post.id)
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={25}
                        color={theme.colors.textSub}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.postActionItem}
                    onPress={() => void onRepost(post)}
                  >
                    <Ionicons
                      name="repeat-outline"
                      size={16}
                      color={theme.colors.textSub}
                    />
                  </Pressable>
                  {isOwner ? (
                    <Pressable
                      style={styles.postActionItem}
                      onPress={() => onArchive(post)}
                    >
                      <Ionicons
                        name="archive-outline"
                        size={25}
                        color={theme.colors.textSub}
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.postActionItem}
                    onPress={() =>
                      setCommentPanelOpenByPost((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }))
                    }
                  >
                    <Ionicons
                      name={
                        commentPanelOpenByPost[post.id]
                          ? "chatbubble"
                          : "chatbubble-outline"
                      }
                      size={25}
                      color={
                        commentPanelOpenByPost[post.id]
                          ? theme.colors.primary
                          : theme.colors.textSub
                      }
                    />
                    <Text
                      style={[
                        styles.postActionText,
                        commentPanelOpenByPost[post.id] &&
                          styles.postActionTextActive,
                      ]}
                    >
                      {commentCount}
                    </Text>
                  </Pressable>
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
                    </Pressable>
                  ) : null}
                </View>

                {commentPanelOpenByPost[post.id] ? (
                  <View style={styles.commentSection}>
                    <Text style={styles.commentSectionTitle}>コメント</Text>
                    <View style={styles.commentInputRow}>
                      <TextInput
                        value={commentInputByPost[post.id] ?? ""}
                        onChangeText={(text) =>
                          setCommentInputByPost((prev) => ({
                            ...prev,
                            [post.id]: text,
                          }))
                        }
                        placeholder="コメントを書く"
                        placeholderTextColor={theme.colors.textSub}
                        style={styles.commentInput}
                      />
                      <Pressable
                        style={styles.commentSendButton}
                        onPress={() => void onSubmitComment(post.id)}
                      >
                        <Ionicons
                          name="send"
                          size={14}
                          color={theme.colors.onPrimary}
                        />
                      </Pressable>
                    </View>

                    {(commentsByPost[post.id] ?? []).length === 0 ? (
                      <Text style={styles.commentEmptyText}>
                        最初のコメントをしてみよう。
                      </Text>
                    ) : null}

                    {(commentsByPost[post.id] ?? []).map((comment) => (
                      <View key={comment.id} style={styles.commentCard}>
                        <View style={styles.commentHeaderRow}>
                          <Pressable
                            style={styles.commentOwnerRow}
                            onPress={() => {
                              if (comment.ownerId) {
                                router.push(`/profile/${comment.ownerId}`);
                              }
                            }}
                          >
                            {comment.ownerAvatar ? (
                              <Image
                                source={{ uri: comment.ownerAvatar }}
                                style={styles.commentAvatar}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={0}
                              />
                            ) : (
                              <View style={styles.commentAvatarPlaceholder} />
                            )}
                            <Text style={styles.commentOwner}>
                              {comment.ownerName}
                            </Text>
                          </Pressable>

                          <View style={styles.commentActionsRow}>
                            {isOwnedByMeForComment(comment.owner) ? (
                              <Pressable
                                style={styles.commentDeleteButton}
                                onPress={() => onDeleteComment(comment)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={14}
                                  color={theme.colors.danger}
                                />
                              </Pressable>
                            ) : null}

                            <Pressable
                              style={[
                                styles.commentLikeButton,
                                !isIdentityReady &&
                                  styles.commentLikeButtonDisabled,
                              ]}
                              disabled={!isIdentityReady}
                              onPress={() => void onToggleCommentLike(comment)}
                            >
                              <Ionicons
                                name={
                                  comment.likedByMe ? "heart" : "heart-outline"
                                }
                                size={14}
                                color={
                                  comment.likedByMe
                                    ? theme.colors.danger
                                    : theme.colors.textSub
                                }
                              />
                              <Text style={styles.commentLikeText}>
                                {comment.likeCount}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                        <Text style={styles.commentText}>
                          {renderCommentContent(comment.content)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <Modal
        visible={Boolean(imageViewerState)}
        animationType="fade"
        transparent
        onRequestClose={() => setImageViewerState(null)}
      >
        <View style={styles.viewerOverlay}>
          <Pressable
            style={styles.viewerCloseButton}
            onPress={() => setImageViewerState(null)}
          >
            <Ionicons name="close" size={28} color={theme.colors.onPrimary} />
          </Pressable>

          {imageViewerState ? (
            <>
              <ScrollView
                key={`${imageViewerState.images.length}:${imageViewerState.initialIndex}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{
                  x: screenWidth * imageViewerState.initialIndex,
                  y: 0,
                }}
                onMomentumScrollEnd={(event) => {
                  const pageIndex = Math.round(
                    event.nativeEvent.contentOffset.x / screenWidth,
                  );
                  setViewerImageIndex(pageIndex);
                }}
                style={styles.viewerCarousel}
              >
                {imageViewerState.images.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    style={[styles.viewerSlide, { width: screenWidth }]}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.viewerImage}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                  </View>
                ))}
              </ScrollView>

              {imageViewerState.images.length > 1 ? (
                <View style={styles.viewerDotsRow}>
                  {imageViewerState.images.map((_, index) => {
                    const isActive = viewerImageIndex === index;
                    return (
                      <View
                        key={`viewer-dot-${index}`}
                        style={[
                          styles.imageDot,
                          styles.viewerDot,
                          isActive && styles.imageDotActive,
                        ]}
                      />
                    );
                  })}
                </View>
              ) : null}

              <Text style={styles.viewerHint}>
                {imageViewerState.images.length > 1
                  ? `${viewerImageIndex + 1} / ${imageViewerState.images.length}  左右にスワイプして全体を確認できます`
                  : "全体表示"}
              </Text>
            </>
          ) : null}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    feedContentContainer: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
    },
    topSection: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    refreshIndicatorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingTop: theme.spacing.sm,
      marginBottom: 4,
    },
    refreshIndicatorText: {
      fontSize: 12,
      color: theme.colors.textSub,
      fontWeight: "700",
    },
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
    brandAddButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: theme.colors.white,
      fontSize: 10,
      fontWeight: "900",
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
    storyRingWrapper: {
      position: "relative",
    },
    storyRing: {
      width: 62,
      height: 62,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    storyRingActive: {
      borderColor: theme.colors.primary,
    },
    storyRingUploading: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
    },
    storyRingSpinner: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 62,
      height: 62,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "#D1D5DB",
      borderTopColor: theme.colors.primary,
      zIndex: 2,
    },
    storyAvatar: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },
    storyAvatarUploading: {
      opacity: 0.5,
    },
    storyAvatarPlaceholder: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    storyAddButton: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    storyAddButtonDisabled: {
      opacity: 0.55,
    },
    storyName: {
      marginTop: 6,
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: "800",
      maxWidth: 68,
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
      backgroundColor: theme.colors.white,
      marginBottom: theme.spacing.md,
    },
    postTopSection: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    postBottomSection: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
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
      borderRadius: 0,
      backgroundColor: theme.colors.surface,
    },
    imagePressable: {
      position: "relative",
    },
    imageCarousel: {
      width: "100%",
    },
    imageSlide: {
      maxWidth: "100%",
    },
    imageLoadingSkeleton: {
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    imageDotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
    },
    imageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.18)",
    },
    imageDotActive: {
      width: 18,
      backgroundColor: theme.colors.primary,
    },
    multipleBadge: {
      position: "absolute",
      right: 10,
      top: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.72)",
      borderRadius: theme.radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    multipleBadgeText: {
      color: theme.colors.onPrimary,
      fontSize: 11,
      fontWeight: "900",
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
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    scoreItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    scoreItemDisabled: {
      opacity: 0.45,
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
    commentSection: {
      marginTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      gap: 8,
    },
    commentSectionTitle: {
      color: theme.colors.text,
      fontWeight: "800",
      fontSize: 13,
    },
    commentInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    commentInput: {
      flex: 1,
      minHeight: 38,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      paddingHorizontal: 12,
      fontWeight: "600",
    },
    commentSendButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    commentEmptyText: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
    },
    commentCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    commentHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    commentOwnerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    commentAvatar: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.white,
    },
    commentAvatarPlaceholder: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.white,
    },
    commentOwner: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: "800",
    },
    commentLikeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    commentActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    commentDeleteButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    commentLikeButtonDisabled: {
      opacity: 0.45,
    },
    commentLikeText: {
      color: theme.colors.textSub,
      fontSize: 11,
      fontWeight: "700",
    },
    commentText: {
      color: theme.colors.text,
      lineHeight: 19,
      fontSize: 13,
      fontWeight: "600",
    },
    commentTextPlain: {
      color: theme.colors.text,
      lineHeight: 19,
      fontSize: 13,
      fontWeight: "600",
    },
    initialLoadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: theme.spacing.lg,
    },
    initialLoadingText: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
    },
    mentionText: {
      color: theme.colors.primary,
      lineHeight: 19,
      fontSize: 13,
      fontWeight: "800",
    },
    viewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
    },
    viewerCloseButton: {
      position: "absolute",
      top: 56,
      right: 20,
      zIndex: 10,
    },
    viewerCarousel: {
      flexGrow: 0,
    },
    viewerDotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 12,
    },
    viewerDot: {
      backgroundColor: "rgba(255,255,255,0.35)",
    },
    viewerSlide: {
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    viewerImage: {
      width: "100%",
      height: "82%",
    },
    viewerHint: {
      textAlign: "center",
      color: "rgba(255,255,255,0.85)",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 36,
    },
  });