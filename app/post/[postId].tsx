import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { toCloudFrontImageUrl } from "../../src/services/aws/cdn";
import { getThemeMode, theme } from "../../src/theme";

type CloudPost = {
  id: string;
  owner?: string | null;
  title?: string | null;
  content?: string | null;
  imageKey?: string | null;
  imageKeys?: Array<string | null> | null;
  createdAt?: string | null;
};

type CloudPostLike = {
  id: string;
  postId: string;
  owner?: string | null;
  reactionType?: "passion" | "logic" | "routine" | null;
};

type CloudPostSave = {
  id: string;
  postId: string;
  owner?: string | null;
};

type CloudPostComment = {
  id: string;
  postId: string;
  owner?: string | null;
  content?: string | null;
  createdAt?: string | null;
};

type ReactionType = "passion" | "logic" | "routine";

const getPostQuery = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
      id
      owner
      title
      content
      imageKey
      imageKeys
      createdAt
    }
  }
`;

const listPostLikesQuery = /* GraphQL */ `
  query ListPostLikes {
    listPostLikes(limit: 1000) {
      items {
        id
        postId
        owner
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
        postId
        owner
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
        createdAt
      }
    }
  }
`;

const updatePostMutation = /* GraphQL */ `
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      id
      title
      content
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

