import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { CustomButton } from "../../src/components/common";
import { ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { useTabScrollTop } from "../../src/store/tab-scroll-top-context";
import { theme } from "../../src/theme";

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const GRID_RADIUS = 8;
const GRID_ITEM_SIZE =
  (Dimensions.get("window").width - theme.spacing.md * 2 - GRID_GAP * 2) /
  GRID_COLUMNS;

type CloudProfile = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  bio?: string | null;
  iconImageKey?: string | null;
};

type CloudFollow = {
  id: string;
  followerId: string;
  followingId: string;
};

type CloudPost = {
  id: string;
  owner?: string | null;
  title?: string | null;
  content?: string | null;
  imageKey?: string | null;
  imageKeys?: Array<string | null> | null;
  createdAt?: string | null;
};

type GalleryPost = {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
};

const getProfileQuery = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
      id
      username
      displayName
      bio
      iconImageKey
    }
  }
`;

const listMyPostsQuery = /* GraphQL */ `
  query ListMyPosts {
    listPosts(limit: 1000) {
      items {
        id
        owner
        title
        content
        imageKey
        imageKeys
        createdAt
      }
    }
  }
`;

const listFollowsQuery = /* GraphQL */ `
  query ListFollows {
    listFollows(limit: 2000) {
      items {
        id
        followerId
        followingId
      }
    }
  }
