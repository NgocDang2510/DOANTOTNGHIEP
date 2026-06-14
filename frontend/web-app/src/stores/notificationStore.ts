import { create } from 'zustand';
import { notificationService, type NotificationDTO } from '../services/notificationService';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  loading: boolean;
  lastFetched: number;
  addNotification: (n: Omit<AppNotification, 'isRead'>) => void;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => void;
  startPolling: () => () => void;
}

function toAppNotification(dto: NotificationDTO): AppNotification {
  return {
    id: String(dto.id),
    type: dto.type,
    title: dto.title,
    body: dto.body,
    link: dto.link,
    isRead: dto.isRead,
    createdAt: dto.createdAt,
  };
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  lastFetched: 0,

  addNotification: (n) =>
    set(state => ({
      notifications: [{ ...n, isRead: false }, ...state.notifications].slice(0, 50),
    })),

  fetchNotifications: async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;
    try {
      set({ loading: true });
      const page = await notificationService.getMyNotifications(0, 30);
      set({ notifications: page.content.map(toAppNotification), lastFetched: Date.now() });
    } catch {
      // silent — don't crash UI
    } finally {
      set({ loading: false });
    }
  },

  markAllRead: async () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    }));
    try {
      await notificationService.markAllRead();
    } catch {
      // already updated UI optimistically
    }
  },

  clearAll: () => set({ notifications: [] }),

  startPolling: () => {
    const { fetchNotifications } = get();
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  },
}));
