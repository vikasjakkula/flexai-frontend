import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, Send, Users, ChevronRight } from 'lucide-react-native';
import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import {
  getAllUsers,
  getMessages,
  sendMessage,
  buildConversationId,
  type UserProfileData,
  type Message,
} from '@/lib/api';

export default function TrainerChat() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [clients, setClients] = useState<UserProfileData[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<UserProfileData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trainerId = user?.uid ?? profile?.uid ?? '';
  const trainerName = profile?.name || user?.displayName || 'Trainer';

  const loadClients = useCallback(async () => {
    try {
      const all = await getAllUsers();
      setClients(all.filter((u) => u.role === 'user'));
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  const loadMessages = useCallback(
    async (client: UserProfileData) => {
      if (!trainerId) return;
      try {
        const convId = buildConversationId(trainerId, client.uid);
        const msgs = await getMessages(convId);
        setMessages(msgs);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
      } catch {
        setMessages([]);
      }
    },
    [trainerId],
  );

  // Start polling when client is selected
  useEffect(() => {
    if (!selectedClient) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    setMessagesLoading(true);
    loadMessages(selectedClient).finally(() => setMessagesLoading(false));

    pollRef.current = setInterval(() => {
      loadMessages(selectedClient);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedClient, loadMessages]);

  const handleSelectClient = (client: UserProfileData) => {
    setSelectedClient(client);
    setMessages([]);
  };

  const handleBack = () => {
    setSelectedClient(null);
    setMessages([]);
    setInputText('');
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedClient || !trainerId) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const convId = buildConversationId(trainerId, selectedClient.uid);
      const msg = await sendMessage(convId, {
        senderId: trainerId,
        senderName: trainerName,
        text,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Silently fail — message wasn't sent
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ─── Panel A: Client List ──────────────────────────────────────────────────
  if (!selectedClient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Select a client to chat</Text>
        </View>

        {clientsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={T.primary} />
          </View>
        ) : clients.length === 0 ? (
          <View style={styles.centered}>
            <Users size={48} color={T.textDim} />
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptySubtitle}>Clients will appear here once they sign up.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.clientListContent}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.uid}
                style={styles.clientRow}
                onPress={() => handleSelectClient(client)}
                activeOpacity={0.75}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {(client.name || client.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientRowInfo}>
                  <Text style={styles.clientRowName}>{client.name || 'Unnamed'}</Text>
                  <Text style={styles.clientRowEmail} numberOfLines={1}>
                    {client.email}
                  </Text>
                </View>
                <ChevronRight size={18} color={T.textDim} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ─── Panel B: Chat ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={T.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderAvatar}>
          <Text style={styles.chatHeaderAvatarText}>
            {(selectedClient.name || selectedClient.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{selectedClient.name || 'Unnamed'}</Text>
          <Text style={styles.chatHeaderEmail} numberOfLines={1}>
            {selectedClient.email}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {messagesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={T.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.noMessages}>
              <Text style={styles.noMessagesText}>No messages yet. Say hello!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const isTrainer = msg.senderId === trainerId;
            return (
              <View
                key={msg.id}
                style={[styles.messageWrapper, isTrainer ? styles.messageWrapperRight : styles.messageWrapperLeft]}
              >
                <View style={[styles.messageBubble, isTrainer ? styles.bubbleTrainer : styles.bubbleUser]}>
                  <Text style={[styles.messageText, isTrainer ? styles.messageTextTrainer : styles.messageTextUser]}>
                    {msg.text}
                  </Text>
                </View>
                <View style={[styles.messageMeta, isTrainer ? styles.messageMetaRight : styles.messageMetaLeft]}>
                  <Text style={styles.metaSender}>{msg.senderName}</Text>
                  <Text style={styles.metaTime}>{formatTime(msg.timestamp)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={T.textDim}
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={3}
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: {
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
    color: T.text,
  },
  headerSubtitle: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.md,
    paddingHorizontal: T.spacing.xl,
  },
  emptyTitle: {
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    textAlign: 'center',
  },
  clientListContent: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.xxl,
    gap: T.spacing.xs,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    gap: T.spacing.md,
  },
  clientAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clientAvatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.bold,
  },
  clientRowInfo: {
    flex: 1,
  },
  clientRowName: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
  },
  clientRowEmail: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  // Chat header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: T.spacing.md,
    paddingBottom: T.spacing.md,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: T.spacing.sm,
  },
  backButton: {
    padding: T.spacing.xs,
    marginRight: T.spacing.xs,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chatHeaderAvatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
  },
  chatHeaderEmail: {
    fontSize: T.fontSize.xs,
    color: T.textMuted,
  },
  // Messages
  messageList: {
    flex: 1,
    backgroundColor: T.background,
  },
  messageListContent: {
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    gap: T.spacing.sm,
  },
  noMessages: {
    alignItems: 'center',
    paddingVertical: T.spacing.xl,
  },
  noMessagesText: {
    color: T.textDim,
    fontSize: T.fontSize.sm,
  },
  messageWrapper: {
    maxWidth: '78%',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: T.radius.lg,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    maxWidth: '100%',
  },
  bubbleTrainer: {
    backgroundColor: T.primary,
    borderBottomRightRadius: 4,
  },
  bubbleUser: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: T.fontSize.md,
    lineHeight: 22,
  },
  messageTextTrainer: {
    color: '#ffffff',
  },
  messageTextUser: {
    color: T.text,
  },
  messageMeta: {
    flexDirection: 'row',
    gap: T.spacing.xs,
    marginTop: 3,
  },
  messageMetaRight: {
    justifyContent: 'flex-end',
  },
  messageMetaLeft: {
    justifyContent: 'flex-start',
  },
  metaSender: {
    fontSize: T.fontSize.xs,
    color: T.textDim,
  },
  metaTime: {
    fontSize: T.fontSize.xs,
    color: T.textDim,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    paddingBottom: T.spacing.lg,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: T.spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    fontSize: T.fontSize.md,
    color: T.text,
    maxHeight: 90,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
