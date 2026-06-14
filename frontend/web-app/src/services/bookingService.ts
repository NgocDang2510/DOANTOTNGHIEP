import api from './axios';
import type { PageData } from './roomService';

export interface BookingResponse {
  id: number;
  roomId: number;
  roomTitle: string;
  roomAddress: string;
  roomImageUrl: string | null;
  studentId: number;
  studentName: string;
  studentPhone: string;
  landlordId: number;
  landlordName: string;
  landlordPhone: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  roomStatus: string;
  note: string | null;
  createdAt: string;
}

export const bookingService = {
  create: async (roomId: number, scheduledAt: string, note?: string): Promise<BookingResponse> => {
    const res = await api.post('/bookings', { roomId, scheduledAt, note });
    return res.data.data;
  },

  getMyBookings: async (page = 0, size = 10): Promise<PageData<BookingResponse>> => {
    const res = await api.get(`/bookings/my?page=${page}&size=${size}`);
    return res.data.data;
  },

  getIncoming: async (page = 0, size = 10): Promise<PageData<BookingResponse>> => {
    const res = await api.get(`/bookings/incoming?page=${page}&size=${size}`);
    return res.data.data;
  },

  confirm: async (id: number): Promise<BookingResponse> => {
    const res = await api.patch(`/bookings/${id}/confirm`);
    return res.data.data;
  },

  cancel: async (id: number): Promise<BookingResponse> => {
    const res = await api.patch(`/bookings/${id}/cancel`);
    return res.data.data;
  },

  complete: async (id: number): Promise<BookingResponse> => {
    const res = await api.patch(`/bookings/${id}/complete`);
    return res.data.data;
  },
};
