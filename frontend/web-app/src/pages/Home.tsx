import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, Star, ChevronLeft, ChevronRight, X, Heart, GitCompare, Navigation, SlidersHorizontal } from 'lucide-react';
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

const ROOM_TYPE_BADGE: Record<string, string> = {
  SINGLE: 'bg-blue-500',
  SHARED: 'bg-emerald-500',
  APARTMENT: 'bg-violet-500',
  HOUSE: 'bg-orange-500',
};

const AMENITY_LABELS: Record<string, string> = {
  WIFI: 'WiFi', AIR_CONDITIONER: 'Điều hòa', WASHING_MACHINE: 'Máy giặt', PARKING: 'Chỗ để xe',
  PRIVATE_BATHROOM: 'WC riêng', KITCHEN: 'Bếp',
  FRIDGE: 'Tủ lạnh', REFRIGERATOR: 'Tủ lạnh',
  SECURITY_CAMERA: 'Camera', SECURITY: 'Bảo vệ',
  ELEVATOR: 'Thang máy', PET_ALLOWED: 'Nuôi thú cưng',
  WATER_HEATER: 'Nước nóng', BALCONY: 'Ban công',
};

const CATEGORY_PILLS = [
  { label: 'Tất cả', value: '' },
  { label: 'Phòng đơn', value: 'SINGLE' },
  { label: 'Ở ghép', value: 'SHARED' },
  { label: 'Căn hộ mini', value: 'APARTMENT' },
  { label: 'Nhà nguyên căn', value: 'HOUSE' },
];

