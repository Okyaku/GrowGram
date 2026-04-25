import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { toCloudFrontImageUrl } from "../src/services/aws/cdn";
import { theme } from "../src/theme";

const client = generateClient({ authMode: "userPool" });

interface Post {
  id: string;
  content: string;
  owner?: string | null;
  title?: string;
  imageKeys?: string[];
  imageUrls?: string[];
  passion: number;
  logic: number;
  routine: number;
  isArchived?: boolean;
  createdAt: string;
}

interface PostSave {
  owner?: string | null;
  postId: string;
  post: Post;
}

interface TabType {
  key: "saved" | "archived";
  label: string;
}

interface ArchiveContentTabType {
  key: "posts" | "stories";
  label: string;
}

interface CloudStory {
  id: string;
  owner?: string | null;
  imageKey: string;
  caption?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ArchivedStory {
  id: string;
  caption: string | null;
  imageUrl: string;
  createdAt: string;
}

const tabs: TabType[] = [
  { key: "saved", label: "保存した投稿" },
  { key: "archived", label: "アーカイブ" },
];

const archiveContentTabs: ArchiveContentTabType[] = [
  { key: "posts", label: "投稿" },
  { key: "stories", label: "ストーリー" },
];

const STORY_EXPIRATION_MS = 24 * 60 * 60 * 1000;

const listPostSavesQuery = /* GraphQL */ `
  query ListPostSaves {
    listPostSaves(limit: 1000) {
      items {
        id
        owner
        postId
        createdAt
      }
    }
  }
`;

const getPostQuery = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
      id
      content
      owner
      title
      imageKeys
      passion
      logic
      routine
      isArchived
      createdAt
    }
  }
