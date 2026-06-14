import api from './axios';
import type { RoomResponse } from './roomService';

export const favoriteService = {
  toggle: async (roomId: number): Promise<boolean> => {
    const res = await api.post(`/favorites/${roomId}`);
    return res.data.data.favorited as boolean;
  },

  getMyFavorites: async (page = 0, size = 12): Promise<{ content: RoomResponse[]; totalPages: number; totalElements: number }> => {
    const res = await api.get(`/favorites?page=${page}&size=${size}`);
    return res.data.data;
  },

  getBatchStatus: async (roomIds: number[]): Promise<Record<number, boolean>> => {
    if (roomIds.length === 0) return {};
    const res = await api.post('/favorites/status', roomIds);
    return res.data.data;
  },
};
