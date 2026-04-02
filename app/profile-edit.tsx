import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl, uploadData } from "aws-amplify/storage";
import {
  CustomButton,
  InputField,
  ScreenContainer,
} from "../src/components/common";
import { theme } from "../src/theme";

type ProfileItem = {
  id: string;
  username: string;
  bio?: string | null;
  iconImageKey?: string | null;
};

const parseProfileBio = (bio: string) => {
  const parts = bio.split(" / ").map((part) => part.trim());
  let challenge = "";
  let longTermGoal = "";

  parts.forEach((part) => {
    if (part.startsWith("挑戦:")) {
      challenge = part.replace("挑戦:", "").trim();
    }
    if (part.startsWith("長期目標:")) {
      longTermGoal = part.replace("長期目標:", "").trim();
    }
  });

  return { challenge, longTermGoal };
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

const createProfileMutation = /* GraphQL */ `
  mutation CreateProfile($input: CreateProfileInput!) {
    createProfile(input: $input) {
      id
      username
      bio
      iconImageKey
    }
  }
`;

const updateProfileMutation = /* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      username
      bio
      iconImageKey
    }
  }
`;

export default function ProfileEditScreen() {
  const router = useRouter();
  const client = React.useMemo(() => generateClient(), []);
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("");
  const [challenge, setChallenge] = React.useState("");
  const [longTermGoal, setLongTermGoal] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [initialImageKey, setInitialImageKey] = React.useState<string | null>(
    null,
  );
  const [initialAvatarUrl, setInitialAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const uploadAvatar = React.useCallback(async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split(".").pop()?.toLowerCase();
    const safeExt = ext && ext.length <= 5 ? ext : "jpg";
    const key = `public/profiles/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    await uploadData({
      path: key,
      data: blob,
      options: {
        contentType: blob.type || `image/${safeExt}`,
      },
    }).result;

    return key;
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const authUser = await getCurrentUser();
        const userId = authUser.userId;
        if (!userId) {
          return;
        }

        if (isMounted) {
          setCurrentUserId(userId);
        }

        const response = await client.graphql({
          query: getProfileQuery,
          variables: { id: userId },
        });
        const profile =
          (response as { data?: { getProfile?: ProfileItem | null } }).data
            ?.getProfile ?? null;

        if (!profile || !isMounted) {
          return;
        }

        setProfileId(profile.id);
        setUsername(profile.username ?? "");
        const bio = profile.bio ?? "";
        const parsed = parseProfileBio(bio);
        setChallenge(parsed.challenge);
        setLongTermGoal(parsed.longTermGoal);
        setInitialImageKey(profile.iconImageKey ?? null);

        if (profile.iconImageKey) {
          try {
            const resolved = await getUrl({ path: profile.iconImageKey });
            if (isMounted) {
              setInitialAvatarUrl(resolved.url.toString());
            }
          } catch {
            if (isMounted) {
              setInitialAvatarUrl(null);
            }
          }
        } else if (isMounted) {
          setInitialAvatarUrl(null);
        }
      } catch (error) {
        if (__DEV__) {
          console.log("[ProfileEdit] failed to fetch profile:", error);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [client]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "権限が必要です",
        "プロフィール画像を選択するには権限が必要です。",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const onSave = React.useCallback(async () => {
    if (!username.trim()) {
      Alert.alert("入力不足", "氏名またはニックネームを入力してください。");
      return;
    }

    if (!currentUserId) {
      Alert.alert(
        "認証エラー",
        "ユーザー情報を取得できません。再ログイン後にお試しください。",
      );
      return;
    }

    const bioParts = [
      challenge.trim() ? `挑戦: ${challenge.trim()}` : "",
      longTermGoal.trim() ? `長期目標: ${longTermGoal.trim()}` : "",
    ].filter(Boolean);
    const composedBio = bioParts.join(" / ") || undefined;

    try {
      setIsSubmitting(true);

      let iconImageKey = initialImageKey ?? undefined;
      if (avatar) {
        iconImageKey = await uploadAvatar(avatar);
      }

      if (profileId) {
        await client.graphql({
          query: updateProfileMutation,
          variables: {
            input: {
              id: profileId,
              username: username.trim(),
              bio: composedBio,
              iconImageKey,
            },
          },
        });
      } else {
        const response = await client.graphql({
          query: createProfileMutation,
          variables: {
            input: {
              id: currentUserId,
              username: username.trim(),
              bio: composedBio,
              iconImageKey,
            },
          },
        });

        const createdId = (
          response as { data?: { createProfile?: { id?: string } } }
        ).data?.createProfile?.id;
        if (createdId) {
          setProfileId(createdId);
        }
      }

      if (iconImageKey) {
        setInitialImageKey(iconImageKey);
        try {
          const resolved = await getUrl({ path: iconImageKey });
          setInitialAvatarUrl(resolved.url.toString());
        } catch {
          setInitialAvatarUrl(null);
        }
      }

      Alert.alert("保存しました", "プロフィール情報を更新しました。");
    } catch (error) {
      console.error("[ProfileEdit] failed to save profile:", error);
      Alert.alert(
        "保存失敗",
        "プロフィールの保存に失敗しました。時間をおいて再試行してください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    avatar,
    challenge,
    currentUserId,
    initialImageKey,
    longTermGoal,
    profileId,
    uploadAvatar,
    username,
  ]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>プロフィール設定</Text>
        <View style={styles.backBtnDummy} />
      </View>

      <View style={styles.avatarWrap}>
        <Pressable style={styles.avatarButton} onPress={pickAvatar}>
          {avatar || initialAvatarUrl ? (
            <Image
              source={{ uri: avatar ?? initialAvatarUrl ?? undefined }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </Pressable>
        <Pressable style={styles.editBadge}>
          <Ionicons name="create" size={14} color={theme.colors.onPrimary} />
        </Pressable>
        <Text style={styles.helper}>写真をアップロード</Text>
        <Text style={styles.helperSub}>自分を表現する写真を選びましょう</Text>
      </View>

      <InputField
        label="氏名またはニックネーム"
        placeholder="例: 田中 太郎"
        value={username}
        onChangeText={setUsername}
      />
      <InputField
        label="長期的な目標"
        placeholder="例: 1年後にフルマラソン完走、資格取得"
        value={longTermGoal}
        onChangeText={setLongTermGoal}
      />

      <CustomButton
        label="プロフィールを保存して次へ"
        onPress={() => {
          void onSave();
          router.back();
        }}
        loading={isSubmitting}
      />

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>GrowGram Tip:</Text>
        <Text style={styles.tipText}>
          設定した目標はいつでも変更可能です。一歩ずつ、あなたの「積み上げ」を可視化していきましょう。
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  backBtnDummy: {
    width: 36,
    height: 36,
  },
  title: {
    ...theme.text.title,
    marginBottom: 0,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
    position: "relative",
  },
  avatarButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.soft,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    flex: 1,
  },
  editBadge: {
    position: "absolute",
    right: 108,
    top: 102,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  helper: {
    marginTop: 10,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 34,
  },
  helperSub: {
    color: theme.colors.textSub,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  progressRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  progressOff: {
    width: 90,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressOn: {
    width: 90,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  tipCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  tipTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    marginBottom: 4,
  },
  tipText: {
    color: theme.colors.text,
    lineHeight: 22,
  },
});
