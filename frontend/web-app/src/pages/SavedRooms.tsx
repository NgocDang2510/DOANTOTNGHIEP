import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Home as HomeIcon, MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { favoriteService } from '../services/favoriteService';
import type { RoomResponse } from '../services/roomService';

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Phòng đơn', SHARED: 'Ở ghép', APARTMENT: 'Căn hộ mini', HOUSE: 'Nhà nguyên căn',
};

export default function SavedRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [removing, setRemoving] = useState<number | null>(null);

  const fetchFavorites = async (p: number) => {
    setLoading(true);
    try {
      const res = await favoriteService.getMyFavorites(p, 12);
      setRooms(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFavorites(page); }, [page]);

  const handleRemove = async (roomId: number) => {
    setRemoving(roomId);
    try {
      await favoriteService.toggle(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setTotalElements(prev => prev - 1);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Phòng đã lưu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? '...' : `${totalElements} phòng yêu thích`}
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có phòng nào được lưu</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">
            Bấm icon ❤️ trên các phòng để lưu vào đây
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Khám phá phòng
          </button>
        </div>
      )}

      {/* Room grid */}
      {!loading && rooms.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map(room => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 group"
              >
                {/* Image */}
                <div
                  className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  {room.imageUrls.length > 0 ? (
                    <img src={room.imageUrls[0]} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HomeIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                  </span>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {room.averageRating != null && (
                      <span className="bg-white/90 backdrop-blur text-gray-800 text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {room.averageRating.toFixed(1)}
                      </span>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(room.id); }}
                      disabled={removing === room.id}
                      className="w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-60"
                    >
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 cursor-pointer" onClick={() => navigate(`/rooms/${room.id}`)}>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">{room.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{room.district ? `${room.district}, ` : ''}{room.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {Number(room.price).toLocaleString('vi-VN')}đ/tháng
                    </span>
                    {room.area && <span className="text-gray-400 text-xs">{room.area}m²</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {p + 1}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
