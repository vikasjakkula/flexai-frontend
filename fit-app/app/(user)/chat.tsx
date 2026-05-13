import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { buildConversationId, getMessages, sendMessage, type Message } from '@/lib/api';
import { MessageCircle, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trainerId = profile?.assignedTrainerId ?? null;
  const hasTrainer = !!trainerId;
  const conversationId = user?.uid
    ? buildConversationId(user.uid, trainerId ?? 'no-trainer')
    : null;

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch {
      // Silently ignore fetch errors
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    loadMessages().finally(() => setLoading(false));

    intervalRef.current = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadMessages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid || !conversationId || sending) return;

    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(conversationId, {
        senderId: user.uid,
        senderName: profile?.name || user.email || 'User',
        text: trimmed,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      // Restore text if send fails
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;
    return (
      <View style={[styles.msgWrapper, isOwn ? styles.msgWrapperRight : styles.msgWrapperLeft]}>
        {!isOwn && (
          <Text style={styles.msgSender}>{item.senderName}</Text>
        )}
        <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isOwn ? styles.msgTextOwn : styles.msgTextOther]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.msgTime, isOwn ? styles.msgTimeRight : styles.msgTimeLeft]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (!hasTrainer) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeTop} />
        <View style={styles.header}>
          <MessageCircle color={T.primary} size={22} />
          <Text style={styles.headerTitle}>Chat with Trainer</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.noTrainerCard}>
            <MessageCircle color={T.textDim} size={48} />
            <Text style={styles.noTrainerTitle}>No trainer assigned yet</Text>
            <Text style={styles.noTrainerBody}>
              Once a trainer is assigned to you, you'll be able to chat with them here.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle color={T.primary} size={20} />
          <Text style={styles.headerTitle}>Chat with Trainer</Text>
        </View>
        <View style={styles.trainerBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.trainerBadgeText}>Trainer</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

        {/* Messages */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={T.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet. Say hi!</Text>
              </View>
            }
          />
        )}

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={T.textDim}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}>
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Send color="#fff" size={18} />
            )}
          </TouchableOpacity>
        </View>
        <SafeAreaView style={styles.safeBottom} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  safeTop: {
    backgroundColor: T.background,
  },
  safeBottom: {
    backgroundColor: T.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    backgroundColor: T.background,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  headerTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
  },
  trainerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
    backgroundColor: T.card,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.radius.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.success,
  },
  trainerBadgeText: {
    color: T.text,
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.medium,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.spacing.lg,
  },
  noTrainerCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.xl,
    alignItems: 'center',
    gap: T.spacing.md,
  },
  noTrainerTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    textAlign: 'center',
  },
  noTrainerBody: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageList: {
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    flexGrow: 1,
    gap: T.spacing.sm,
  },
  msgWrapper: {
    marginBottom: T.spacing.sm,
    maxWidth: '80%',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgSender: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    marginBottom: 2,
    marginLeft: T.spacing.xs,
  },
  msgBubble: {
    borderRadius: T.radius.lg,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
  },
  msgBubbleOwn: {
    backgroundColor: T.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: T.surface,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: T.fontSize.md,
    lineHeight: 20,
  },
  msgTextOwn: {
    color: '#fff',
  },
  msgTextOther: {
    color: T.text,
  },
  msgTime: {
    color: T.textDim,
    fontSize: T.fontSize.xs,
    marginTop: 2,
  },
  msgTimeLeft: {
    marginLeft: T.spacing.xs,
  },
  msgTimeRight: {
    marginRight: T.spacing.xs,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyChatText: {
    color: T.textMuted,
    fontSize: T.fontSize.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.xl,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    color: T.text,
    fontSize: T.fontSize.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