const createPostCommentMutation = /* GraphQL */ `
  mutation CreatePostComment($input: CreatePostCommentInput!) {
    createPostComment(input: $input) {
      id
      postId
      content
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

type SelectedPostPayload = {
  id: string;
  owner?: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageKeys?: string[];
  createdAt?: string;
};

type ResolvedImageItem = {
  key: string;
  url: string;
};

type PostCommentItem = {
  id: string;
  owner: string;
  content: string;
  createdAt: string;
  isMine: boolean;
};

export default function PostDetailScreen() {
  const isDarkMode = getThemeMode() === "dark";
  const styles = React.useMemo(() => createStyles(isDarkMode), [isDarkMode]);
  const { width: windowWidth } = useWindowDimensions();
  const imageWidth = Math.max(windowWidth - theme.spacing.md * 2, 1);
  const imageHeight = Math.round(imageWidth * 1.15);
  const router = useRouter();
  const { postId, postData } = useLocalSearchParams<{
    postId?: string | string[];
    postData?: string | string[];
  }>();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const normalizedPostId = React.useMemo(
    () => (Array.isArray(postId) ? postId[0] : postId) ?? "",
    [postId],
  );
  const normalizedPostData = React.useMemo(
    () => (Array.isArray(postData) ? postData[0] : postData) ?? "",
    [postData],
  );
  const parsedRoutePostData = React.useMemo<SelectedPostPayload | null>(() => {
    if (!normalizedPostData) {
      return null;
    }

    try {
      return JSON.parse(normalizedPostData) as SelectedPostPayload;
    } catch {
      return null;
    }
  }, [normalizedPostData]);
  const hasInitialPayload = parsedRoutePostData !== null;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageItems, setImageItems] = React.useState<ResolvedImageItem[]>([]);
  const [editableImageItems, setEditableImageItems] = React.useState<
    ResolvedImageItem[]
  >([]);
  const [createdAt, setCreatedAt] = React.useState("");
  const [editableTitle, setEditableTitle] = React.useState("");
  const [editableContent, setEditableContent] = React.useState("");
  const [selectedPost, setSelectedPost] =
    React.useState<SelectedPostPayload | null>(null);
  const [isOwnerPost, setIsOwnerPost] = React.useState(false);
  const [visibleImageIndex, setVisibleImageIndex] = React.useState(0);
  const [passionCount, setPassionCount] = React.useState(0);
  const [logicCount, setLogicCount] = React.useState(0);
  const [routineCount, setRoutineCount] = React.useState(0);
  const [saveCount, setSaveCount] = React.useState(0);
  const [commentCount, setCommentCount] = React.useState(0);
  const [isSavedByMe, setIsSavedByMe] = React.useState(false);
  const [saveRecordId, setSaveRecordId] = React.useState<string | null>(null);
  const [isSavePending, setIsSavePending] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [reactionRecordIdByType, setReactionRecordIdByType] = React.useState<
    Partial<Record<ReactionType, string>>
  >({});
  const [isReactionPendingByType, setIsReactionPendingByType] = React.useState<
    Partial<Record<ReactionType, boolean>>
  >({});
  const [commentPanelOpen, setCommentPanelOpen] = React.useState(false);
  const [commentInput, setCommentInput] = React.useState("");
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [postComments, setPostComments] = React.useState<PostCommentItem[]>([]);
  const [deletingCommentIds, setDeletingCommentIds] = React.useState<
    Record<string, boolean>
  >({});

  const reactionPalette = React.useMemo(
    () => ({
      passion: {
        active: isDarkMode ? "#FF8A5B" : "#FF5A2A",
      },
      logic: {
        active: isDarkMode ? "#6EA8FF" : "#1F73FF",
      },
      routine: {
        active: isDarkMode ? "#5BD3AC" : "#0E9F6E",
      },
    }),
    [isDarkMode],
  );

  React.useEffect(() => {
    if (!parsedRoutePostData) {
      return;
    }

    setSelectedPost(parsedRoutePostData);
    if (__DEV__) {
      console.log("[PostDetail] selected post from route:", parsedRoutePostData);
    }

    setTitle(parsedRoutePostData.title ?? "投稿");
    setContent(parsedRoutePostData.content ?? "");
    setEditableTitle(parsedRoutePostData.title ?? "");
    setEditableContent(parsedRoutePostData.content ?? "");
    setCreatedAt(parsedRoutePostData.createdAt ?? "");
    const payloadImageUrls = (parsedRoutePostData.imageUrls ?? []).filter(
      (url) => Boolean(url),
    );
    const payloadImageKeys = parsedRoutePostData.imageKeys ?? [];

    if (payloadImageUrls.length > 0) {
      const initialImages = payloadImageUrls.map((url, index) => ({
        key: payloadImageKeys[index] ?? url,
        url,
      }));
      setImageItems(initialImages);
      setEditableImageItems(initialImages);
      setImageUrl(initialImages[0]?.url ?? null);
    } else if (parsedRoutePostData.imageUrl) {
      const initialImage = {
        key: parsedRoutePostData.imageUrl,
        url: parsedRoutePostData.imageUrl,
      } satisfies ResolvedImageItem;
      setImageItems([initialImage]);
      setEditableImageItems([initialImage]);
      setImageUrl(parsedRoutePostData.imageUrl);
    }

    // Route payload exists, so render immediately and sync in background.
    setIsLoading(false);
  }, [parsedRoutePostData]);

  React.useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      const targetPostId = normalizedPostId || parsedRoutePostData?.id || "";
      if (!targetPostId) {
        setIsLoading(false);
        return;
      }

      try {
        let meUserId = "";
        let meUsername = "";
        try {
          const me = await getCurrentUser();
          meUserId = me.userId ?? "";
          meUsername = me.username ?? "";
        } catch {
          // Keep empty owner identity for non-authenticated or failed auth state.
        }

        const [postResponse, likesResponse, savesResponse, commentsResponse] =
          await Promise.all([
            client.graphql({
              query: getPostQuery,
              variables: { id: targetPostId },
            }),
            client.graphql({ query: listPostLikesQuery }),
            client.graphql({ query: listPostSavesQuery }),
            client.graphql({ query: listPostCommentsQuery }),
          ]);

        const post =
          (postResponse as { data?: { getPost?: CloudPost | null } }).data
            ?.getPost ?? null;

        if (!post || !isMounted) {
          return;
        }

        setTitle(post.title ?? "投稿");
        setContent(post.content ?? "");
        setEditableTitle(post.title ?? "");
        setEditableContent(post.content ?? "");
        setCreatedAt(post.createdAt ?? "");

        const postOwner = post.owner ?? "";
        const mine =
          (meUserId.length > 0 && postOwner === meUserId) ||
          (meUsername.length > 0 && postOwner === meUsername) ||
          (meUsername.length > 0 && postOwner.endsWith(`::${meUsername}`));
        setIsOwnerPost(mine);

        const isOwnedByViewer = (owner?: string | null) => {
          if (!owner) {
            return false;
          }
          if (meUserId.length > 0 && owner === meUserId) {
            return true;
          }
          if (meUsername.length > 0 && owner === meUsername) {
            return true;
          }
          if (meUsername.length > 0 && owner.endsWith(`::${meUsername}`)) {
            return true;
          }
          if (meUserId.length > 0 && owner.endsWith(`::${meUserId}`)) {
            return true;
          }
          return false;
        };

        const likesItems =
          (
            likesResponse as {
              data?: { listPostLikes?: { items?: Array<CloudPostLike | null> } };
            }
          ).data?.listPostLikes?.items ?? [];
        const validLikes = likesItems.filter(
          (item): item is CloudPostLike =>
            Boolean(item?.id && item.postId === post.id && item.reactionType),
        );
        const myReactionIdByType: Partial<Record<ReactionType, string>> = {};
        validLikes.forEach((item) => {
          const reactionType = item.reactionType;
          if (!reactionType) {
            return;
          }
          if (isOwnedByViewer(item.owner)) {
            myReactionIdByType[reactionType] = item.id;
          }
        });
        setReactionRecordIdByType(myReactionIdByType);
        setPassionCount(
          validLikes.filter((item) => item.reactionType === "passion").length,
        );
        setLogicCount(
          validLikes.filter((item) => item.reactionType === "logic").length,
        );
        setRoutineCount(
          validLikes.filter((item) => item.reactionType === "routine").length,
        );

        const savesItems =
          (
            savesResponse as {
              data?: { listPostSaves?: { items?: Array<CloudPostSave | null> } };
            }
          ).data?.listPostSaves?.items ?? [];
        const validSaves = savesItems.filter(
          (item): item is CloudPostSave =>
            Boolean(item?.id && item.postId === post.id),
        );
        setSaveCount(validSaves.length);
        const mySave = validSaves.find((item) => isOwnedByViewer(item.owner));
        setSaveRecordId(mySave?.id ?? null);
        setIsSavedByMe(Boolean(mySave));

        const commentItems =
          (
            commentsResponse as {
              data?: {
                listPostComments?: { items?: Array<CloudPostComment | null> };
              };
            }
          ).data?.listPostComments?.items ?? [];
        const validComments = commentItems.filter(
          (item): item is CloudPostComment =>
            Boolean(item?.id && item.postId === post.id),
        );
        setCommentCount(validComments.length);
        setPostComments(
          validComments
            .map((item) => ({
              id: item.id,
              owner: item.owner ?? "USER",
              content: item.content ?? "",
              createdAt: item.createdAt ?? "1970-01-01T00:00:00.000Z",
              isMine: isOwnedByViewer(item.owner),
            }))
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            ),
        );

        const keys = (post.imageKeys ?? []).filter(
          (item): item is string => Boolean(item),
        );
        const imageSources =
          keys.length > 0
            ? keys
            : post.imageKey
              ? [post.imageKey]
              : [];
        if (imageSources.length === 0) {
          setImageUrl(null);
          setImageItems([]);
          setEditableImageItems([]);
          return;
        }

        const resolvedItems = await Promise.all(
          imageSources.map(async (source) => {
            if (
              source.startsWith("http://") ||
              source.startsWith("https://")
            ) {
              return { key: source, url: source } satisfies ResolvedImageItem;
            }

            try {
              const resolved = await getUrl({ path: source });
              return {
                key: source,
                url: toCloudFrontImageUrl(source, resolved.url.toString()),
              } satisfies ResolvedImageItem;
            } catch {
              return null;
            }
          }),
        );

        const safeResolvedItems = resolvedItems.filter(
          (item): item is ResolvedImageItem => item !== null,
        );

        if (isMounted) {
          setImageItems(safeResolvedItems);
          setEditableImageItems(safeResolvedItems);
          setImageUrl(safeResolvedItems[0]?.url ?? null);
          setVisibleImageIndex(0);
          if (__DEV__) {
            console.log("[PostDetail] selected post after fetch:", {
              id: post.id,
              owner: post.owner,
              title: post.title,
              imageCount: safeResolvedItems.length,
              imageUrl: safeResolvedItems[0]?.url ?? null,
            });
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log("[PostDetail] failed to load post:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      isMounted = false;
    };
  }, [client, normalizedPostId, parsedRoutePostData?.id, refreshTick]);

  React.useEffect(() => {
    const imageUrls = new Set<string>();

    imageItems.forEach((item) => {
      if (item.url) {
        imageUrls.add(item.url);
      }
    });

    editableImageItems.forEach((item) => {
      if (item.url) {
        imageUrls.add(item.url);
      }
    });

    if (imageUrl) {
      imageUrls.add(imageUrl);
    }

    if (imageUrls.size === 0) {
      return;
    }

    void Promise.all(
      Array.from(imageUrls).map(async (url) => {
        try {
          await Image.prefetch(url);
        } catch {
          // Ignore individual prefetch failures.
        }
      }),
    );
  }, [editableImageItems, imageItems, imageUrl]);

  const targetPostId = normalizedPostId || selectedPost?.id || "";

  const onSaveEdit = React.useCallback(async () => {
    if (!targetPostId) {
      Alert.alert("失敗", "投稿IDが取得できませんでした。");
      return;
    }

    setIsSaving(true);
    try {
      await client.graphql({
        query: updatePostMutation,
        variables: {
          input: {
            id: targetPostId,
            title: editableTitle.trim(),
            content: editableContent.trim(),
            imageKey: editableImageItems[0]?.key ?? null,
            imageKeys: editableImageItems.map((item) => item.key),
          },
        },
      });

      setTitle(editableTitle.trim() || "投稿");
      setContent(editableContent.trim());
      setImageItems(editableImageItems);
      setImageUrl(editableImageItems[0]?.url ?? null);
      setIsEditMode(false);
      Alert.alert("完了", "投稿を更新しました。");
    } catch (error) {
      console.log("[PostDetail] failed to update post:", error);
      Alert.alert("失敗", "投稿の更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  }, [client, editableContent, editableImageItems, editableTitle, targetPostId]);

  const onRemoveEditableImage = React.useCallback((index: number) => {
    setEditableImageItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onDeletePost = React.useCallback(() => {
    if (!targetPostId) {
      Alert.alert("失敗", "投稿IDが取得できませんでした。");
      return;
    }

    Alert.alert("投稿削除", "この投稿を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setIsDeleting(true);
            try {
              // Hide from feeds immediately even if physical delete takes longer.
              await client.graphql({
                query: updatePostMutation,
                variables: { input: { id: targetPostId, isArchived: true } },
              });

              await client.graphql({
                query: deletePostMutation,
                variables: { input: { id: targetPostId } },
              });
              Alert.alert("完了", "投稿を削除しました。");
              router.back();
            } catch (error) {
              console.log("[PostDetail] failed to delete post:", error);
              Alert.alert("失敗", "投稿の削除に失敗しました。");
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  }, [client, router, targetPostId]);

  const onToggleSave = React.useCallback(async () => {
    if (!targetPostId) {
      return;
    }
    setIsSavePending(true);
    try {
      if (saveRecordId) {
        await client.graphql({
          query: deletePostSaveMutation,
          variables: { input: { id: saveRecordId } },
        });
      } else {
        await client.graphql({
          query: createPostSaveMutation,
          variables: { input: { postId: targetPostId } },
        });
      }
      setRefreshTick((prev) => prev + 1);
    } catch (error) {
      console.log("[PostDetail] failed to toggle save:", error);
      Alert.alert("失敗", "保存更新に失敗しました。");
    } finally {
      setIsSavePending(false);
    }
  }, [client, saveRecordId, targetPostId]);

  const onArchivePost = React.useCallback(async () => {
    if (!targetPostId) {
      return;
    }
    Alert.alert("アーカイブ", "この投稿をアーカイブしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "アーカイブする",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setIsArchiving(true);
            try {
              await client.graphql({
                query: updatePostMutation,
                variables: { input: { id: targetPostId, isArchived: true } },
              });
              Alert.alert("完了", "アーカイブしました。");
              router.back();
            } catch (error) {
              console.log("[PostDetail] failed to archive post:", error);
              Alert.alert("失敗", "アーカイブに失敗しました。");
            } finally {
              setIsArchiving(false);
            }
          })();
        },
      },
    ]);
  }, [client, router, targetPostId]);

  const onImageMomentumEnd = React.useCallback(
    (offsetX: number) => {
      if (imageWidth <= 0) {
        return;
      }
      const index = Math.round(offsetX / imageWidth);
      setVisibleImageIndex(Math.max(index, 0));
    },
    [imageWidth],
  );

  const onToggleReaction = React.useCallback(
    async (reactionType: ReactionType) => {
      if (!targetPostId) {
        return;
      }
      if (isReactionPendingByType[reactionType]) {
        return;
      }

      setIsReactionPendingByType((prev) => ({
        ...prev,
        [reactionType]: true,
      }));

      try {
        const existingId = reactionRecordIdByType[reactionType];
        if (existingId) {
          await client.graphql({
            query: deletePostLikeMutation,
            variables: { input: { id: existingId } },
          });
        } else {
          await client.graphql({
            query: createPostLikeMutation,
            variables: { input: { postId: targetPostId, reactionType } },
          });
        }
        setRefreshTick((prev) => prev + 1);
      } catch (error) {
        console.log("[PostDetail] failed to toggle reaction:", error);
        Alert.alert("失敗", "リアクション更新に失敗しました。");
      } finally {
        setIsReactionPendingByType((prev) => ({
          ...prev,
          [reactionType]: false,
        }));
      }
    },
    [client, isReactionPendingByType, reactionRecordIdByType, targetPostId],
  );

  const onSubmitComment = React.useCallback(async () => {
    if (!targetPostId) {
      return;
    }
    const nextComment = commentInput.trim();
    if (!nextComment) {
      return;
    }
    setIsSubmittingComment(true);
    try {
      await client.graphql({
        query: createPostCommentMutation,
        variables: { input: { postId: targetPostId, content: nextComment } },
      });
      setCommentInput("");
      setRefreshTick((prev) => prev + 1);
    } catch (error) {
      console.log("[PostDetail] failed to submit comment:", error);
      Alert.alert("失敗", "コメント送信に失敗しました。");
    } finally {
      setIsSubmittingComment(false);
    }
  }, [client, commentInput, targetPostId]);

  const onDeleteComment = React.useCallback(
    (comment: PostCommentItem) => {
      if (!comment.isMine || deletingCommentIds[comment.id]) {
        return;
      }

      Alert.alert("コメント削除", "このコメントを削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingCommentIds((prev) => ({
                ...prev,
                [comment.id]: true,
              }));
              try {
                await client.graphql({
                  query: deletePostCommentMutation,
                  variables: { input: { id: comment.id } },
                });
                setRefreshTick((prev) => prev + 1);
              } catch (error) {
                console.log("[PostDetail] failed to delete comment:", error);
                Alert.alert("失敗", "コメント削除に失敗しました。");
              } finally {
                setDeletingCommentIds((prev) => ({
                  ...prev,
                  [comment.id]: false,
                }));
              }
            })();
          },
        },
      ]);
    },
    [client, deletingCommentIds],
  );

  return (
    <ScreenContainer backgroundColor={theme.colors.white}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>投稿詳細</Text>
        <View style={styles.iconButtonDummy} />
      </View>

      {isLoading && !hasInitialPayload ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {imageItems.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={[styles.imagePager, { width: imageWidth }]}
              onMomentumScrollEnd={(event) => {
                onImageMomentumEnd(event.nativeEvent.contentOffset.x);
              }}
            >
              {imageItems.map((item, index) => (
                <Image
                  key={`${item.key}-${index}`}
                  source={{ uri: item.url }}
                  style={[styles.image, { width: imageWidth, height: imageHeight }]}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={300}
                />
              ))}
            </ScrollView>
          ) : imageItems.length === 1 ? (
            <Image
              source={{ uri: imageItems[0].url }}
              style={[
                styles.image,
                styles.singleImage,
                { width: imageWidth, height: imageHeight },
              ]}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
            />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                styles.singleImage,
                { width: imageWidth, height: imageHeight },
              ]}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
            />
          ) : null}
          {imageItems.length > 1 ? (
            <View style={styles.imageDotsRow}>
              {imageItems.map((item, index) => (
                <View
                  key={`${item.key}-dot-${index}`}
                  style={[
                    styles.imageDot,
                    visibleImageIndex === index && styles.imageDotActive,
                  ]}
                />
              ))}
            </View>
          ) : null}
          {imageItems.length > 1 ? (
            <View style={styles.multipleBadge}>
              <Ionicons name="albums" size={12} color={theme.colors.onPrimary} />
              <Text style={styles.multipleBadgeText}>{imageItems.length}</Text>
            </View>
          ) : null}
          {isEditMode ? (
            <TextInput
              value={editableTitle}
              onChangeText={setEditableTitle}
              placeholder="タイトル"
              style={styles.titleInput}
            />
          ) : (
            <Text style={styles.title}>{title || "投稿"}</Text>
          )}
          {createdAt ? (
            <Text style={styles.date}>{new Date(createdAt).toLocaleString()}</Text>
          ) : null}

          {isEditMode ? (
            <View style={styles.imageEditWrap}>
              <Text style={styles.imageEditLabel}>画像（削除のみ可能）</Text>
              {editableImageItems.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {editableImageItems.map((item, index) => (
                    <View key={`${item.key}-${index}`} style={styles.editImageItem}>
                      <Image
                        source={{ uri: item.url }}
                        style={styles.editImagePreview}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={300}
                      />
                      <Pressable
                        style={styles.editImageRemoveButton}
                        onPress={() => onRemoveEditableImage(index)}
                      >
                        <Ionicons name="close" size={14} color={theme.colors.white} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noImageText}>画像はありません</Text>
              )}
            </View>
          ) : null}

          {isEditMode ? (
            <TextInput
              value={editableContent}
              onChangeText={setEditableContent}
              placeholder="本文"
              style={styles.contentInput}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.content}>{content}</Text>
          )}

          <View style={styles.scoreRow}>
            <Pressable
              style={[
                styles.scoreItem,
                reactionRecordIdByType.passion && styles.scoreItemPassionActive,
              ]}
              onPress={() => void onToggleReaction("passion")}
              disabled={Boolean(isReactionPendingByType.passion)}
            >
              <Ionicons
                name="flame"
                size={14}
                color={
                  reactionRecordIdByType.passion
                    ? reactionPalette.passion.active
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.scoreLabel,
                  reactionRecordIdByType.passion && styles.scoreLabelPassionActive,
                ]}
              >
                {passionCount}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.scoreItem,
                reactionRecordIdByType.logic && styles.scoreItemLogicActive,
              ]}
              onPress={() => void onToggleReaction("logic")}
              disabled={Boolean(isReactionPendingByType.logic)}
            >
              <Ionicons
                name="bulb"
                size={14}
                color={
                  reactionRecordIdByType.logic
                    ? reactionPalette.logic.active
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.scoreLabel,
                  reactionRecordIdByType.logic && styles.scoreLabelLogicActive,
                ]}
              >
                {logicCount}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.scoreItem,
                reactionRecordIdByType.routine && styles.scoreItemRoutineActive,
              ]}
              onPress={() => void onToggleReaction("routine")}
              disabled={Boolean(isReactionPendingByType.routine)}
            >
              <Ionicons
                name="ribbon"
                size={14}
                color={
                  reactionRecordIdByType.routine
                    ? reactionPalette.routine.active
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.scoreLabel,
                  reactionRecordIdByType.routine && styles.scoreLabelRoutineActive,
                ]}
              >
                {routineCount}
              </Text>
            </Pressable>
          </View>

          <View style={styles.engagementRow}>
            <Pressable
              style={styles.engagementItem}
              onPress={() => void onToggleSave()}
              disabled={isSavePending}
            >
              <Ionicons
                name={isSavedByMe ? "bookmark" : "bookmark-outline"}
                size={18}
                color={theme.colors.textSub}
              />
              <Text style={styles.engagementText}>{saveCount}</Text>
            </Pressable>

            <Pressable
              style={styles.engagementItem}
              onPress={() => setCommentPanelOpen((prev) => !prev)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.textSub}
              />
              <Text style={styles.engagementText}>{commentCount}</Text>
            </Pressable>

            {isOwnerPost ? (
              <Pressable
                style={styles.engagementItem}
                onPress={() => void onArchivePost()}
                disabled={isArchiving}
              >
                <Ionicons
                  name="archive-outline"
                  size={18}
                  color={theme.colors.textSub}
                />
                <Text style={styles.engagementText}>
                  {isArchiving ? "処理中" : "アーカイブ"}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {commentPanelOpen ? (
            <View style={styles.commentSection}>
              <Text style={styles.commentSectionTitle}>コメント</Text>
              {postComments.length > 0 ? (
                postComments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeaderRow}>
                      <Text style={styles.commentOwner} numberOfLines={1}>
                        {comment.owner}
                      </Text>
                      {comment.isMine ? (
                        <Pressable
                          style={styles.commentDeleteButton}
                          disabled={Boolean(deletingCommentIds[comment.id])}
                          onPress={() => onDeleteComment(comment)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={theme.colors.danger}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.commentEmpty}>まだコメントがありません</Text>
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder="コメントを書く"
                  placeholderTextColor={theme.colors.textSub}
                  style={styles.commentInput}
                />
                <Pressable
                  style={styles.commentSendButton}
                  onPress={() => void onSubmitComment()}
                  disabled={isSubmittingComment}
                >
                  <Ionicons name="send" size={14} color={theme.colors.white} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {isOwnerPost ? (
            <View style={styles.actionRow}>
              {isEditMode ? (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => void onSaveEdit()}
                  disabled={isSaving}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSaving ? "保存中..." : "保存"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => setIsEditMode(true)}
                >
                  <Text style={styles.primaryButtonText}>編集</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.actionButton, styles.dangerButton]}
                onPress={onDeletePost}
                disabled={isDeleting}
              >
                <Text style={styles.dangerButtonText}>
                  {isDeleting ? "削除中..." : "削除"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    iconButtonDummy: {
      width: 36,
      height: 36,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    centerBox: {
      paddingVertical: theme.spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
    },
    singleImage: {
      marginBottom: theme.spacing.sm,
    },
    imagePager: {
      marginBottom: 0,
    },
    imageDotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    imageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)",
    },
    imageDotActive: {
      backgroundColor: theme.colors.primary,
      width: 14,
      borderRadius: 999,
    },
    multipleBadge: {
      position: "absolute",
      right: theme.spacing.sm,
      top: 56,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDarkMode ? "rgba(0,0,0,0.58)" : "rgba(20,20,20,0.5)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    multipleBadgeText: {
      color: theme.colors.onPrimary,
      fontSize: 11,
      fontWeight: "800",
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "900",
      marginBottom: 2,
    },
    date: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: theme.spacing.xs,
    },
    content: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    scoreItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: "transparent",
    },
    scoreItemPassionActive: {
      backgroundColor: isDarkMode ? "#3B2118" : "#FFF1EA",
      borderColor: isDarkMode ? "#8F533D" : "#FFC8B8",
    },
    scoreItemLogicActive: {
      backgroundColor: isDarkMode ? "#1A2940" : "#EEF4FF",
      borderColor: isDarkMode ? "#4C78B8" : "#BFD7FF",
    },
    scoreItemRoutineActive: {
      backgroundColor: isDarkMode ? "#18362C" : "#EAF8F2",
      borderColor: isDarkMode ? "#4BA586" : "#BEEBD8",
    },
    scoreLabelPassionActive: {
      color: isDarkMode ? "#FF9F7A" : "#C63D14",
    },
    scoreLabelLogicActive: {
      color: isDarkMode ? "#8AB7FF" : "#1F56C4",
    },
    scoreLabelRoutineActive: {
      color: isDarkMode ? "#83D9BB" : "#0C7A56",
    },
    scoreItemDisabled: {
      opacity: 0.55,
    },
    scoreItemActive: {
      backgroundColor: "#FFF4E8",
      borderWidth: 1,
      borderColor: "#F7C99B",
    },
    scoreLabel: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
    engagementRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xs,
    },
    engagementItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    engagementText: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "700",
    },
    commentSection: {
      marginTop: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    commentSectionTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
    commentItem: {
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surface,
    },
    commentHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    commentOwner: {
      color: theme.colors.textSub,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 2,
    },
    commentDeleteButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.92,
    },
    commentContent: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
    commentEmpty: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
    },
    commentInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      color: theme.colors.text,
      fontSize: 13,
    },
    commentSendButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    imageEditWrap: {
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    imageEditLabel: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "700",
    },
    editImageItem: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.md,
      marginRight: theme.spacing.xs,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      position: "relative",
    },
    editImagePreview: {
      width: "100%",
      height: "100%",
    },
    editImageRemoveButton: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.62)",
    },
    noImageText: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
    },
    titleInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      color: theme.colors.text,
    },
    contentInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 22,
    },
    actionRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    dangerButton: {
      backgroundColor: "#D93025",
    },
    primaryButtonText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: "700",
    },
    dangerButtonText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: "700",
    },
  });
