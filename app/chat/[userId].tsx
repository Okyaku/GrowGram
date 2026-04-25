import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text, TextInput } from "../../src/components/common/Typography";
import { toCloudFrontImageUrl } from "../../src/services/aws/cdn";
import { theme } from "../../src/theme";

type CloudMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  storyId?: string | null;
  storyCaption?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

type CloudReceipt = {
  id: string;
  messageId: string;
  readerId: string;
  readAt?: string | null;
};

type CloudProfile = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  iconImageKey?: string | null;
};

const listMessagesQuery = /* GraphQL */ `
  query ListDirectMessages {
    listDirectMessages(limit: 1000) {
      items {
        id
        fromUserId
        toUserId
        body
        storyId
        storyCaption
        readAt
        createdAt
      }
    }
  }
`;

const createMessageMutation = /* GraphQL */ `
  mutation CreateDirectMessage($input: CreateDirectMessageInput!) {
    createDirectMessage(input: $input) {
      id
      fromUserId
      toUserId
      body
      storyId
      storyCaption
      readAt
      createdAt
    }
  }
`;

const listReadReceiptsQuery = /* GraphQL */ `
  query ListReadReceipts {
    listReadReceipts(limit: 1000) {
      items {
        id
        messageId
        readerId
        readAt
      }
    }
  }
`;

const createReadReceiptMutation = /* GraphQL */ `
  mutation CreateReadReceipt($input: CreateReadReceiptInput!) {
    createReadReceipt(input: $input) {
      id
      messageId
      readerId
      readAt
    }
  }
`;

const getProfileQuery = /* GraphQL */ `
  query GetProfile($id: ID!) {
    getProfile(id: $id) {
      id
      username
      displayName
      iconImageKey
    }
  }
`;

