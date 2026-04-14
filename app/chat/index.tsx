import React from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { ScreenContainer } from "../../src/components/common";
import { Text } from "../../src/components/common/Typography";
import { theme } from "../../src/theme";

type CloudMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  storyId?: string | null;
  storyCaption?: string | null;
  createdAt?: string | null;
};

type CloudReceipt = {
  id: string;
  messageId: string;
  readerId: string;
};

type CloudProfile = {
  id: string;
  owner?: string | null;
  username?: string | null;
  iconImageKey?: string | null;
};

type ConversationItem = {
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

const listMessagesQuery = /* GraphQL */ `
  query ListDirectMessages {
    listDirectMessages(limit: 2000) {
      items {
        id
        fromUserId
        toUserId
        body
        storyId
        storyCaption
        createdAt
      }
    }
  }
`;

const listProfilesQuery = /* GraphQL */ `
  query ListProfiles {
    listProfiles(limit: 2000) {
      items {
        id
        owner
        username
        iconImageKey
      }
    }
  }
`;

const listReadReceiptsQuery = /* GraphQL */ `
  query ListReadReceipts {
    listReadReceipts(limit: 2000) {
      items {
        id
        messageId
        readerId
      }
    }
  }
`;

export default function ChatInboxScreen() {
  const styles = React.useMemo(() => createStyles(), []);
  const router = useRouter();
  const client = React.useMemo(
    () => generateClient({ authMode: "userPool" }),
    [],
  );
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [conversations, setConversations] = React.useState<ConversationItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const loadInbox = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      const me = user.userId;
      setCurrentUserId(me);

      const [messageResponse, profileResponse, receiptResponse] =
        await Promise.all([
          client.graphql({ query: listMessagesQuery }),
          client.graphql({ query: listProfilesQuery }),
          client.graphql({ query: listReadReceiptsQuery }),
        ]);

      const messageItems =
        (
          messageResponse as {
            data?: {
              listDirectMessages?: { items?: Array<CloudMessage | null> };
            };
          }
        ).data?.listDirectMessages?.items ?? [];
      const profileItems =
        (
          profileResponse as {
            data?: { listProfiles?: { items?: Array<CloudProfile | null> } };
          }
        ).data?.listProfiles?.items ?? [];
      const receiptItems =
        (
          receiptResponse as {
            data?: {
              listReadReceipts?: { items?: Array<CloudReceipt | null> };
            };
          }
        ).data?.listReadReceipts?.items ?? [];

      const profileByOwner = new Map<
        string,
        { id: string; username: string; avatarUrl?: string }
      >();
      const profiles = await Promise.all(
        profileItems
          .filter((item): item is CloudProfile => Boolean(item?.id))
          .map(async (item) => {
            let avatarUrl: string | undefined;
            if (item.iconImageKey) {
              try {
                const resolved = await getUrl({ path: item.iconImageKey });
                avatarUrl = resolved.url.toString();
              } catch {
                avatarUrl = undefined;
              }
            }
            return {
              owner: item.owner ?? item.id,
              id: item.id,
              username:
                item.username ??
                (item.owner ?? item.id).split("@")[0].toUpperCase(),
              avatarUrl,
            };
          }),
      );
      profiles.forEach((profile) => profileByOwner.set(profile.owner, profile));

      const readMessageIds = new Set(
        receiptItems
          .filter((item): item is CloudReceipt =>
            Boolean(item?.id && item.messageId && item.readerId),
          )
          .filter((item) => item.readerId === me)
          .map((item) => item.messageId),
      );

      const normalizedMessages = messageItems
        .filter((item): item is CloudMessage =>
          Boolean(item?.id && item.body && item.fromUserId && item.toUserId),
        )
        .filter((item) => item.fromUserId === me || item.toUserId === me);

      const conversationMap = new Map<string, ConversationItem>();
      normalizedMessages.forEach((message) => {
        const partnerId =
          message.fromUserId === me ? message.toUserId : message.fromUserId;
        const profile = profileByOwner.get(partnerId);
        const current = conversationMap.get(partnerId);
        const lastAt = message.createdAt ?? "1970-01-01T00:00:00.000Z";
        const shouldReplace =
          !current ||
          new Date(lastAt).getTime() > new Date(current.lastAt).getTime();
        const unreadCount =
          message.toUserId === me && !readMessageIds.has(message.id) ? 1 : 0;

        if (!current || shouldReplace) {
          conversationMap.set(partnerId, {
            partnerId,
            partnerName:
              profile?.username || partnerId.split("@")[0].toUpperCase(),
            partnerAvatarUrl: profile?.avatarUrl,
            lastMessage: message.storyId
              ? `ストーリー: ${message.storyCaption ?? "共有メッセージ"}`
              : message.body,
            lastAt,
            unreadCount: (current?.unreadCount ?? 0) + unreadCount,
          });
        } else {
          conversationMap.set(partnerId, {
            ...current,
            unreadCount: current.unreadCount + unreadCount,
          });
        }
      });

      const nextConversations = Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
      );
      setConversations(nextConversations);
    } catch (error) {
      console.error("[ChatInbox] failed to load inbox:", error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useFocusEffect(
    React.useCallback(() => {
      void loadInbox();
    }, [loadInbox]),
  );

  return (
    <ScreenContainer backgroundColor={theme.colors.surface} scrollable={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>メッセージ</Text>
          <Text style={styles.subtitle}>通知の横にあるDM一覧です。</Text>
        </View>
        <Pressable style={styles.homeButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partnerId}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const created = new Date(item.lastAt);
          const timeLabel = Number.isNaN(created.getTime())
            ? "今"
            : `${created.getMonth() + 1}/${created.getDate()}`;
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/chat/${item.partnerId}`)}
            >
              {item.partnerAvatarUrl ? (
                <Image
                  source={{ uri: item.partnerAvatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={theme.colors.textSub}
                  />
                </View>
              )}
              <View style={styles.body}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.partnerName}
                  </Text>
                  <Text style={styles.time}>{timeLabel}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              <View style={styles.trailing}>
                {item.unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount > 9 ? "9+" : item.unreadCount}
                    </Text>
                  </View>
                ) : null}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.textSub}
                />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={theme.colors.textSub}
              />
              <Text style={styles.emptyTitle}>まだメッセージがありません</Text>
              <Text style={styles.emptySub}>
                プロフィールやストーリーからDMを送ってみてください。
              </Text>
            </View>
          )
        }
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
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "900",
    },
    subtitle: {
      color: theme.colors.textSub,
      marginTop: 2,
      fontSize: 12,
      fontWeight: "700",
    },
    homeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.soft,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    body: {
      flex: 1,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    name: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    time: {
      color: theme.colors.textSub,
      fontSize: 11,
      fontWeight: "700",
    },
    preview: {
      marginTop: 4,
      color: theme.colors.textSub,
      lineHeight: 19,
      fontWeight: "600",
    },
    trailing: {
      alignItems: "center",
      gap: 8,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    unreadText: {
      color: theme.colors.white,
      fontSize: 10,
      fontWeight: "900",
    },
    emptyCard: {
      marginTop: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.white,
      padding: theme.spacing.lg,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontWeight: "900",
      fontSize: 16,
    },
    emptySub: {
      color: theme.colors.textSub,
      textAlign: "center",
      lineHeight: 20,
    },
  });
