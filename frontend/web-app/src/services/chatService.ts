import api from './axios';

export interface ChatParticipant {
  userId: string;
  role: string;
}

export interface LastMessage {
  content: string;
  senderId: string;
  messageType: string;
  timestamp: string;
}

export interface Conversation {
  conversationId: string;
  participants: ChatParticipant[];
  isGroup: boolean;
  groupName: string | null;
  groupAvatar: string | null;
  lastMessage: LastMessage | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  status: string;
  isRevoked?: boolean;
  createdAt: string;
}

const makeConversationId = (uid1: number, uid2: number) =>
  `conv_${Math.min(uid1, uid2)}_${Math.max(uid1, uid2)}`;

export const chatService = {
  getOrCreateConversation: async (
    myId: number,
    otherId: number,
    otherName: string,
    otherAvatar?: string | null
  ): Promise<Conversation> => {
    const conversationId = makeConversationId(myId, otherId);
    const res = await api.post('/messages/conversation', {
      conversationId,
      participants: [String(myId), String(otherId)],
      isGroup: false,
      groupName: otherName,
      groupAvatar: otherAvatar || null,
      creatorId: String(myId),
    });
    return res.data.data;
  },

  getConversations: async (userId: number): Promise<Conversation[]> => {
    const res = await api.get(`/messages/conversations/${userId}`);
    const convs = (res.data.data as Conversation[]).filter(
      c => !c.conversationId.startsWith('cloud_') && !c.isGroup
    );

    // Replace groupName with the other participant's real name from Spring Boot
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherId = conv.participants.find(p => p.userId !== String(userId))?.userId;
        if (!otherId) return conv;
        try {
          const userRes = await api.get(`/users/${otherId}`);
          const other = userRes.data?.data;
          const name = other?.fullName || other?.name || conv.groupName;
          const avatar = other?.avatarUrl || other?.avatar || conv.groupAvatar;
          return { ...conv, groupName: name, groupAvatar: avatar };
        } catch {
          return conv;
        }
      })
    );
    return enriched;
  },

  getMessages: async (conversationId: string, userId: number): Promise<ChatMessage[]> => {
    const res = await api.get(`/messages/conversation/${conversationId}`, {
      params: { userId, limit: 100 },
    });
    return res.data.data;
  },

  markAsRead: async (conversationId: string, userId: number): Promise<void> => {
    await api.put(`/messages/conversations/${conversationId}/read`, { userId: String(userId) });
  },

  getOtherUserId: (conv: Conversation, myId: number): string => {
    const other = conv.participants.find(p => p.userId !== String(myId));
    return other?.userId ?? '';
  },
};
