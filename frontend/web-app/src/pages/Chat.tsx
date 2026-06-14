import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, User, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { chatService, type Conversation, type ChatMessage } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const Chat = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track which conversationId has been opened so the auto-select effect doesn't re-fire
  const openedConvIdRef = useRef<string | null>(null);

  const handleNewMessage = useCallback((msg: any) => {
    const convId = msg.conversationId;
    const normalized: ChatMessage = {
      _id: msg.messageId || msg._id || String(Date.now()),
      conversationId: convId,
      senderId: msg.senderId,
      receiverId: msg.receiverId || '',
      content: msg.content || msg.text || '',
      messageType: msg.messageType || 'text',
      status: msg.status || 'sent',
      isRevoked: msg.isRevoked || false,
      createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
    };

    if (convId === activeConv?.conversationId) {
      setMessages(prev => {
        // Replace optimistic temp message if this is a confirmed echo of our own send
        const tempIdx = prev.findIndex(m => m._id.startsWith('temp_') && m.senderId === normalized.senderId && m.content === normalized.content);
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = normalized;
          return next;
        }
        const exists = prev.some(m => m._id === normalized._id);
        if (exists) return prev;
        return [...prev, normalized];
      });
    }
    setConversations(prev =>
      prev.map(c =>
        c.conversationId === convId
          ? { ...c, lastMessage: { content: normalized.content, senderId: normalized.senderId, messageType: 'text', timestamp: normalized.createdAt } }
          : c
      )
    );
  }, [activeConv?.conversationId]);

  const { sendMessage, joinConversation, leaveConversation } = useChatSocket(handleNewMessage);

  // Load conversation list
  useEffect(() => {
    if (!user) return;
    chatService.getConversations(user.id).then(list => {
      setConversations(list);
      setLoadingConvs(false);
    }).catch(() => setLoadingConvs(false));
  }, [user?.id]);

  // Auto-select conversation from URL param (only once per conversationId)
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;
    if (openedConvIdRef.current === conversationId) return;
    const found = conversations.find(c => c.conversationId === conversationId);
    if (found) openConversation(found);
  }, [conversationId, conversations]);

  const openConversation = useCallback(async (conv: Conversation) => {
    if (activeConv) leaveConversation(activeConv.conversationId);
    openedConvIdRef.current = conv.conversationId;
    setActiveConv(conv);
    setMobileShowThread(true);
    setLoadingMsgs(true);
    joinConversation(conv.conversationId);
    navigate(`/chat/${conv.conversationId}`, { replace: true });

    try {
      const msgs = await chatService.getMessages(conv.conversationId, user!.id);
      setMessages(msgs);
      await chatService.markAsRead(conv.conversationId, user!.id);
      setConversations(prev => prev.map(c => c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c));
    } finally {
      setLoadingMsgs(false);
    }
  }, [activeConv, user?.id, joinConversation, leaveConversation, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeConv || !user) return;
    const content = input.trim();
    const tempId = `temp_${Date.now()}`;
    const optimistic: ChatMessage = {
      _id: tempId,
      conversationId: activeConv.conversationId,
      senderId: String(user.id),
      receiverId: '',
      content,
      messageType: 'text',
      status: 'sending',
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    const otherId = chatService.getOtherUserId(activeConv, user.id);
    sendMessage(activeConv.conversationId, otherId, content);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!user) return null;

  const myId = String(user.id);

  return (
    <div className="flex h-[calc(100vh-64px)] -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden border-t border-gray-100 dark:border-gray-700">

      {/* ── Conversation List ── */}
      <div className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 ${mobileShowThread ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" /> Tin nhắn
          </h2>
        </div>

        {loadingConvs ? (
          <div className="flex-1 space-y-2 p-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <MessageCircle className="w-12 h-12 text-gray-200 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs text-gray-400 mt-1">Nhắn tin với chủ nhà từ trang chi tiết phòng</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => {
              const isActive = conv.conversationId === activeConv?.conversationId;
              const preview = conv.lastMessage?.content ?? 'Bắt đầu cuộc trò chuyện';
              const ts = conv.lastMessage?.timestamp ? formatTime(conv.lastMessage.timestamp) : '';
              return (
                <button
                  key={conv.conversationId}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    {conv.groupAvatar
                      ? <img src={conv.groupAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{conv.groupName || 'Người dùng'}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{ts}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{preview}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Message Thread ── */}
      <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!mobileShowThread ? 'hidden sm:flex' : 'flex'}`}>
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Chọn một cuộc trò chuyện</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <button onClick={() => setMobileShowThread(false)} className="sm:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                {activeConv.groupAvatar
                  ? <img src={activeConv.groupAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : <User className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{activeConv.groupName || 'Người dùng'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-400">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === myId;
                  const showTime = i === 0 || new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 5 * 60 * 1000;
                  return (
                    <div key={msg._id || i}>
                      {showTime && (
                        <div className="text-center my-2">
                          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.isRevoked ? <em className="opacity-60">Tin nhắn đã bị thu hồi</em> : msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                rows={1}
                className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 max-h-28"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