const RoomCard = ({ room, onClick, isFavorited, onToggleFavorite, onCompare, isCompared, distance }: {
  room: RoomResponse;
  onClick: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (roomId: number) => void;
  onCompare?: (room: RoomResponse) => void;
  isCompared?: boolean;
  distance?: number;
}) => (
  <div
    onClick={onClick}
    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1.5 ring-1 ring-white/60 dark:ring-gray-700/60"
  >
    <div className="relative h-52 bg-gray-100 dark:bg-gray-700 overflow-hidden">
      {room.imageUrls.length > 0 ? (
        <img
          src={room.imageUrls[0]}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
          <HomeIcon className="w-16 h-16 text-gray-300 dark:text-gray-500" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

      <span className={`absolute top-3 left-3 ${ROOM_TYPE_BADGE[room.roomType] || 'bg-blue-500'} text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md`}>
        {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
      </span>

      {distance != null && (
        <span className="absolute bottom-3 left-3 bg-green-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
          <Navigation className="w-2.5 h-2.5" />
          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
        </span>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {room.averageRating != null && (
          <span className="bg-black/50 backdrop-blur text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {room.averageRating.toFixed(1)}
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(room.id); }}
            className="w-8 h-8 bg-white/95 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        )}
        {onCompare && (
          <button
            onClick={e => { e.stopPropagation(); onCompare(room); }}
            title={isCompared ? 'Bỏ so sánh' : 'So sánh'}
            className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md ${isCompared ? 'bg-blue-600' : 'bg-white/95 backdrop-blur'}`}
          >
            <GitCompare className={`w-4 h-4 ${isCompared ? 'text-white' : 'text-gray-500'}`} />
          </button>
        )}
      </div>
    </div>

    <div className="p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {room.title}
      </h3>
      <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="line-clamp-1">{room.district ? `${room.district}, ` : ''}{room.city}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-blue-600 dark:text-blue-400 font-bold text-base leading-none">
            {Number(room.price).toLocaleString('vi-VN')}đ
          </span>
          <span className="text-gray-400 text-xs">/tháng</span>
        </div>
        {room.area && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {room.area}m²
          </span>
        )}
      </div>
      {room.amenities.length > 0 && (
        <div className="flex gap-1 mt-2.5 flex-wrap">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-indigo-100 dark:border-indigo-800/30">
              {AMENITY_LABELS[a] || a}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="bg-gray-100/80 dark:bg-gray-700 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
              +{room.amenities.length - 3}
            </span>
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

  // Input state — gõ tự do, KHÔNG trigger fetch
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomType, setRoomType] = useState('');

  // Applied filter state — chỉ thay đổi khi submit / clear / click pill → mới trigger fetch
  const [applied, setApplied] = useState({
    keyword: '', city: '', district: '', minPrice: '', maxPrice: '', roomType: '',
  });

  const fetchRooms = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await roomService.search({
        keyword: applied.keyword || undefined,
        city: applied.city || undefined,
        district: applied.district || undefined,
        minPrice: applied.minPrice ? Number(applied.minPrice) : undefined,
        maxPrice: applied.maxPrice ? Number(applied.maxPrice) : undefined,
        roomType: applied.roomType || undefined,
        page: p,
        size: 12,
      });
      setRooms(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      if (user && res.content.length > 0) {
        const ids = res.content.map(r => r.id);
        favoriteService.getBatchStatus(ids).then(setFavorites).catch(() => {});
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [applied, user]);

  useEffect(() => {
    fetchRooms(page);
  }, [page, fetchRooms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ keyword, city, district, minPrice, maxPrice, roomType });
    setPage(0);
  };

  const clearFilters = () => {
    setKeyword(''); setCity(''); setDistrict(''); setMinPrice(''); setMaxPrice(''); setRoomType('');
    setApplied({ keyword: '', city: '', district: '', minPrice: '', maxPrice: '', roomType: '' });
    setPage(0);
  };

  const hasFilters = applied.keyword || applied.city || applied.district || applied.minPrice || applied.maxPrice || applied.roomType;

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
    <div className="space-y-6">

      {/* ── Hero + Search ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl overflow-hidden p-6 sm:p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 leading-tight">
            Tìm phòng trọ lý tưởng của bạn
          </h1>
          <p className="text-blue-100/80 text-sm mb-6">
            Hàng ngàn phòng trọ, căn hộ mini tại TP.HCM và nhiều tỉnh thành trên cả nước
          </p>

          <form onSubmit={handleSearch}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden">
              <div className="flex items-center flex-1 px-4 py-3.5 gap-3 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Tên phòng, địa chỉ..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder-gray-400"
                />
              </div>
              <div className="flex items-center px-4 py-3.5 gap-3 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Thành phố"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full sm:w-36 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={handleFindNearby}
                  disabled={locating}
                  title="Tìm phòng gần vị trí của bạn"
                  className={`p-2 rounded-xl transition-colors ${userLocation ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                >
                  <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilter(f => !f)}
                  className={`p-2 rounded-xl transition-colors ${showFilter ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Tìm
                </button>
              </div>
            </div>

            {showFilter && (
              <div className="mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 shadow-xl">
                <input
                  placeholder="Quận/Huyện"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-1.5 items-center">
                  <input
                    placeholder="Giá từ"
                    type="number"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-sm">-</span>
                  <input
                    placeholder="đến"
                    type="number"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </form>

          {!loading && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-blue-100/90 text-sm">
                <span className="font-bold text-white">{totalElements.toLocaleString()}</span> phòng
              </span>
              <span className="text-white/30">·</span>
              <span className="text-blue-100/80 text-sm">Khắp cả nước</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_PILLS.map(type => (
          <button
            key={type.value}
            onClick={() => { setRoomType(type.value); setApplied(prev => ({ ...prev, roomType: type.value })); setPage(0); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              applied.roomType === type.value
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* ── Recently Viewed ── */}
      {user && viewHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Đã xem gần đây</h2>
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Xóa lịch sử
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {viewHistory.map(r => (
              <div
                key={r.id}
                onClick={() => navigate(`/rooms/${r.id}`)}
                className="flex-shrink-0 w-44 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="h-28 bg-gray-100 dark:bg-gray-700">
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><HomeIcon className="w-8 h-8 text-gray-300" /></div>
                  }
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{r.title}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    {Number(r.price).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Nearby Rooms ── */}
      {nearbyRooms.length > 0 && userLocation && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Navigation className="w-3 h-3" />
                GPS · 5km
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Phòng gần bạn</h2>
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

      {/* ── Results Header ── */}
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {loading ? 'Đang tải...' : `${totalElements.toLocaleString()} phòng`}
        </h2>
        {hasFilters && !loading && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full transition-colors"
          >
            <X className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      {/* ── Room Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md ring-1 ring-white/60 dark:ring-gray-700/60 animate-pulse">
              <div className="h-52 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <HomeIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Không tìm thấy phòng nào</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
