import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { BackButton } from "../src/components/common/BackButton";
import { ScreenContainer } from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { toCloudFrontImageUrl } from "../src/services/aws/cdn";
import { theme } from "../src/theme";

type InitialTab = "following" | "followers";

type CloudFollow = {
  id: string;
  followerId: string;
  followingId: string;
};

type CloudProfile = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  iconImageKey?: string | null;
};

type FollowUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

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

const listProfilesQuery = /* GraphQL */ `
  query ListProfiles {
    listProfiles(limit: 2000) {
      items {
        id
        username
        displayName
        iconImageKey
      }
    }
  }
`;

const normalizeTabParam = (tab: string | string[] | undefined): InitialTab => {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === "followers" ? "followers" : "following";
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

export default function FollowListScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { initialTab } = useLocalSearchParams<{
    initialTab?: string | string[];
  }>();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );

  const [activeTab, setActiveTab] = React.useState<InitialTab>(
    normalizeTabParam(initialTab),
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [followingUsers, setFollowingUsers] = React.useState<FollowUser[]>([]);
  const [followerUsers, setFollowerUsers] = React.useState<FollowUser[]>([]);

  React.useEffect(() => {
    setActiveTab(normalizeTabParam(initialTab));
  }, [initialTab]);

  React.useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        setIsLoading(true);

        const authUser = await getCurrentUser();
        const myUserId = authUser.userId;
        if (!myUserId) {
          if (isMounted) {
            setFollowingUsers([]);
            setFollowerUsers([]);
          }
          return;
        }

        const [followsResponse, profilesResponse] = await Promise.all([
          client.graphql({ query: listFollowsQuery }),
          client.graphql({ query: listProfilesQuery }),
        ]);

        const follows =
          (
            followsResponse as {
              data?: { listFollows?: { items?: Array<CloudFollow | null> } };
            }
          ).data?.listFollows?.items ?? [];

        const profiles =
          (
            profilesResponse as {
              data?: { listProfiles?: { items?: Array<CloudProfile | null> } };
            }
          ).data?.listProfiles?.items ?? [];

        const normalizedFollows = follows.filter((item): item is CloudFollow =>
          Boolean(item?.id && item.followerId && item.followingId),
        );
        const normalizedProfiles = profiles.filter(
          (item): item is CloudProfile => Boolean(item?.id),
        );

        const profileMap = new Map<string, CloudProfile>(
          normalizedProfiles.map((profile) => [profile.id, profile]),
        );

        const followingIds = uniqueIds(
          normalizedFollows
            .filter((item) => item.followerId === myUserId)
            .map((item) => item.followingId),
        );

        const followerIds = uniqueIds(
          normalizedFollows
            .filter((item) => item.followingId === myUserId)
            .map((item) => item.followerId),
        );

        const buildRows = async (ids: string[]) => {
          const rows = await Promise.all(
            ids.map(async (id) => {
              const profile = profileMap.get(id);
              const username = profile?.username?.trim() || "user";
              const displayName =
                profile?.displayName?.trim() ||
                profile?.username?.trim() ||
                "ユーザー";

              let avatarUrl: string | null = null;
              if (profile?.iconImageKey) {
                try {
                  const resolved = await getUrl({ path: profile.iconImageKey });
                  avatarUrl = toCloudFrontImageUrl(
                    profile.iconImageKey,
                    resolved.url.toString(),
                  );
                } catch {
                  avatarUrl = null;
                }
              }

              return {
                id,
                username,
                displayName,
                avatarUrl,
              } satisfies FollowUser;
            }),
          );

          return rows;
        };

        const [nextFollowingUsers, nextFollowerUsers] = await Promise.all([
          buildRows(followingIds),
          buildRows(followerIds),
        ]);

        if (isMounted) {
          setFollowingUsers(nextFollowingUsers);
          setFollowerUsers(nextFollowerUsers);
        }
      } catch (error) {
        console.error("[FollowList] failed to load users:", error);
        if (isMounted) {
          setFollowingUsers([]);
          setFollowerUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [client]);

  const activeUsers =
    activeTab === "following" ? followingUsers : followerUsers;

  return (
    <ScreenContainer backgroundColor={theme.colors.white} scrollable={false}>
      <BackButton>
        <Text style={styles.pageTitle}>フォロー一覧</Text>
      </BackButton>

      <View style={styles.tabWrap}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === "following" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("following")}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "following" && styles.tabLabelActive,
            ]}
          >
            フォロー
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === "followers" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("followers")}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "followers" && styles.tabLabelActive,
            ]}
          >
            フォロワー
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>ユーザー一覧を読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={activeUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            activeUsers.length === 0 && styles.listContentEmpty,
          ]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/profile/[userId]",
                  params: { userId: item.id },
                })
              }
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {item.displayName.slice(0, 1)}
                  </Text>
                </View>
              )}

              <View style={styles.rowMain}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>

              <Text style={styles.detailLabel}>表示</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {activeTab === "following"
                  ? "まだフォローしているユーザーがいません"
                  : "まだフォロワーがいません"}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    pageTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    tabWrap: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: theme.spacing.md,
    },
    tabButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    tabButtonActive: {
      backgroundColor: theme.colors.white,
    },
    tabLabel: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
    },
    tabLabelActive: {
      color: theme.colors.primary,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loadingText: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
    },
    listContentEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
    },
    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarFallbackText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    rowMain: {
      flex: 1,
      marginLeft: 12,
    },
    displayName: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    username: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    detailLabel: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
    },
    emptyText: {
      color: theme.colors.textSub,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
  });
