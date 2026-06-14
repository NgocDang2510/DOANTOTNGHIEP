import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Star, Eye, ArrowLeft } from 'lucide-react';
import { useCompareStore } from '../stores/compareStore';

const AMENITY_LABELS: Record<string, string> = {
  WIFI: 'WiFi',
  PARKING: 'Chỗ để xe',
  AIR_CONDITIONING: 'Điều hòa',
  WATER_HEATER: 'Nước nóng',
  REFRIGERATOR: 'Tủ lạnh',
  WASHING_MACHINE: 'Máy giặt',
  SECURITY: 'Bảo vệ',
  ELEVATOR: 'Thang máy',
  GYM: 'Phòng gym',
  POOL: 'Hồ bơi',
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Phòng đơn',
  SHARED: 'Phòng ghép',
  APARTMENT: 'Căn hộ',
  MINI_APARTMENT: 'Căn hộ mini',
  STUDIO: 'Studio',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ComparePage() {
  const { rooms, remove, clear } = useCompareStore();
  const navigate = useNavigate();

  if (rooms.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <GitCompare className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 dark:text-gray-400">Chọn ít nhất 2 phòng để so sánh</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Tìm phòng
        </button>
      </div>
    );
  }

  const allAmenities = [...new Set(rooms.flatMap(r => r.amenities))];

  const rows: { label: string; values: (string | JSX.Element)[] }[] = [
    {
      label: 'Ảnh',
      values: rooms.map(r => (
        <img
          key={r.id}
          src={r.imageUrls[0] || '/placeholder.jpg'}
          alt={r.title}
          className="w-full h-36 object-cover rounded-lg"
        />
      )),
    },
    { label: 'Loại phòng', values: rooms.map(r => ROOM_TYPE_LABELS[r.roomType] || r.roomType) },
    { label: 'Giá thuê', values: rooms.map(r => formatPrice(r.price)) },
    { label: 'Diện tích', values: rooms.map(r => r.area ? `${r.area} m²` : '—') },
    { label: 'Khu vực', values: rooms.map(r => [r.district, r.city].filter(Boolean).join(', ') || '—') },
    {
      label: 'Đánh giá',
      values: rooms.map(r => (
        <span key={r.id} className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          {r.averageRating ? r.averageRating.toFixed(1) : '—'}
          <span className="text-xs text-gray-400">({r.reviewCount})</span>
        </span>
      )),
    },
    {
      label: 'Lượt xem',
      values: rooms.map(r => (
        <span key={r.id} className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          {r.viewCount.toLocaleString()}
        </span>
      )),
    },
    ...allAmenities.map(amenity => ({
      label: AMENITY_LABELS[amenity] || amenity,
      values: rooms.map(r =>
        r.amenities.includes(amenity)
          ? <span key={r.id} className="text-green-500 font-bold">✓</span>
          : <span key={r.id} className="text-gray-300">—</span>
      ),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-600" />
          So sánh phòng
        </h1>
        <button
          onClick={() => { clear(); navigate('/'); }}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left py-3 px-4 w-28 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50">
                Tiêu chí
              </th>
              {rooms.map(room => (
                <th key={room.id} className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 text-sm"
                    >
                      {room.title}
                    </button>
                    <button
                      onClick={() => remove(room.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.label}
                className={`border-b border-gray-50 dark:border-gray-700/50 ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/20'}`}
              >
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50 whitespace-nowrap">
                  {row.label}
                </td>
                {row.values.map((val, i) => (
                  <td key={i} className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-3">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => navigate(`/rooms/${room.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Xem chi tiết: {room.title.slice(0, 20)}...
          </button>
        ))}
      </div>
    </div>
  );
}
