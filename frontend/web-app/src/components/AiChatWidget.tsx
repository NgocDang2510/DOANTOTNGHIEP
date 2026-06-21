import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Trash2, MapPin } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface Room {
  id: number;
  title: string;
  price: number;
  district: string;
  city: string;
  imageUrls: string[];
  roomType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rooms?: Room[];
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part || null;
  });
}

function MessageText({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="text-sm leading-relaxed space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-60" />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-1" />;
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const typeLabel: Record<string, string> = {
    SINGLE: 'Phòng đơn',
    SHARED: 'Ở ghép',
    MINI_APARTMENT: 'Căn hộ mini',
    WHOLE_HOUSE: 'Nhà nguyên căn',
  };
  return (
    <div
      onClick={onClick}
      className="flex gap-2 p-2 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 transition-colors"
    >
      {room.imageUrls?.[0] ? (
        <img src={room.imageUrls[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{room.title}</p>
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
          {(room.price / 1_000_000).toFixed(1)}tr/tháng
        </p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {room.district}, {room.city}
          </p>
        </div>
        <span className="inline-block text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full mt-0.5">
          {typeLabel[room.roomType] || room.roomType}
        </span>
      </div>
    </div>
  );
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! Mình là **RoomAI** 🏠\n\nMình có thể giúp bạn:\n- Tìm phòng theo khu vực và ngân sách\n- Tư vấn loại phòng phù hợp\n- Giải đáp thắc mắc về thuê trọ\n\nBạn muốn tìm phòng ở đâu?',
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedForUserRef = useRef<string | null>(null);
  const aiRawRef = useRef(''); // accumulates raw tokens including [SEARCH:...] tag
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const userId = useMemo(() => {
    if (user) return String(user.id);
    let guestId = localStorage.getItem('aiGuestId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('aiGuestId', guestId);
    }
    return guestId;
  }, [user]);

  // Load history khi mở lần đầu hoặc khi userId thay đổi (đổi tài khoản)
  useEffect(() => {
    if (!isOpen) return;
    if (loadedForUserRef.current === userId) return;
    loadedForUserRef.current = userId;
    setMessages([]);
    setIsLoadingHistory(true);
    fetch(`/api/ai-chat/messages/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          setMessages(
            data.data.map((m: { _id: string; role: string; content: string; rooms?: Room[] }) => ({
              id: m._id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              rooms: m.rooms ?? [],
            }))
          );
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      })
      .catch(() => setMessages([WELCOME_MESSAGE]))
      .finally(() => setIsLoadingHistory(false));
  }, [isOpen, userId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const aiMsgId = `ai_${Date.now()}`;

    setInput('');
    setIsStreaming(true);
    aiRawRef.current = '';
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: aiMsgId, role: 'assistant', content: '', rooms: [] },
    ]);

    try {
      const resp = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content: text }),
      });

      if (!resp.body) throw new Error('No response body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by \n\n — buffer until we have complete events
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? ''; // last element may be incomplete

        for (const event of events) {
          for (const line of event.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token !== undefined) {
                aiRawRef.current += data.token;
                const raw = aiRawRef.current;
                // If Gemini started with [SEARCH:...] tag, hide it until tag closes
                let display: string;
                if (raw.trimStart().startsWith('[SEARCH:')) {
                  const closeIdx = raw.indexOf(']');
                  display = closeIdx === -1 ? '' : raw.slice(closeIdx + 1).trimStart();
                } else {
                  display = raw;
                }
                setMessages(prev => prev.map(m =>
                  m.id === aiMsgId ? { ...m, content: display } : m
                ));
              } else if (data.rooms) {
                setMessages(prev =>
                  prev.map(m => (m.id === aiMsgId ? { ...m, rooms: data.rooms } : m))
                );
              } else if (data.done) {
                setIsStreaming(false);
              }
            } catch {
              // ignore malformed SSE line
            }
          }
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId && !m.content
            ? { ...m, content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const clearHistory = async () => {
    await fetch(`/api/ai-chat/history/${userId}`, { method: 'DELETE' }).catch(() => {});
    setMessages([{ ...WELCOME_MESSAGE, id: `welcome_${Date.now()}`, content: 'Lịch sử đã được xóa. Mình có thể giúp gì cho bạn?' }]);
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-[4.5rem] right-6 z-50 w-80 h-[520px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">RoomAI</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Gemini</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                title="Xóa lịch sử"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoadingHistory && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm px-3 py-2'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      {msg.content ? (
                        <MessageText content={msg.content} />
                      ) : isStreaming ? (
                        <TypingDots />
                      ) : null}

                      {msg.rooms && msg.rooms.length > 0 && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Phòng phù hợp ({msg.rooms.length})
                          </p>
                          {msg.rooms.map(room => (
                            <RoomCard
                              key={room.id}
                              room={room}
                              onClick={() => navigate(`/rooms/${room.id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Tìm phòng ở đâu, giá bao nhiêu..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white placeholder-gray-400 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="p-1 text-blue-600 dark:text-blue-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:text-blue-700 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
              Powered by Google Gemini
            </p>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="RoomAI - Trợ lý tìm phòng"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>
    </>
  );
}