`;

export default function MyPageScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();

  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const { registerScrollToTop } = useTabScrollTop();
  const scrollViewRef = React.useRef<ScrollView | null>(null);
  const [name, setName] = React.useState("ユーザー");
  const [usernameId, setUsernameId] = React.useState("user");
  const [caption, setCaption] =
    React.useState("プロフィールを設定してください");
  const [ageLabel, setAgeLabel] = React.useState("年齢未設定");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [postCount, setPostCount] = React.useState(0);
  const [followersCount, setFollowersCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);
  const [posts, setPosts] = React.useState<GalleryPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true);

  React.useEffect(() => {
    registerScrollToTop("mypage", () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => registerScrollToTop("mypage", null);
  }, [registerScrollToTop]);

  const loadMyPageData = React.useCallback(async () => {
    try {
      const authUser = await getCurrentUser();
      const userId = authUser.userId;
      if (!userId) {
        return;
      }

      const [profileResponse, postsResponse, followsResponse] =
        await Promise.all([
          client.graphql({ query: getProfileQuery, variables: { id: userId } }),
          client.graphql({ query: listMyPostsQuery }),
          client.graphql({ query: listFollowsQuery }),
        ]);

      const profile =
        (profileResponse as { data?: { getProfile?: CloudProfile | null } })
          .data?.getProfile ?? null;

      if (profile) {
        const resolvedName =
          profile.displayName?.trim() || profile.username?.trim() || "ユーザー";
        const resolvedUsername = profile.username?.trim() || "user";
        const resolvedBio =
          profile.bio?.trim() || "プロフィールを設定してください";
        const ageMatch = resolvedBio.match(/(\d{1,2})\s*歳/);

        setName(resolvedName);
        setUsernameId(resolvedUsername);
        setCaption(resolvedBio);
        setAgeLabel(ageMatch ? `${ageMatch[1]}歳` : "年齢未設定");

        if (profile.iconImageKey) {
          try {
            const urlResult = await getUrl({ path: profile.iconImageKey });
            setAvatarUrl(urlResult.url.toString());
          } catch {
            setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }
      }

      const allPosts =
        (
          postsResponse as {
            data?: {
              listPosts?: { items?: Array<CloudPost | null> };
            };
          }
        ).data?.listPosts?.items ?? [];

      const normalizedOwnPosts = allPosts
        .filter((item): item is CloudPost =>
          Boolean(item?.id && (item.owner ?? "") === authUser.username),
        )
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

      setPostCount(normalizedOwnPosts.length);

      const galleryCandidates = normalizedOwnPosts
        .map((item) => {
          const keys = (item.imageKeys ?? []).filter((key): key is string =>
            Boolean(key),
          );
          const primaryImage = keys[0] ?? item.imageKey ?? null;
          return {
            id: item.id,
            title: item.title ?? "",
            content: item.content ?? "",
            createdAt: item.createdAt ?? "",
            primaryImage,
          };
        })
        .filter((item) => Boolean(item.primaryImage));

      const resolvedGallery = await Promise.all(
        galleryCandidates.map(async (item) => {
          const source = item.primaryImage as string;
          if (source.startsWith("http://") || source.startsWith("https://")) {
            return {
              id: item.id,
              title: item.title,
              content: item.content,
              createdAt: item.createdAt,
              imageUrl: source,
            } satisfies GalleryPost;
          }

          try {
            const resolved = await getUrl({ path: source });
            return {
              id: item.id,
              title: item.title,
              content: item.content,
              createdAt: item.createdAt,
              imageUrl: resolved.url.toString(),
            } satisfies GalleryPost;
          } catch {
            return null;
          }
        }),
      );

      setPosts(
        resolvedGallery.filter((item): item is GalleryPost => Boolean(item)),
      );

      const follows =
        (
          followsResponse as {
            data?: { listFollows?: { items?: Array<CloudFollow | null> } };
          }
        ).data?.listFollows?.items ?? [];
      const normalizedFollows = follows.filter((item): item is CloudFollow =>
        Boolean(item?.id && item.followerId && item.followingId),
      );
      setFollowersCount(
        normalizedFollows.filter((item) => item.followingId === userId).length,
      );
      setFollowingCount(
        normalizedFollows.filter((item) => item.followerId === userId).length,
      );

    } catch (error) {
      if (__DEV__) {
        console.log("[MyPage] failed to load profile:", error);
      }
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [client]);

  React.useEffect(() => {
    setIsLoadingPosts(true);
    void loadMyPageData();
  }, [loadMyPageData]);

  return (
    <ScreenContainer
      backgroundColor={theme.colors.white}
      scrollViewRef={scrollViewRef}
    >
      <View style={styles.headerWrap}>
        <View style={styles.headerIconPlaceholder} />
        <Text style={styles.pageTitle}>@{usernameId}</Text>
        <Pressable
          style={styles.headerIconButton}
          onPress={() => router.push("/settings")}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}

        <View style={styles.identityWrap}>
          <Text style={styles.name}>{name}</Text>
        </View>

        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>

        <View style={styles.statWrap}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>投稿</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>フォロー</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>フォロワー</Text>
          </View>
        </View>
        <CustomButton
          label="プロフィールを編集"
          onPress={() => router.push("/profile-edit")}
          style={styles.editProfileButton}
        />
      </View>

      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>成長ギャラリー</Text>
        <Text style={styles.gallerySub}>日々の積み上げを記録</Text>
      </View>

      {!isLoadingPosts && posts.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <Ionicons
            name="images-outline"
            size={24}
            color={theme.colors.textSub}
          />
          <Text style={styles.emptyStateText}>
            まだ記録がありません。最初の積み上げを投稿しましょう！
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={GRID_COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/post/[postId]",
                  params: { postId: item.id },
                })
              }
              style={[
                styles.galleryItemTouch,
                (index + 1) % GRID_COLUMNS !== 0 && styles.galleryItemRightGap,
              ]}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          columnWrapperStyle={styles.galleryRow}
          contentContainerStyle={styles.galleryContent}
          scrollEnabled={false}
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    headerWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    headerIconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    headerIconPlaceholder: {
      width: 36,
      height: 36,
    },
    pageTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    profileSection: {
      alignItems: "center",
      paddingHorizontal: theme.spacing.sm,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.sm,
    },
    identityWrap: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },
    name: {
      fontSize: 26,
      fontWeight: "900",
      color: theme.colors.text,
    },
    age: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
    },
    caption: {
      color: theme.colors.textSub,
      marginTop: 6,
      textAlign: "center",
      paddingHorizontal: theme.spacing.md,
    },
    editProfileButton: {
      marginTop: theme.spacing.md,
      width: "100%",
    },
    statWrap: {
      flexDirection: "row",
      width: "100%",
      marginTop: theme.spacing.md,
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      color: theme.colors.primary,
      fontSize: 22,
      fontWeight: "900",
    },
    statLabel: {
      color: theme.colors.textSub,
      fontWeight: "700",
      marginTop: 2,
      fontSize: 12,
    },
    galleryHeader: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    galleryTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    gallerySub: {
      color: theme.colors.textSub,
      marginTop: 2,
      fontSize: 12,
      fontWeight: "700",
    },
    galleryContent: {
      paddingBottom: theme.spacing.xl,
    },
    galleryRow: {
      justifyContent: "flex-start",
    },
    galleryItemTouch: {
      width: GRID_ITEM_SIZE,
      aspectRatio: 1,
      marginBottom: GRID_GAP,
    },
    galleryItemRightGap: {
      marginRight: GRID_GAP,
    },
    galleryImage: {
      width: "100%",
      height: "100%",
      aspectRatio: 1,
      borderRadius: GRID_RADIUS,
      backgroundColor: theme.colors.surface,
    },
    emptyStateWrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    },
    emptyStateText: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
    },
  });
