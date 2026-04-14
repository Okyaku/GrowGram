import React from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { BackButton } from "../../src/components/common/BackButton";
import { CustomButton, ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";

type CloudProfile = {
  id: string;
  username?: string | null;
  bio?: string | null;
  iconImageKey?: string | null;
};

type CloudPost = {
  id: string;
  content: string;
  owner?: string | null;
  title?: string | null;
  imageKey?: string | null;
  isArchived?: boolean | null;
};

type CloudFollow = {
  id: string;
  followerId: string;
  followingId: string;
};

type RenderPost = {
  id: string;
  title: string;
  content: string;
  image: string;
};

const sanitizeProfileBio = (bio: string) =>
  bio
    .split(" / ")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part.length > 0 &&
        !part.startsWith("年齢:") &&
        !part.startsWith("年齢："),
    )
    .join(" / ");

const getProfileQuery = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
      id
      username
      bio
      iconImageKey
    }
  }
`;

const listPostsQuery = /* GraphQL */ `
  query ListPosts {
    listPosts(limit: 200) {
      items {
        id
        content
        owner
        title
        imageKey
        isArchived
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

const createFollowMutation = /* GraphQL */ `
  mutation CreateFollow($input: CreateFollowInput!) {
    createFollow(input: $input) {
      id
      followerId
      followingId
    }
  }
`;

const deleteFollowMutation = /* GraphQL */ `
  mutation DeleteFollow($input: DeleteFollowInput!) {
    deleteFollow(input: $input) {
      id
    }
  }
`;

export default function ProfileDetailScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<CloudProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [posts, setPosts] = React.useState<RenderPost[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [followersCount, setFollowersCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);
  const [myFollowRecordId, setMyFollowRecordId] = React.useState<string | null>(
    null,
  );
  const [isFollowSubmitting, setIsFollowSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        setIsLoading(true);

        let me = "";
        try {
          const auth = await getCurrentUser();
          me = auth.userId;
          setCurrentUserId(me);
        } catch {
          me = "";
          setCurrentUserId("");
        }

        const [profileResponse, postsResponse, followsResponse] =
          await Promise.all([
            client.graphql({
              query: getProfileQuery,
              variables: { id: userId },
            }),
            client.graphql({ query: listPostsQuery }),
            client.graphql({ query: listFollowsQuery }),
          ]);

        const loadedProfile =
          (profileResponse as { data?: { getProfile?: CloudProfile | null } })
            .data?.getProfile ?? null;
        setProfile(loadedProfile);

        if (loadedProfile?.iconImageKey) {
          try {
            const resolved = await getUrl({ path: loadedProfile.iconImageKey });
            setAvatarUrl(resolved.url.toString());
          } catch {
            setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }

        const postItems =
          (
            postsResponse as {
              data?: { listPosts?: { items?: Array<CloudPost | null> } };
            }
          ).data?.listPosts?.items ?? [];

        const ownPosts = postItems
          .filter((item): item is CloudPost =>
            Boolean(item?.id && item.content),
          )
          .filter((item) => item.owner === userId)
          .filter((item) => item.isArchived !== true);

        const renderPosts = await Promise.all(
          ownPosts.map(async (item) => {
            let image =
              "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1000";
            if (item.imageKey) {
              try {
                const resolved = await getUrl({ path: item.imageKey });
                image = resolved.url.toString();
              } catch {
                image =
                  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1000";
              }
            }
            return {
              id: item.id,
              title: item.title ?? "POST",
              content: item.content,
              image,
            } satisfies RenderPost;
          }),
        );
        setPosts(renderPosts);

        const followItems =
          (
            followsResponse as {
              data?: { listFollows?: { items?: Array<CloudFollow | null> } };
            }
          ).data?.listFollows?.items ?? [];
        const normalizedFollows = followItems.filter(
          (item): item is CloudFollow =>
            Boolean(item?.id && item.followerId && item.followingId),
        );

        setFollowersCount(
          normalizedFollows.filter((item) => item.followingId === userId)
            .length,
        );
        setFollowingCount(
          normalizedFollows.filter((item) => item.followerId === userId).length,
        );

        if (me) {
          const mine = normalizedFollows.find(
            (item) => item.followerId === me && item.followingId === userId,
          );
          setMyFollowRecordId(mine?.id ?? null);
        } else {
          setMyFollowRecordId(null);
        }
      } catch (error) {
        console.error("[ProfileDetail] failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [client, userId]);

  const postCount = posts.length;
  const displayName = profile?.username || `ユーザー ${userId}`;
  const displayBio = profile?.bio
    ? sanitizeProfileBio(profile.bio)
    : "毎日コツコツ積み上げるのが目標です。開発と学習を継続中。";
  const isOwnProfile = Boolean(
    currentUserId && userId && currentUserId === userId,
  );

  const onToggleFollow = React.useCallback(async () => {
    if (!userId || !currentUserId || isOwnProfile || isFollowSubmitting) {
      return;
    }

    try {
      setIsFollowSubmitting(true);
      if (myFollowRecordId) {
        await client.graphql({
          query: deleteFollowMutation,
          variables: { input: { id: myFollowRecordId } },
        });
        setMyFollowRecordId(null);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        const response = await client.graphql({
          query: createFollowMutation,
          variables: {
            input: { followerId: currentUserId, followingId: userId },
          },
        });
        const createdId =
          (response as { data?: { createFollow?: { id?: string } } }).data
            ?.createFollow?.id ?? null;
        if (createdId) {
          setMyFollowRecordId(createdId);
          setFollowersCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("[ProfileDetail] failed to toggle follow:", error);
    } finally {
      setIsFollowSubmitting(false);
    }
  }, [
    client,
    currentUserId,
    isFollowSubmitting,
    isOwnProfile,
    myFollowRecordId,
    userId,
  ]);

  if (isLoading) {
    return (
      <ScreenContainer backgroundColor={theme.colors.surface}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <BackButton>
        <Text style={styles.pageTitle}>プロフィール</Text>
      </BackButton>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.bio}>{displayBio}</Text>

        {!isOwnProfile ? (
          <View style={styles.actionRow}>
            <CustomButton
              label={myFollowRecordId ? "フォロー解除" : "フォロー"}
              onPress={() => void onToggleFollow()}
              loading={isFollowSubmitting}
              style={styles.actionButton}
            />
            <CustomButton
              label="チャット"
              variant="outline"
              onPress={() => router.push(`/chat/${userId}`)}
              style={styles.actionButton}
            />
          </View>
        ) : null}

        <View style={styles.followRow}>
          <View style={styles.followItem}>
            <Text style={styles.followValue}>{followingCount}</Text>
            <Text style={styles.followLabel}>フォロー中</Text>
          </View>
          <View style={styles.followItem}>
            <Text style={styles.followValue}>{followersCount}</Text>
            <Text style={styles.followLabel}>フォロワー</Text>
          </View>
          <View style={styles.followItem}>
            <Text style={styles.followValue}>{postCount}</Text>
            <Text style={styles.followLabel}>投稿数</Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>過去の投稿（{postCount}件）</Text>
      {posts.length > 0 ? (
        posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Image source={{ uri: post.image }} style={styles.image} />
            <Text style={styles.postText}>{post.title}</Text>
            <Text style={styles.postSubText}>{post.content}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>まだ投稿がありません。</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    pageTitle: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: "900",
      marginBottom: theme.spacing.sm,
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
    headerCard: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      padding: theme.spacing.lg,
      ...theme.shadows.soft,
    },
    avatarWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: theme.colors.surface,
    },
    name: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    bio: {
      color: theme.colors.textSub,
      marginTop: 4,
      textAlign: "center",
      lineHeight: 20,
    },
    actionRow: {
      marginTop: theme.spacing.sm,
      width: "100%",
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    followRow: {
      flexDirection: "row",
      marginTop: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    followItem: {
      alignItems: "center",
    },
    followValue: {
      color: theme.colors.primary,
      fontWeight: "900",
      fontSize: 18,
    },
    followLabel: {
      color: theme.colors.textSub,
      fontWeight: "700",
      fontSize: 12,
      marginTop: 2,
    },
    section: {
      ...theme.text.section,
      marginVertical: theme.spacing.md,
    },
    postCard: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.soft,
    },
    image: {
      height: 140,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    postText: {
      color: theme.colors.text,
      fontWeight: "600",
      marginTop: 8,
    },
    postSubText: {
      color: theme.colors.textSub,
      marginTop: 4,
      lineHeight: 20,
    },
    emptyCard: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      alignItems: "center",
    },
    emptyText: {
      color: theme.colors.textSub,
      fontWeight: "700",
    },
  });
