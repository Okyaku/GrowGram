import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";

type CloudPost = {
  id: string;
  owner?: string | null;
  title?: string | null;
  content?: string | null;
  imageKey?: string | null;
  imageKeys?: Array<string | null> | null;
  createdAt?: string | null;
};

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

const updatePostMutation = /* GraphQL */ `
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      id
      title
      content
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

export default function PostDetailScreen() {
  const styles = React.useMemo(() => createStyles(), []);
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

  React.useEffect(() => {
    if (!normalizedPostData) {
      return;
    }

    try {
      const parsed = JSON.parse(normalizedPostData) as SelectedPostPayload;
      setSelectedPost(parsed);
      if (__DEV__) {
        console.log("[PostDetail] selected post from route:", parsed);
      }

      setTitle(parsed.title ?? "投稿");
      setContent(parsed.content ?? "");
      setEditableTitle(parsed.title ?? "");
      setEditableContent(parsed.content ?? "");
      setCreatedAt(parsed.createdAt ?? "");
      const payloadImageUrls = (parsed.imageUrls ?? []).filter((url) =>
        Boolean(url),
      );
      const payloadImageKeys = parsed.imageKeys ?? [];

      if (payloadImageUrls.length > 0) {
        const initialImages = payloadImageUrls.map((url, index) => ({
          key: payloadImageKeys[index] ?? url,
          url,
        }));
        setImageItems(initialImages);
        setEditableImageItems(initialImages);
        setImageUrl(initialImages[0]?.url ?? null);
      } else if (parsed.imageUrl) {
        const initialImage = {
          key: parsed.imageUrl,
          url: parsed.imageUrl,
        } satisfies ResolvedImageItem;
        setImageItems([initialImage]);
        setEditableImageItems([initialImage]);
        setImageUrl(parsed.imageUrl);
      }
    } catch (error) {
      if (__DEV__) {
        console.log("[PostDetail] failed to parse postData:", error);
      }
    }
  }, [normalizedPostData]);

  React.useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      const targetPostId = normalizedPostId || selectedPost?.id || "";
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

        const response = await client.graphql({
          query: getPostQuery,
          variables: { id: targetPostId },
        });

        const post =
          (response as { data?: { getPost?: CloudPost | null } }).data?.getPost ??
          null;

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
                url: resolved.url.toString(),
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
  }, [client, normalizedPostId, selectedPost?.id]);

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

  return (
    <ScreenContainer backgroundColor={theme.colors.white}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>投稿詳細</Text>
        <View style={styles.iconButtonDummy} />
      </View>

      {isLoading ? (
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
                  resizeMode="cover"
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
              resizeMode="cover"
            />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                styles.singleImage,
                { width: imageWidth, height: imageHeight },
              ]}
              resizeMode="cover"
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
                      <Image source={{ uri: item.url }} style={styles.editImagePreview} />
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

const createStyles = () =>
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
      backgroundColor: "rgba(0,0,0,0.22)",
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
      backgroundColor: "rgba(0,0,0,0.55)",
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
      backgroundColor: "rgba(0,0,0,0.75)",
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
