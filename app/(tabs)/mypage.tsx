import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { signOut } from "aws-amplify/auth";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { CustomButton } from "../../src/components/common";
import { ScreenContainer } from "../../src/components/common";
import { useRoadmap } from "../../src/store/roadmap-context";
import { theme } from "../../src/theme";

const menus = [
  {
    label: "プロフィール編集",
    route: "/profile-edit" as const,
    icon: "person-circle" as const,
  },
  { label: "設定", route: "/settings" as const, icon: "settings" as const },
];

type CloudProfile = {
  id: string;
  username?: string | null;
  bio?: string | null;
  iconImageKey?: string | null;
};

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

const listPostsCountQuery = /* GraphQL */ `
  query ListPostsCount {
    listPosts(limit: 1000) {
      items {
        id
      }
    }
  }
`;

export default function MyPageScreen() {
  const router = useRouter();

  const client = React.useMemo(() => generateClient(), []);
  const { logout } = useRoadmap();
  const [name, setName] = React.useState("ユーザー");
  const [caption, setCaption] =
    React.useState("プロフィールを設定してください");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [postCount, setPostCount] = React.useState(0);

  const loadMyPageData = React.useCallback(async () => {
    try {
      const authUser = await getCurrentUser();
      const userId = authUser.userId;
      if (!userId) {
        return;
      }

      const [profileResponse, postsResponse] = await Promise.all([
        client.graphql({ query: getProfileQuery, variables: { id: userId } }),
        client.graphql({ query: listPostsCountQuery }),
      ]);

      const profile =
        (profileResponse as { data?: { getProfile?: CloudProfile | null } })
          .data?.getProfile ?? null;

      if (profile) {
        setName(profile.username?.trim() || "ユーザー");
        setCaption(profile.bio?.trim() || "プロフィールを設定してください");

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

      const posts =
        (
          postsResponse as {
            data?: {
              listPosts?: { items?: Array<{ id?: string | null } | null> };
            };
          }
        ).data?.listPosts?.items ?? [];
      setPostCount(posts.filter((item) => Boolean(item?.id)).length);
    } catch (error) {
      if (__DEV__) {
        console.log("[MyPage] failed to load profile:", error);
      }
    }
  }, [client]);

  useFocusEffect(
    React.useCallback(() => {
      void loadMyPageData();
    }, [loadMyPageData]),
  );

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut();
    } catch {
      // Ignore auth provider errors and always clear local app state.
    } finally {
      logout();
      router.replace("/(auth)/login");
    }
  }, [logout, router]);

  const onLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: () => {
          void handleSignOut();
        },
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.surface}>
      <Text style={styles.pageTitle}>設定 / マイページ</Text>
      <View style={styles.profileCard}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.caption}>{caption}</Text>
        <View style={styles.statWrap}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>投稿</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>82</Text>
            <Text style={styles.statLabel}>反応</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>210</Text>
            <Text style={styles.statLabel}>積み上げ</Text>
          </View>
        </View>
        <CustomButton
          label="プロフィールを編集"
          onPress={() => router.push("/profile-edit")}
          style={styles.editProfileButton}
        />
      </View>

      {menus.map((menu) => (
        <Pressable
          key={menu.label}
          style={styles.menuItem}
          onPress={() => router.push(menu.route)}
        >
          <View style={styles.menuLeft}>
            <Ionicons name={menu.icon} size={18} color={theme.colors.primary} />
            <Text style={styles.menuText}>{menu.label}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textSub}
          />
        </Pressable>
      ))}

      <Pressable
        style={[styles.menuItem, styles.logoutItem]}
        onPress={onLogout}
      >
        <View style={styles.menuLeft}>
          <Ionicons name="log-out" size={18} color={theme.colors.danger} />
          <Text style={styles.logoutText}>ログアウト</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textSub}
        />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: theme.spacing.sm,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
  },
  caption: {
    color: theme.colors.textSub,
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: theme.spacing.md,
    width: "100%",
  },
  statWrap: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
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
  menuItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 58,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.shadows.soft,
  },
  menuLeft: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  menuText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  logoutItem: {
    borderColor: theme.colors.danger,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: "800",
  },
});
