import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";

type CloudPost = {
  id: string;
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
      title
      content
      imageKey
      imageKeys
      createdAt
    }
  }
`;

export default function PostDetailScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );

  const [isLoading, setIsLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [createdAt, setCreatedAt] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      if (!postId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await client.graphql({
          query: getPostQuery,
          variables: { id: postId },
        });

        const post =
          (response as { data?: { getPost?: CloudPost | null } }).data?.getPost ??
          null;

        if (!post || !isMounted) {
          return;
        }

        setTitle(post.title ?? "投稿");
        setContent(post.content ?? "");
        setCreatedAt(post.createdAt ?? "");

        const keys = (post.imageKeys ?? []).filter(
          (item): item is string => Boolean(item),
        );
        const firstImage = keys[0] ?? post.imageKey ?? null;
        if (!firstImage) {
          setImageUrl(null);
          return;
        }

        if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
          setImageUrl(firstImage);
          return;
        }

        const resolved = await getUrl({ path: firstImage });
        if (isMounted) {
          setImageUrl(resolved.url.toString());
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
  }, [client, postId]);

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
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
          <Text style={styles.title}>{title || "投稿"}</Text>
          {createdAt ? (
            <Text style={styles.date}>{new Date(createdAt).toLocaleString()}</Text>
          ) : null}
          <Text style={styles.content}>{content}</Text>
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
      marginBottom: theme.spacing.md,
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
      width: "100%",
      aspectRatio: 1,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 4,
    },
    date: {
      color: theme.colors.textSub,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: theme.spacing.sm,
    },
    content: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
  });
