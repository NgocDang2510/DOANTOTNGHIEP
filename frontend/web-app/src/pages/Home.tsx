import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, Star, ChevronLeft, ChevronRight, Filter, X, Heart, GitCompare, Navigation, Map } from 'lucide-react';
import { roomService, type RoomResponse } from '../services/roomService';
import { favoriteService } from '../services/favoriteService';
import { useAuthStore } from '../stores/authStore';
import { useCompareStore } from '../stores/compareStore';
import { useViewHistory } from '../hooks/useViewHistory';
import api from '../services/axios';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Phòng đơn', SHARED: 'Ở ghép', APARTMENT: 'Căn hộ mini', HOUSE: 'Nhà nguyên căn',
};

const AMENITY_LABELS: Record<string, string> = {
  WIFI: 'WiFi', AIR_CONDITIONER: 'Điều hòa', WASHING_MACHINE: 'Máy giặt', PARKING: 'Chỗ để xe',
  PRIVATE_BATHROOM: 'WC riêng', KITCHEN: 'Bếp', FRIDGE: 'Tủ lạnh', SECURITY_CAMERA: 'Camera',
  ELEVATOR: 'Thang máy', PET_ALLOWED: 'Nuôi thú cưng',
};

const RoomCard = ({ room, onClick, isFavorited, onToggleFavorite, onCompare, isCompared, distance }: {
  room: RoomResponse;
  onClick: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (roomId: number) => void;
  onCompare?: (room: RoomResponse) => void;
  isCompared?: boolean;
  distance?: number;
}) => (
  <div onClick={onClick} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-gray-100 dark:border-gray-700">
    <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
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
      {distance != null && (
        <span className="absolute bottom-3 left-3 bg-green-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Navigation className="w-2.5 h-2.5" />
          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
        </span>
      )}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {room.averageRating != null && (
          <span className="bg-white/90 backdrop-blur text-gray-800 text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {room.averageRating.toFixed(1)}
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(room.id); }}
            className="w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
        {onCompare && (
          <button
            onClick={e => { e.stopPropagation(); onCompare(room); }}
            title={isCompared ? 'Bỏ so sánh' : 'So sánh'}
            className={`w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${isCompared ? 'bg-blue-600' : 'bg-white/90 backdrop-blur'}`}
          >
            <GitCompare className={`w-3.5 h-3.5 ${isCompared ? 'text-white' : 'text-gray-400'}`} />
          </button>
        )}
      </div>
    </div>
    <div className="p-4">
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
      {room.amenities.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {AMENITY_LABELS[a] || a}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full">+{room.amenities.length - 3}</span>
          )}
        </div>
      )}
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { add: addCompare, remove: removeCompare, has: isCompared } = useCompareStore();
  const { history: viewHistory, clearHistory } = useViewHistory();
  const [nearbyRooms, setNearbyRooms] = useState<RoomResponse[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const handleFindNearby = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const res = await api.get(`/rooms/nearby?lat=${lat}&lng=${lng}&radius=5&limit=12`);
          setNearbyRooms(res.data.data || []);
        } catch {
          setNearbyRooms([]);
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomType, setRoomType] = useState('');

  const fetchRooms = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await roomService.search({
        keyword: keyword || undefined,
        city: city || undefined,
        district: district || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        roomType: roomType || undefined,
        page: p,
        size: 12,
      });
      setRooms(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      // Load trạng thái yêu thích nếu đã đăng nhập
      if (user && res.content.length > 0) {
        const ids = res.content.map(r => r.id);
        favoriteService.getBatchStatus(ids).then(setFavorites).catch(() => {});
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, city, district, minPrice, maxPrice, roomType, user]);

  useEffect(() => {
    fetchRooms(page);
  }, [page, fetchRooms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchRooms(0);
  };

  const clearFilters = () => {
    setKeyword(''); setCity(''); setDistrict(''); setMinPrice(''); setMaxPrice(''); setRoomType('');
    setPage(0);
  };

  const hasFilters = keyword || city || district || minPrice || maxPrice || roomType;

  const handleToggleFavorite = async (roomId: number) => {
    if (!user) { navigate('/login'); return; }
    setFavorites(prev => ({ ...prev, [roomId]: !prev[roomId] }));
    try {
      const favorited = await favoriteService.toggle(roomId);
      setFavorites(prev => ({ ...prev, [roomId]: favorited }));
    } catch {
      setFavorites(prev => ({ ...prev, [roomId]: !prev[roomId] }));
    }
  };

  const handleCompare = (room: RoomResponse) => {
    if (isCompared(room.id)) {
      removeCompare(room.id);
    } else {
      addCompare({
        id: room.id,
        title: room.title,
        price: Number(room.price),
        area: room.area ? Number(room.area) : null,
        city: room.city,
        district: room.district,
        roomType: room.roomType,
        averageRating: room.averageRating ?? null,
        reviewCount: room.reviewCount,
        viewCount: room.viewCount ?? 0,
        imageUrls: room.imageUrls,
        amenities: room.amenities,
      });
    }
  };

  return (
    <div>
      {/* Recently Viewed */}
      {user && viewHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Đã xem gần đây</h2>
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Xóa lịch sử
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {viewHistory.map(r => (
              <div
                key={r.id}
                onClick={() => navigate(`/rooms/${r.id}`)}
                className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="h-24 bg-gray-100 dark:bg-gray-700">
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><HomeIcon className="w-6 h-6 text-gray-300" /></div>
                  }
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{r.title}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">{Number(r.price).toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Tìm theo tên phòng, địa chỉ..."
              value={keyword} onChange={e => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <button
            type="button"
            onClick={handleFindNearby}
            disabled={locating}
            title="Tìm phòng gần vị trí của bạn"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${userLocation ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-400'}`}
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:block">{locating ? 'Đang định vị...' : 'Gần tôi'}</span>
          </button>
          <button type="button" onClick={() => setShowFilter(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'}`}>
            <Filter className="w-4 h-4" />
            Lọc
          </button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
            Tìm
          </button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Thành phố" value={city} onChange={e => setCity(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
            <input placeholder="Quận/Huyện" value={district} onChange={e => setDistrict(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
            <div className="flex gap-1.5 items-center">
              <input placeholder="Giá từ" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              <span className="text-gray-400 text-sm">-</span>
              <input placeholder="đến" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
            </div>
            <select value={roomType} onChange={e => setRoomType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500">
              <option value="">Tất cả loại phòng</option>
              {Object.entries(ROOM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </form>

      {/* Nearby Rooms Section */}
      {nearbyRooms.length > 0 && userLocation && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">
                <Navigation className="w-3 h-3" /> GPS
              </span>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phòng gần bạn (trong 5km)</h2>
            </div>
            <button
              onClick={() => { setNearbyRooms([]); setUserLocation(null); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nearbyRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => navigate(`/rooms/${room.id}`)}
                isFavorited={!!favorites[room.id]}
                onToggleFavorite={user?.role !== 'LANDLORD' && user?.role !== 'ADMIN' ? handleToggleFavorite : undefined}
                onCompare={user?.role === 'STUDENT' || !user ? handleCompare : undefined}
                isCompared={isCompared(room.id)}
                distance={room.latitude && room.longitude ? haversineKm(userLocation.lat, userLocation.lng, room.latitude, room.longitude) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? 'Đang tìm...' : `Tìm thấy ${totalElements} phòng`}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
              <X className="w-3 h-3" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Room grid */}
      {loading ? (
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
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HomeIcon className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy phòng nào</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => navigate(`/rooms/${room.id}`)}
              isFavorited={!!favorites[room.id]}
              onToggleFavorite={user?.role !== 'LANDLORD' && user?.role !== 'ADMIN' ? handleToggleFavorite : undefined}
              onCompare={user?.role === 'STUDENT' || !user ? handleCompare : undefined}
              isCompared={isCompared(room.id)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
};

export default Home;
