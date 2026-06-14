import { create } from 'zustand';

interface CompareRoom {
  id: number;
  title: string;
  price: number;
  area: number | null;
  city: string;
  district: string;
  roomType: string;
  averageRating: number | null;
  reviewCount: number;
  viewCount: number;
  imageUrls: string[];
  amenities: string[];
}

interface CompareStore {
  rooms: CompareRoom[];
  add: (room: CompareRoom) => void;
  remove: (id: number) => void;
  clear: () => void;
  has: (id: number) => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  rooms: [],
  add: (room) => {
    if (get().rooms.length >= 3) return;
    if (get().has(room.id)) return;
    set(s => ({ rooms: [...s.rooms, room] }));
  },
  remove: (id) => set(s => ({ rooms: s.rooms.filter(r => r.id !== id) })),
  clear: () => set({ rooms: [] }),
  has: (id) => get().rooms.some(r => r.id === id),
}));
