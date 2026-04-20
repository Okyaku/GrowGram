import React from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { generateClient } from "aws-amplify/api";
import { uploadData } from "aws-amplify/storage";
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    if (!imageUri) {
      Alert.alert(
        "画像を選択してください",
        "ストーリー投稿には画像が必要です。",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const imageKey = await uploadStoryImage(imageUri);

      const response = await client.graphql({
        query: createStoryMutation,
        variables: {
          input: {
            imageKey,
            caption: caption.trim() || undefined,
          },
        },
      });

      const storyId = (response as { data?: { createStory?: { id?: string } } })
        .data?.createStory?.id;
      recordDailyActivity("story");

      if (storyId) {
        router.replace(`/story/${storyId}`);
        return;
      }

      router.back();
    } catch (error) {
      console.error("[StoryCreate] failed to create story:", error);
      Alert.alert(
        "投稿失敗",
        "ストーリーの投稿に失敗しました。時間をおいて再試行してください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>ストーリー投稿</Text>
        <View style={styles.iconDummy} />
      </View>

      <Pressable style={styles.upload} onPress={onPickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.uploaded} />
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
        loading={isSubmitting}
      />
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
    multiline: {
      minHeight: 120,
      textAlignVertical: "top",
      paddingTop: theme.spacing.sm,
    },
  });
