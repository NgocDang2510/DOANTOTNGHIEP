import api from './axios';

export interface RoomResponse {
  id: number;
  landlordId: number;
  landlordName: string;
  landlordPhone: string;
  landlordAvatarUrl: string | null;
  title: string;
  description: string;
  price: number;
  address: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  roomType: 'SINGLE' | 'SHARED' | 'APARTMENT' | 'HOUSE';
  status: 'AVAILABLE' | 'RENTED' | 'HIDDEN';
  imageUrls: string[];
  amenities: string[];
  averageRating: number | null;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomRequest {
  title: string;
  description: string;
  price: number;
  address: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  roomType: string;
  imageUrls: string[];
  amenities: string[];
}

export interface PageData<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchParams {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const roomService = {
  search: async (params: SearchParams): Promise<PageData<RoomResponse>> => {
    const p = new URLSearchParams();
    if (params.city) p.set('city', params.city);
    if (params.district) p.set('district', params.district);
    if (params.minPrice != null) p.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) p.set('maxPrice', String(params.maxPrice));
    if (params.roomType) p.set('roomType', params.roomType);
    if (params.keyword) p.set('keyword', params.keyword);
    p.set('page', String(params.page ?? 0));
    p.set('size', String(params.size ?? 12));
    const res = await api.get(`/rooms?${p.toString()}`);
    return res.data.data;
  },

  getById: async (id: number): Promise<RoomResponse> => {
    const res = await api.get(`/rooms/${id}`);
    return res.data.data;
  },

  getMyRooms: async (page = 0, size = 10): Promise<PageData<RoomResponse>> => {
    const res = await api.get(`/rooms/my?page=${page}&size=${size}`);
    return res.data.data;
  },

  create: async (data: RoomRequest): Promise<RoomResponse> => {
    const res = await api.post('/rooms', data);
    return res.data.data;
  },

  update: async (id: number, data: RoomRequest): Promise<RoomResponse> => {
    const res = await api.put(`/rooms/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },

  changeStatus: async (id: number, status: string): Promise<RoomResponse> => {
    const res = await api.patch(`/rooms/${id}/status?status=${status}`);
    return res.data.data;
  },
};
