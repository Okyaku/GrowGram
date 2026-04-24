import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { generateClient } from "aws-amplify/api";
import { uploadData } from "aws-amplify/storage";
import * as ImagePicker from "expo-image-picker";
import {
  CustomButton,
  InputField,
  ScreenContainer,
} from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { useRoadmap } from "../src/store/roadmap-context";
import { theme } from "../src/theme";
import { BackButton } from "../src/components/common/BackButton";

const createPostMutation = /* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      imageKey
    }
  }
`;

export default function PostCreateScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const params = useLocalSearchParams<{ milestoneId?: string }>();
  const { canCreatePost, postCredits, unlockedMilestones, consumePostCredit } =
    useRoadmap();
  const [selectedMilestoneId, setSelectedMilestoneId] =
    React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tagsText, setTagsText] = React.useState("");
  const [selectedImageUris, setSelectedImageUris] = React.useState<string[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const pickImage = React.useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "権限が必要です",
        "画像を選択するにはフォトライブラリへのアクセスを許可してください。",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSelectedImageUris(
      Array.from(
        new Set(result.assets.map((asset) => asset.uri).filter(Boolean)),
      ),
    );
  }, []);

  const uploadPostImage = React.useCallback(async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = uri.split(".").pop()?.toLowerCase();
    const safeExtension =
      extension && extension.length <= 5 ? extension : "jpg";
    const key = `public/posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension}`;

    await uploadData({
      path: key,
      data: blob,
      options: {
        contentType: blob.type || `image/${safeExtension}`,
      },
    }).result;

    return key;
  }, []);

  const uploadPostImages = React.useCallback(
    async (uris: string[]) => {
      const uploaded = await Promise.all(
        uris.map((uri) => uploadPostImage(uri)),
      );
      return uploaded.filter((item): item is string => Boolean(item));
    },
    [uploadPostImage],
  );

  React.useEffect(() => {
    if (unlockedMilestones.length === 0) {
      if (selectedMilestoneId) {
        setSelectedMilestoneId("");
      }
      return;
    }

    const milestoneIdParam =
      typeof params.milestoneId === "string" ? params.milestoneId : "";
    const hasParam = milestoneIdParam.length > 0;
    const paramMilestone = hasParam
      ? unlockedMilestones.find(
          (milestone) => milestone.id === milestoneIdParam,
        )
      : undefined;

    if (paramMilestone && selectedMilestoneId !== paramMilestone.id) {
      setSelectedMilestoneId(paramMilestone.id);
      return;
    }

    const selectedStillAvailable = unlockedMilestones.some(
      (milestone) => milestone.id === selectedMilestoneId,
    );
    if (!selectedStillAvailable) {
      setSelectedMilestoneId(unlockedMilestones[0].id);
    }
  }, [params.milestoneId, selectedMilestoneId, unlockedMilestones]);

  const onPost = async () => {
    if (!canCreatePost) {
      Alert.alert(
        "投稿できません",
        "ロードマップのマイルストーンを達成すると投稿が解放されます。",
      );
      return;
    }

    if (!content.trim()) {
      Alert.alert("入力不足", "本文を入力してください。");
      return;
    }

    if (!selectedMilestoneId) {
      Alert.alert(
        "選択してください",
        "投稿するマイルストーンを選んでください。",
      );
      return;
    }

    const tags = tagsText
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      setIsSubmitting(true);
      let imageKey: string | undefined;
      let imageKeys: string[] | undefined;

      if (selectedImageUris.length > 0) {
        try {
          imageKeys = await uploadPostImages(selectedImageUris);
          imageKey = imageKeys[0];
        } catch (error) {
          console.error(
            "[PostCreate] failed to upload image, fallback to text-only:",
            error,
          );
          Alert.alert("画像アップロード失敗", "画像なしで投稿を続行します。");
          imageKey = undefined;
          imageKeys = undefined;
        }
      }

      await client.graphql({
        query: createPostMutation,
        variables: {
          input: {
            content: content.trim(),
            title: title.trim() || undefined,
            tags,
            imageKey,
            imageKeys,
          },
        },
      });

      const consumed = consumePostCredit(selectedMilestoneId);
      if (!consumed) {
        Alert.alert(
          "投稿注意",
          "投稿は保存されましたが、投稿可能回数の更新に失敗しました。",
        );
      }
    } catch (error) {
      console.error("[PostCreate] failed to create post:", error);
      const reason =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
      Alert.alert(
        "投稿失敗",
        reason
          ? `投稿の保存に失敗しました。\n${reason}`
          : "投稿の保存に失敗しました。時間をおいて再試行してください。",
      );
      return;
    } finally {
      setIsSubmitting(false);
    }

    Alert.alert("投稿完了", "通常投稿を公開しました。");
    router.back();
  };

  if (!canCreatePost) {
    return (
      <ScreenContainer>
        <BackButton />
        <Text style={styles.title}>通常投稿</Text>
        <View style={styles.lockCard}>
          <Text style={styles.lockText}>現在は投稿がロック中です。</Text>
          <Text style={styles.lockSub}>
            ロードマップのマイルストーンをクリアすると投稿できます。
          </Text>
        </View>
        <CustomButton
          label="ロードマップを開く"
          onPress={() => router.replace("/(tabs)/create")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackButton />
      <Text style={styles.title}>通常投稿</Text>
      <Text style={styles.credit}>残り投稿可能回数: {postCredits}</Text>

      <Text style={styles.sectionLabel}>投稿可能なマイルストーン</Text>
      {unlockedMilestones.map((milestone) => {
        const selected = milestone.id === selectedMilestoneId;
        return (
          <View
            key={milestone.id}
            style={[styles.milestoneCard, selected && styles.milestoneSelected]}
          >
            <Text style={styles.milestoneRoadmap}>{milestone.roadmapGoal}</Text>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneSub}>{milestone.subtitle}</Text>
            <CustomButton
              label={selected ? "選択中" : "このマイルストーンで投稿"}
              variant={selected ? "primary" : "outline"}
              onPress={() => setSelectedMilestoneId(milestone.id)}
              style={styles.selectButton}
            />
          </View>
        );
      })}

      <InputField
        label="タイトル"
        placeholder="例: DAY 46 / 100 CODE"
        value={title}
        onChangeText={setTitle}
      />
      <InputField
        label="本文"
        placeholder="取り組み内容を記録..."
        multiline
        style={styles.multiline}
        value={content}
        onChangeText={setContent}
      />
      <InputField
        label="タグ"
        placeholder="例: #engine #render"
        value={tagsText}
        onChangeText={setTagsText}
      />

      <View style={styles.imageSection}>
        <Text style={styles.sectionLabel}>投稿画像</Text>
        <CustomButton
          label={
            selectedImageUris.length > 0
              ? `${selectedImageUris.length}枚を選択中`
              : "画像を選択"
          }
          variant="outline"
          onPress={() => void pickImage()}
        />
        {selectedImageUris.length > 0 ? (
          <View style={styles.previewWrap}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewCount}>
                {selectedImageUris.length}枚選択中
              </Text>
              <Pressable onPress={() => setSelectedImageUris([])} hitSlop={12}>
                <Text style={styles.removeImageText}>すべて外す</Text>
              </Pressable>
            </View>
            <Image
              source={{ uri: selectedImageUris[0] }}
              style={styles.previewImage}
            />
            {selectedImageUris.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {selectedImageUris.slice(1).map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.thumbImage} />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
      </View>

      <CustomButton
        label="通常投稿を公開"
        onPress={() => void onPost()}
        loading={isSubmitting}
      />
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    title: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "900",
      marginBottom: theme.spacing.sm,
    },
    credit: {
      color: theme.colors.primary,
      fontWeight: "800",
      marginBottom: theme.spacing.md,
    },
    sectionLabel: {
      color: theme.colors.text,
      fontWeight: "800",
      marginBottom: 8,
    },
    milestoneCard: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    milestoneSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.white,
    },
    milestoneTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    milestoneRoadmap: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
    },
    milestoneSub: {
      color: theme.colors.textSub,
      marginTop: 2,
      marginBottom: theme.spacing.sm,
    },
    selectButton: {
      minHeight: 42,
    },
    multiline: {
      minHeight: 130,
      textAlignVertical: "top",
      paddingTop: theme.spacing.sm,
    },
    imageSection: {
      marginBottom: theme.spacing.md,
    },
    previewWrap: {
      marginTop: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      padding: theme.spacing.sm,
      alignItems: "center",
    },
    previewHeaderRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    previewCount: {
      color: theme.colors.text,
      fontWeight: "800",
    },
    previewImage: {
      width: "100%",
      height: 180,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.xs,
    },
    thumbRow: {
      gap: 8,
      paddingTop: 4,
    },
    thumbImage: {
      width: 68,
      height: 68,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surface,
    },
    removeImageText: {
      color: theme.colors.danger,
      fontWeight: "700",
    },
    lockCard: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    lockText: {
      color: theme.colors.text,
      fontWeight: "900",
      marginBottom: 4,
    },
    lockSub: {
      color: theme.colors.textSub,
      lineHeight: 22,
    },
  });
