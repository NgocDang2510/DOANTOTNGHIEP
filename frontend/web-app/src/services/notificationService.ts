import api from './axios';

export interface NotificationDTO {
  id: string;
  userId: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const notificationService = {
  async getMyNotifications(page = 0, size = 20): Promise<NotificationPage> {
    const res = await api.get(`/notifications/my?page=${page}&size=${size}`);
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.data?.count ?? 0;
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