`;

const listPostsQuery = /* GraphQL */ `
  query ListPosts {
    listPosts(limit: 1000) {
      items {
        id
        content
        owner
        title
        imageKeys
        passion
        logic
        routine
        isArchived
        createdAt
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

const isStoryArchived = (story: CloudStory) => {
  if (!story.createdAt) {
    return false;
  }

  const createdAtMs = new Date(story.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  return Date.now() - createdAtMs >= STORY_EXPIRATION_MS;
};

export default function SavedArchivedPostsScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const rawTab = params.tab;
  const normalizedTab = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const forcedTab: "saved" | "archived" | null =
    normalizedTab === "saved" || normalizedTab === "archived"
      ? normalizedTab
      : null;
  const initialTab: "saved" | "archived" = forcedTab ?? "saved";
  const [activeTab, setActiveTab] = useState<"saved" | "archived">(initialTab);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [archivedStories, setArchivedStories] = useState<ArchivedStory[]>([]);
  const [activeArchiveContentTab, setActiveArchiveContentTab] = useState<
    "posts" | "stories"
  >("posts");
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const imageScrollRef = useRef<ScrollView>(null);

  const fetchSavedPosts = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const response = (await client.graphql({
        query: listPostSavesQuery,
      })) as any;

      const saves =
        (response.data?.listPostSaves?.items as PostSave[] | undefined) || [];
      const postsData: Post[] = [];

      for (const save of saves) {
        if (save.owner !== currentUser.userId) {
          continue;
        }

        const postResponse = (await client.graphql({
          query: getPostQuery,
          variables: { id: save.postId },
        })) as any;

        const post = postResponse.data?.getPost;
        if (post && !post.isArchived) {
          // 画像URLを解決
          const imageUrls: string[] = [];
          if (post.imageKeys && Array.isArray(post.imageKeys)) {
            for (const key of post.imageKeys) {
              try {
                const resolved = await getUrl({ path: key });
                imageUrls.push(toCloudFrontImageUrl(key, resolved.url.toString()));
              } catch (error) {
                console.warn("Failed to get image URL:", key);
              }
            }
          }
          postsData.push({ ...post, imageUrls });
        }
      }

      setSavedPosts(postsData);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
    }
  }, []);

  const fetchArchivedPosts = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const response = (await client.graphql({
        query: listPostsQuery,
      })) as any;

      const posts = response.data?.listPosts?.items || [];
      const archived = posts.filter(
        (post: Post) =>
          post.isArchived === true && post.owner === currentUser.userId,
      );

      // 各投稿の画像URLを解決
      const postsWithUrls = await Promise.all(
        archived.map(async (post: Post) => {
          const imageUrls: string[] = [];
          if (post.imageKeys && Array.isArray(post.imageKeys)) {
            for (const key of post.imageKeys) {
              try {
                const resolved = await getUrl({ path: key });
                imageUrls.push(toCloudFrontImageUrl(key, resolved.url.toString()));
              } catch (error) {
                console.warn("Failed to get image URL:", key);
              }
            }
          }
          return { ...post, imageUrls };
        }),
      );

      setArchivedPosts(postsWithUrls);
    } catch (error) {
      console.error("Error fetching archived posts:", error);
    }
  }, []);

  const fetchArchivedStories = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const response = (await client.graphql({
        query: listStoriesQuery,
      })) as any;

      const stories =
        (response.data?.listStories?.items as CloudStory[] | undefined) || [];
      const archived = stories.filter(
        (story) =>
          story.owner === currentUser.userId &&
          Boolean(story.imageKey) &&
          isStoryArchived(story),
      );

      const storiesWithUrls = await Promise.all(
        archived.map(async (story) => {
          try {
            const resolved = await getUrl({ path: story.imageKey });
            return {
              id: story.id,
              caption: story.caption ?? null,
              imageUrl: toCloudFrontImageUrl(
                story.imageKey,
                resolved.url.toString(),
              ),
              createdAt: story.createdAt || new Date().toISOString(),
            } satisfies ArchivedStory;
          } catch {
            return null;
          }
        }),
      );

      setArchivedStories(
        storiesWithUrls.filter(
          (story): story is ArchivedStory => story !== null,
        ),
      );
    } catch (error) {
      console.error("Error fetching archived stories:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSavedPosts(),
        fetchArchivedPosts(),
        fetchArchivedStories(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, [fetchSavedPosts, fetchArchivedPosts, fetchArchivedStories]);

  useEffect(() => {
    if (selectedImageIndex !== null && imageScrollRef.current) {
      imageScrollRef.current.scrollTo({
        x: selectedImageIndex * 400,
        animated: false,
      });
    }
  }, [selectedImageIndex]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== "archived") {
      setActiveArchiveContentTab("posts");
    }
  }, [activeTab]);

  useEffect(() => {
    const imageUrls = new Set<string>();

    savedPosts.forEach((post) => {
      (post.imageUrls ?? []).forEach((url) => {
        if (url) {
          imageUrls.add(url);
        }
      });
    });

    archivedPosts.forEach((post) => {
      (post.imageUrls ?? []).forEach((url) => {
        if (url) {
          imageUrls.add(url);
        }
      });
    });

    archivedStories.forEach((story) => {
      if (story.imageUrl) {
        imageUrls.add(story.imageUrl);
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
          // Ignore individual prefetch failures.
        }
      }),
    );
  }, [archivedPosts, archivedStories, savedPosts]);

  const displayPosts = activeTab === "saved" ? savedPosts : archivedPosts;

  const handleImagePress = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const scoreTotal = item.passion + item.logic + item.routine;
    const imagesToShow =
      item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [];

    return (
      <Pressable
        style={styles.postCard}
        onPress={() => {
          const selectedPostPayload = {
            id: item.id,
            owner: item.owner ?? "",
            title: item.title ?? "",
            content: item.content ?? "",
            imageUrl: imagesToShow[0] ?? "",
            createdAt: item.createdAt,
          };
          if (__DEV__) {
            console.log("[SavedArchived] selected post:", selectedPostPayload);
          }
          router.push({
            pathname: "/post/[postId]",
            params: {
              postId: item.id,
              postData: JSON.stringify(selectedPostPayload),
            },
          });
        }}
      >
        <View style={styles.postHeader}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title || item.content}
          </Text>
          <Text style={styles.postDate}>
            {new Date(item.createdAt).toLocaleDateString("ja-JP")}
          </Text>
        </View>

        {imagesToShow.length > 0 && (
          <Pressable
            style={styles.imageContainer}
            onPress={() => handleImagePress(imagesToShow, 0)}
          >
            <Image
              source={{ uri: imagesToShow[0] }}
              style={styles.postImage}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
            />
            {imagesToShow.length > 1 && (
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>
                  +{imagesToShow.length - 1}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Ionicons
              name="flame"
              size={16}
              color={theme.colors.primary}
              style={styles.scoreIcon}
            />
            <Text style={styles.scoreText}>{item.passion}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Ionicons
              name="bulb"
              size={16}
              color={theme.colors.primary}
              style={styles.scoreIcon}
            />
            <Text style={styles.scoreText}>{item.logic}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Ionicons
              name="ribbon"
              size={16}
              color={theme.colors.primary}
              style={styles.scoreIcon}
            />
            <Text style={styles.scoreText}>{item.routine}</Text>
          </View>
          <Text style={styles.scoreTotalText}>計 {scoreTotal}</Text>
        </View>
      </Pressable>
    );
  };

  const renderArchivedStoryItem = ({ item }: { item: ArchivedStory }) => {
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.caption?.trim() || "ストーリー"}
          </Text>
          <Text style={styles.postDate}>
            {new Date(item.createdAt).toLocaleDateString("ja-JP")}
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.postImage}
            contentFit="cover"
            cachePolicy="disk"
            transition={300}
          />
        </View>
      </View>
    );
  };

  const showingArchivedStories =
    activeTab === "archived" && activeArchiveContentTab === "stories";
  const hasDisplayPosts = displayPosts.length > 0;
  const hasDisplayStories = archivedStories.length > 0;

  return (
    <ScreenContainer
      scrollable={false}
      padded={false}
      backgroundColor={theme.colors.surface}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
            <Text style={styles.title}>
              {activeTab === "saved" ? "保存した投稿" : "アーカイブ"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {!forcedTab && (
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.activeTabText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {activeTab === "archived" && (
            <View style={styles.archiveTabContainer}>
              {archiveContentTabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.archiveTab,
                    activeArchiveContentTab === tab.key &&
                      styles.archiveActiveTab,
                  ]}
                  onPress={() => setActiveArchiveContentTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.archiveTabText,
                      activeArchiveContentTab === tab.key &&
                        styles.archiveActiveTabText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : showingArchivedStories ? (
          hasDisplayStories ? (
            <FlatList
              data={archivedStories}
              renderItem={renderArchivedStoryItem}
              keyExtractor={(item) => `archived-story-${item.id}`}
              scrollEnabled={true}
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="time-outline"
                size={48}
                color={theme.colors.textSub}
              />
              <Text style={styles.emptyText}>
                アーカイブ済みストーリーはありません
              </Text>
            </View>
          )
        ) : !hasDisplayPosts ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === "saved" ? "bookmark" : "archive"}
              size={48}
              color={theme.colors.textSub}
            />
            <Text style={styles.emptyText}>
              {activeTab === "saved"
                ? "保存した投稿はありません"
                : "アーカイブはありません"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayPosts}
            renderItem={renderPostItem}
            keyExtractor={(item, index) => `${activeTab}-${item.id}-${index}`}
            scrollEnabled={true}
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Image Viewer Modal */}
        <Modal
          visible={selectedImageIndex !== null}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setSelectedImageIndex(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>

            {selectedImages.length > 0 && selectedImageIndex !== null && (
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                scrollEventThrottle={16}
                style={styles.imageScroll}
              >
                {selectedImages.map((imageUri, index) => (
                  <View key={index} style={styles.imageFullscreen}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.imageFullscreenImage}
                      contentFit="contain"
                      cachePolicy="disk"
                      transition={300}
                    />
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} /{" "}
                {selectedImages.length}
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.white,
    },
    archiveTabContainer: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      ...theme.shadows.soft,
    },
    archiveTab: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    archiveActiveTab: {
      backgroundColor: theme.colors.primary,
    },
    archiveTabText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.textSub,
    },
    archiveActiveTabText: {
      color: theme.colors.white,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      marginHorizontal: theme.spacing.md,
      ...theme.shadows.soft,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSub,
    },
    activeTabText: {
      color: theme.colors.white,
      fontWeight: "700",
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    postCard: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.soft,
    },
    postHeader: {
      marginBottom: theme.spacing.sm,
    },
    postTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: theme.spacing.xs,
    },
    postDate: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "500",
    },
    imageContainer: {
      position: "relative",
      marginBottom: theme.spacing.sm,
      borderRadius: theme.radius.md,
      overflow: "hidden",
    },
    postImage: {
      width: "100%",
      height: 200,
      borderRadius: theme.radius.md,
    },
    imageCountBadge: {
      position: "absolute",
      bottom: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
    },
    imageCountText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
    scoreContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    scoreItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    scoreIcon: {
      marginRight: 2,
    },
    scoreText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    scoreTotalText: {
      marginLeft: "auto",
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    emptyText: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "600",
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    closeButton: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 10,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    imageScroll: {
      width: "100%",
      height: "100%",
    },
    imageFullscreen: {
      width: 400,
      justifyContent: "center",
      alignItems: "center",
    },
    imageFullscreenImage: {
      width: "90%",
      height: "80%",
      resizeMode: "contain",
    },
    imageIndicator: {
      position: "absolute",
      bottom: 20,
      alignSelf: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.lg,
    },
    imageIndicatorText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: "600",
    },
  });
