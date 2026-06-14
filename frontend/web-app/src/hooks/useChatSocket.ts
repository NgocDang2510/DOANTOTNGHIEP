import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

type MessageHandler = (msg: any) => void;

let globalSocket: Socket | null = null;

export const useChatSocket = (onMessage?: MessageHandler) => {
  const { user, token } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const handlerRef = useRef<MessageHandler | undefined>(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!user || !token) return;

    if (!globalSocket || !globalSocket.connected) {
      // Connect via Vite proxy to avoid mixed content (HTTPS page → HTTP socket)
      globalSocket = io('/', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      globalSocket.on('connect', () => {
        console.log('[Socket] Connected:', globalSocket!.id);
        globalSocket!.emit('user_join', { userId: String(user.id), platform: 'web' });
      });

      globalSocket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });
    } else {
      globalSocket.emit('user_join', { userId: String(user.id), platform: 'web' });
    }

    const handleReceived = (data: any) => handlerRef.current?.(data);
    const handleSent = (data: any) => handlerRef.current?.(data);
    const handleNotification = (data: any) => addNotification(data);

    globalSocket.on('message_received', handleReceived);
    globalSocket.on('message_sent', handleSent);
    globalSocket.on('notification', handleNotification);

    return () => {
      globalSocket?.off('message_received', handleReceived);
      globalSocket?.off('message_sent', handleSent);
      globalSocket?.off('notification', handleNotification);
    };
  }, [user?.id, token]);

  const sendMessage = useCallback(
    (conversationId: string, recipientId: string, content: string) => {
      if (!globalSocket || !user) return;
      const tempId = `temp_${Date.now()}`;
      globalSocket.emit('send_message', {
        conversationId,
        senderId: String(user.id),
        recipientId,
        content,
        messageType: 'text',
        tempId,
      });
    },
    [user?.id]
  );

  const joinConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('leave_conversation', conversationId);
  }, []);

  return { sendMessage, joinConversation, leaveConversation };
};
