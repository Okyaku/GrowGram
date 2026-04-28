import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image as NativeImage,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { generateClient } from "aws-amplify/api";
import { getUrl, uploadData } from "aws-amplify/storage";
import {
  CustomButton,
  InputField,
  ScreenContainer,
} from "../src/components/common";
import { Text } from "../src/components/common/Typography";
import { useRoadmap } from "../src/store/roadmap-context";
import { theme } from "../src/theme";

const createStoryMutation = /* GraphQL */ `
  mutation CreateStory($input: CreateStoryInput!) {
    createStory(input: $input) {
      id
      imageKey
      caption
    }
  }
`;

export default function StoryCreateScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const { recordDailyActivity } = useRoadmap();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  usePreventRemove(isUploading, () => {
    // Block leaving the screen while a story is being uploaded and finalized.
  });

  const onPickImage = async () => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let permission = current;

    if (!current.granted && current.canAskAgain) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          "写真アクセスがオフです",
          "iPhoneの設定から写真アクセスを許可してください。",
          [
            { text: "キャンセル", style: "cancel" },
            {
              text: "設定を開く",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        "権限が必要です",
        "写真を選択するためにメディア権限を許可してください。",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadStoryImage = React.useCallback(async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split(".").pop()?.toLowerCase();
    const safeExt = ext && ext.length <= 5 ? ext : "jpg";
    const key = `public/stories/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    await uploadData({
      path: key,
      data: blob,
      options: {
        contentType: blob.type || `image/${safeExt}`,
      },
    }).result;

    return key;
  }, []);

  const onSubmit = async () => {
    if (isUploading) {
      return;
    }

    if (!imageUri) {
      Alert.alert(
        "画像を選択してください",
        "ストーリー投稿には画像が必要です。",
      );
      return;
    }

    try {
      setIsUploading(true);

      // 1) Upload image to S3 and wait for completion.
      const imageKey = await uploadStoryImage(imageUri);

      // 2) Persist story record in GraphQL and wait for completion.
      const storyResponse = await client.graphql({
        query: createStoryMutation,
        variables: {
          input: {
            imageKey,
            caption: caption.trim() || undefined,
          },
        },
      });

      // 3) Resolve final public URL for the just-uploaded image.
      const resolved = await getUrl({ path: imageKey });
      const finalUrl = resolved.url.toString();

      // 4) Prefetch image so it is ready when user returns to home/story view.
      await Image.prefetch(finalUrl);

      recordDailyActivity("story");

      (globalThis as any).storyUploadIndicatorUntil = Date.now() + 2200;
      setIsUploading(false);
      router.back();
    } catch (error) {
      console.error("[StoryCreate] failed to create story:", error);
      setIsUploading(false);
      Alert.alert(
        "投稿失敗",
        "ストーリーの投稿に失敗しました。時間をおいて再試行してください。",
      );
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            if (!isUploading) {
              router.back();
            }
          }}
          disabled={isUploading}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>ストーリー投稿</Text>
        <View style={styles.iconDummy} />
      </View>

      <Pressable style={styles.upload} onPress={onPickImage} disabled={isUploading}>
        {imageUri ? (
          <NativeImage source={{ uri: imageUri }} style={styles.uploaded} />
        ) : (
          <Text style={styles.uploadText}>写真を選択</Text>
        )}
      </Pressable>

      <InputField
        label="ひとこと"
        placeholder="今の気持ちや学びを共有..."
        value={caption}
        onChangeText={setCaption}
        multiline
        style={styles.multiline}
      />
      <CustomButton
        label="ストーリーを投稿"
        onPress={() => void onSubmit()}
        loading={isUploading}
        disabled={isUploading}
      />

      {isUploading ? (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.uploadOverlayText}>投稿を処理中です...</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
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
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    iconDummy: {
      width: 40,
      height: 40,
    },
    title: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    upload: {
      height: 240,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.white,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.md,
      overflow: "hidden",
    },
    uploadText: {
      color: theme.colors.primary,
      fontWeight: "800",
    },
    uploaded: {
      width: "100%",
      height: "100%",
    },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
    },
    uploadOverlayText: {
      color: theme.colors.white,
      fontWeight: "800",
      fontSize: 14,
    },
    multiline: {
      minHeight: 120,
      textAlignVertical: "top",
      paddingTop: theme.spacing.sm,
    },
  });
