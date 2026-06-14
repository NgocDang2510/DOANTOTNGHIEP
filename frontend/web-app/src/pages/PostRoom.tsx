import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Plus, ChevronLeft, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { roomService, type RoomRequest } from '../services/roomService';
import api from '../services/axios';

// Fix leaflet marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Phòng đơn' },
  { value: 'SHARED', label: 'Ở ghép' },
  { value: 'APARTMENT', label: 'Căn hộ mini' },
  { value: 'HOUSE', label: 'Nhà nguyên căn' },
];

const AMENITIES = [
  { value: 'WIFI', label: 'WiFi' },
  { value: 'AIR_CONDITIONER', label: 'Điều hòa' },
  { value: 'WASHING_MACHINE', label: 'Máy giặt' },
  { value: 'PARKING', label: 'Chỗ để xe' },
  { value: 'PRIVATE_BATHROOM', label: 'WC riêng' },
  { value: 'KITCHEN', label: 'Bếp' },
  { value: 'FRIDGE', label: 'Tủ lạnh' },
  { value: 'SECURITY_CAMERA', label: 'Camera' },
  { value: 'ELEVATOR', label: 'Thang máy' },
  { value: 'PET_ALLOWED', label: 'Nuôi thú cưng' },
];

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

interface FormState extends RoomRequest {
  latitude?: number;
  longitude?: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

const PostRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>({
    title: '', description: '', price: 0, address: '', district: '', city: '',
    area: undefined, roomType: 'SINGLE', imageUrls: [], amenities: [],
    latitude: undefined, longitude: undefined,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    roomService.getById(Number(id)).then(room => {
      setForm({
        title: room.title, description: room.description ?? '', price: Number(room.price),
        address: room.address, district: room.district ?? '', city: room.city ?? '',
        area: room.area ?? undefined, roomType: room.roomType,
        imageUrls: room.imageUrls, amenities: room.amenities,
        latitude: room.latitude ?? undefined, longitude: room.longitude ?? undefined,
      });
    });
  }, [id, isEdit]);

  const set = (field: keyof FormState, value: any) => setForm(f => ({ ...f, [field]: value }));

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
    setGeocoding(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await resp.json();
      if (data.address) {
        const a = data.address;
        const addressStr = [a.house_number, a.road, a.suburb || a.quarter].filter(Boolean).join(' ');
        const districtStr = a.city_district || a.district || a.county || '';
        const cityStr = a.city || a.town || a.state || '';
        setForm(f => ({
          ...f,
          ...(addressStr ? { address: addressStr } : {}),
          ...(districtStr ? { district: districtStr } : {}),
          ...(cityStr ? { city: cityStr } : {}),
        }));
      }
    } catch {
      // Silently ignore reverse geocode errors
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await api.post('/upload/rooms', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls: string[] = res.data.data.urls;
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }));
    } catch {
      setError('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (url: string) => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter(u => u !== url) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.address || !form.city || form.price <= 0) {
      setError('Vui lòng điền đầy đủ tiêu đề, địa chỉ, thành phố và giá'); return;
    }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await roomService.update(Number(id), form);
      } else {
        await roomService.create(form);
      }
      navigate('/my-rooms');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const markerPos: [number, number] | null = form.latitude && form.longitude
    ? [form.latitude, form.longitude] : null;

  const mapCenter: [number, number] = markerPos ?? DEFAULT_CENTER;

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all";

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/my-rooms')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </button>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{isEdit ? 'Chỉnh sửa phòng' : 'Đăng phòng mới'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* Basic info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tiêu đề *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Phòng trọ đầy đủ nội thất quận 1" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              placeholder="Mô tả chi tiết về phòng, môi trường xung quanh..."
              className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại phòng *</label>
              <select value={form.roomType} onChange={e => set('roomType', e.target.value)} className={inputCls}>
                {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Diện tích (m²)</label>
              <input type="number" value={form.area ?? ''} onChange={e => set('area', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="VD: 25" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá thuê / tháng (VNĐ) *</label>
            <input type="number" value={form.price || ''} onChange={e => set('price', Number(e.target.value))}
              placeholder="VD: 3000000" className={inputCls} />
            {form.price > 0 && <p className="text-xs text-blue-500 mt-1">{Number(form.price).toLocaleString('vi-VN')}đ/tháng</p>}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Địa chỉ</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ cụ thể *</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Số nhà, tên đường..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quận/Huyện</label>
              <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="VD: Quận 1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thành phố *</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="VD: TP. Hồ Chí Minh" className={inputCls} />
            </div>
          </div>

          {/* Map Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                Vị trí trên bản đồ
                <span className="text-gray-400 font-normal">(click để chọn — tự điền địa chỉ)</span>
              </label>
              {markerPos && (
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, latitude: undefined, longitude: undefined }))}
                  className="text-xs text-red-400 hover:text-red-500 transition-colors">
                  Xóa vị trí
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600" style={{ height: '280px' }}>
              <MapContainer center={mapCenter} zoom={markerPos ? 15 : 12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {markerPos && <Marker position={markerPos} />}
              </MapContainer>
            </div>

            {geocoding && (
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <span className="inline-block w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                Đang lấy địa chỉ...
              </p>
            )}
            {markerPos && !geocoding && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Tọa độ: {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Hình ảnh</h2>
          <div className="flex flex-wrap gap-2">
            {form.imageUrls.map(url => (
              <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-6 h-6 text-gray-400" />}
              <span className="text-[10px] text-gray-400 mt-1">{uploading ? 'Đang upload' : 'Thêm ảnh'}</span>
              <input type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400">Ảnh đầu tiên sẽ là ảnh bìa. Tối đa 10 ảnh.</p>
        </div>

        {/* Amenities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button key={a.value} type="button" onClick={() => toggleAmenity(a.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.amenities.includes(a.value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/my-rooms')}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Hủy
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl disabled:opacity-60 transition-colors">
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng phòng'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostRoom;
