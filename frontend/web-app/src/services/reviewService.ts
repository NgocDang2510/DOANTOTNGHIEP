import api from './axios';
import type { PageData } from './roomService';

export interface ReviewResponse {
  id: number;
  roomId: number;
  studentId: number;
  studentName: string;
  studentAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export const reviewService = {
  getRoomReviews: async (roomId: number, page = 0, size = 10): Promise<PageData<ReviewResponse>> => {
    const res = await api.get(`/reviews/room/${roomId}?page=${page}&size=${size}`);
    return res.data.data;
  },

  create: async (roomId: number, rating: number, comment?: string): Promise<ReviewResponse> => {
    const res = await api.post('/reviews', { roomId, rating, comment });
    return res.data.data;
  },

  update: async (id: number, rating: number, comment?: string): Promise<ReviewResponse> => {
    const res = await api.put(`/reviews/${id}`, { rating, comment });
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
};
