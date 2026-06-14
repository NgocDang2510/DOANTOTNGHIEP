import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Navigation, MapPin, Star, Home as HomeIcon } from 'lucide-react';
import { roomService, type RoomResponse } from '../services/roomService';

// Fix leaflet default marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Phòng đơn', SHARED: 'Ở ghép', APARTMENT: 'Căn hộ mini', HOUSE: 'Nhà nguyên căn',
};

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { duration: 1.5 });
  }, [coords, map]);
  return null;
}

const MapPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    roomService.search({ page: 0, size: 100 }).then(data => setRooms(data.content)).catch(() => {});
  }, []);

  const mappedRooms = rooms.filter(r => r.latitude && r.longitude);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bản đồ phòng trọ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {mappedRooms.length}/{rooms.length} phòng có vị trí trên bản đồ
          </p>
        </div>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Đang định vị...' : 'Gần tôi'}
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
        style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyTo coords={userCoords} />

          {userCoords && (
            <Marker position={userCoords}>
              <Popup>
                <p className="font-bold text-sm">Vị trí của bạn</p>
              </Popup>
            </Marker>
          )}

          {mappedRooms.map(room => (
            <Marker key={room.id} position={[room.latitude!, room.longitude!]}>
              <Popup minWidth={180}>
                <div className="cursor-pointer" onClick={() => navigate(`/rooms/${room.id}`)}>
                  {room.imageUrls[0] ? (
                    <img src={room.imageUrls[0]} alt={room.title}
                      className="w-full h-28 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <HomeIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <span className="inline-block text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full mb-1">
                    {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                  </span>
                  <p className="font-bold text-sm text-gray-900 leading-tight mb-1">{room.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {room.district ? `${room.district}, ` : ''}{room.city}
                  </p>
                  <p className="text-blue-600 font-bold text-sm">
                    {Number(room.price).toLocaleString('vi-VN')}đ/tháng
                  </p>
                  {room.averageRating != null && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {room.averageRating.toFixed(1)} ({room.reviewCount} đánh giá)
                    </p>
                  )}
                  <p className="text-xs text-blue-600 font-medium mt-2 text-right">Xem chi tiết →</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {mappedRooms.length === 0 && rooms.length > 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
          Chưa có phòng nào có tọa độ. Chủ trọ cần chọn vị trí trên bản đồ khi đăng phòng.
        </p>
      )}
    </div>
  );
};

export default MapPage;