export default function ChatScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const { userId: partnerId } = useLocalSearchParams<{ userId: string }>();
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [partnerName, setPartnerName] = React.useState("USER");
  const [partnerAvatarUrl, setPartnerAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [messages, setMessages] = React.useState<CloudMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadChat = React.useCallback(async () => {
    if (!partnerId) {
      return;
    }

    try {
      const user = await getCurrentUser();
      const me = user.userId;
      setCurrentUserId(me);

      const [messageResponse, profileResponse, receiptResponse] =
        await Promise.all([
          client.graphql({ query: listMessagesQuery }),
          client.graphql({
            query: getProfileQuery,
            variables: { id: partnerId },
          }),
          client.graphql({ query: listReadReceiptsQuery }),
        ]);

      const items =
        (
          messageResponse as {
            data?: {
              listDirectMessages?: { items?: Array<CloudMessage | null> };
            };
          }
        ).data?.listDirectMessages?.items ?? [];

      const normalized = items
        .filter((item): item is CloudMessage =>
          Boolean(item?.id && item.body && item.fromUserId && item.toUserId),
        )
        .filter(
          (item) =>
            (item.fromUserId === me && item.toUserId === partnerId) ||
            (item.fromUserId === partnerId && item.toUserId === me),
        )
        .sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return at - bt;
        });

      const receiptItems =
        (
          receiptResponse as {
            data?: {
              listReadReceipts?: { items?: Array<CloudReceipt | null> };
            };
          }
        ).data?.listReadReceipts?.items ?? [];
      const normalizedReceipts = receiptItems.filter(
        (item): item is CloudReceipt =>
          Boolean(item?.id && item.messageId && item.readerId),
      );
      const readByMeMessageIds = new Set(
        normalizedReceipts
          .filter((item) => item.readerId === me)
          .map((item) => item.messageId),
      );
      const readByPartnerMessageIds = new Set(
        normalizedReceipts
          .filter((item) => item.readerId === partnerId)
          .map((item) => item.messageId),
      );

      const messageWithReadState = normalized.map((item) => ({
        ...item,
        readAt:
          item.fromUserId === me
            ? (item.readAt ??
              (readByPartnerMessageIds.has(item.id)
                ? new Date().toISOString()
                : null))
            : item.readAt,
      }));

      setMessages(messageWithReadState);

      const unreadIncoming = normalized.filter(
        (item) =>
          item.fromUserId === partnerId &&
          item.toUserId === me &&
          !readByMeMessageIds.has(item.id),
      );
      if (unreadIncoming.length > 0) {
        await Promise.all(
          unreadIncoming.map((message) =>
            client.graphql({
              query: createReadReceiptMutation,
              variables: {
                input: {
                  messageId: message.id,
                  readerId: me,
                  readAt: new Date().toISOString(),
                },
              },
            }),
          ),
        );
      }

      const profile =
        (profileResponse as { data?: { getProfile?: CloudProfile | null } })
          .data?.getProfile ?? null;
      setPartnerName(
        profile?.displayName ||
          profile?.username ||
          (partnerId.split("@")[0] || "USER").toUpperCase(),
      );
      if (profile?.iconImageKey) {
        try {
          const resolved = await getUrl({ path: profile.iconImageKey });
          setPartnerAvatarUrl(
            toCloudFrontImageUrl(
              profile.iconImageKey,
              resolved.url.toString(),
            ),
          );
        } catch {
          setPartnerAvatarUrl(null);
        }
      } else {
        setPartnerAvatarUrl(null);
      }
    } catch (error) {
      console.error("[Chat] failed to load messages:", error);
    }
  }, [client, partnerId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadChat();
    }, [loadChat]),
  );

  const onSend = React.useCallback(async () => {
    if (!partnerId || !currentUserId || !input.trim() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await client.graphql({
        query: createMessageMutation,
        variables: {
          input: {
            fromUserId: currentUserId,
            toUserId: partnerId,
            body: input.trim(),
          },
        },
      });
      setInput("");
      await loadChat();
    } catch (error) {
      console.error("[Chat] failed to send message:", error);
      Alert.alert("送信失敗", "メッセージ送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }, [client, currentUserId, input, isSubmitting, loadChat, partnerId]);

  return (
    <ScreenContainer backgroundColor={theme.colors.surface} scrollable={false}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Pressable
          style={styles.titleWrap}
          onPress={() => router.push(`/profile/${partnerId}`)}
        >
          {partnerAvatarUrl ? (
            <Image
              source={{ uri: partnerAvatarUrl }}
              style={styles.partnerAvatar}
            />
          ) : (
            <View style={styles.partnerAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={theme.colors.textSub} />
            </View>
          )}
          <View>
            <Text style={styles.title}>{partnerName}</Text>
            <Text style={styles.subtitle}>DM</Text>
          </View>
        </Pressable>
        <View style={styles.iconDummy} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.fromUserId === currentUserId;
          const readLabel = mine ? (item.readAt ? "既読" : "未読") : "";
          return (
            <View
              style={[
                styles.messageRow,
                mine ? styles.messageRowMine : styles.messageRowOther,
              ]}
            >
              {!mine ? (
                <View style={styles.incomingAvatarWrap}>
                  {partnerAvatarUrl ? (
                    <Image
                      source={{ uri: partnerAvatarUrl }}
                      style={styles.incomingAvatar}
                    />
                  ) : (
                    <View style={styles.incomingAvatarPlaceholder} />
                  )}
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleOther,
                ]}
              >
                {item.storyId ? (
                  <Pressable
                    style={styles.storyRefCard}
                    onPress={() => router.push(`/story/${item.storyId}`)}
                  >
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={
                        mine ? theme.colors.onPrimary : theme.colors.primary
                      }
                    />
                    <View style={styles.storyRefTextWrap}>
                      <Text
                        style={[
                          styles.storyRefTitle,
                          mine
                            ? styles.messageTextMine
                            : styles.storyRefTitleOther,
                        ]}
                      >
                        ストーリーを共有
                      </Text>
                      {item.storyCaption ? (
                        <Text
                          style={[
                            styles.storyRefCaption,
                            mine
                              ? styles.messageTextMine
                              : styles.messageTextOther,
                          ]}
                          numberOfLines={2}
                        >
                          {item.storyCaption}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ) : null}
                <Text
                  style={[
                    styles.messageText,
                    mine ? styles.messageTextMine : styles.messageTextOther,
                  ]}
                >
                  {item.body}
                </Text>
                {mine ? (
                  <Text style={styles.readLabel}>{readLabel}</Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="メッセージを入力"
          placeholderTextColor={theme.colors.textSub}
          style={styles.input}
        />
        <Pressable style={styles.sendButton} onPress={() => void onSend()}>
          <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const createStyles = () =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    titleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      justifyContent: "center",
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconDummy: {
      width: 40,
      height: 40,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "900",
    },
    subtitle: {
      color: theme.colors.textSub,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 2,
    },
    partnerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
    },
    partnerAvatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    list: {
      flex: 1,
    },
    messageRow: {
      width: "100%",
      flexDirection: "row",
    },
    messageRowMine: {
      justifyContent: "flex-end",
    },
    messageRowOther: {
      justifyContent: "flex-start",
    },
    incomingAvatarWrap: {
      marginRight: 8,
      alignSelf: "flex-end",
    },
    incomingAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    incomingAvatarPlaceholder: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    bubble: {
      maxWidth: "76%",
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    storyRefCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 8,
    },
    storyRefTextWrap: {
      flex: 1,
    },
    storyRefTitle: {
      fontWeight: "900",
      fontSize: 12,
      marginBottom: 2,
    },
    storyRefTitleOther: {
      color: theme.colors.text,
    },
    storyRefCaption: {
      fontWeight: "700",
      fontSize: 12,
      lineHeight: 17,
    },
    bubbleMine: {
      backgroundColor: theme.colors.primary,
    },
    bubbleOther: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageText: {
      fontWeight: "700",
      lineHeight: 19,
    },
    messageTextMine: {
      color: theme.colors.onPrimary,
    },
    messageTextOther: {
      color: theme.colors.text,
    },
    readLabel: {
      marginTop: 6,
      color: "rgba(255,255,255,0.85)",
      textAlign: "right",
      fontSize: 10,
      fontWeight: "700",
    },
    inputRow: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: 48,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.md,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
