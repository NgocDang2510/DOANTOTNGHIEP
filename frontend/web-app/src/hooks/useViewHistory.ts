import { useState, useCallback } from 'react';

const KEY = 'saf_view_history';
const MAX = 10;

export interface HistoryRoom {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  city: string;
  district: string;
  roomType: string;
  viewedAt: number;
}

function load(): HistoryRoom[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(rooms: HistoryRoom[]) {
  localStorage.setItem(KEY, JSON.stringify(rooms));
}

export function useViewHistory() {
  const [history, setHistory] = useState<HistoryRoom[]>(load);

  const addToHistory = useCallback((room: HistoryRoom) => {
    setHistory(prev => {
      const filtered = prev.filter(r => r.id !== room.id);
      const next = [{ ...room, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    save([]);
    setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
