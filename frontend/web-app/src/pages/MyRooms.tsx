import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Home, MapPin, Star, User, Phone, Mail } from 'lucide-react';
import { roomService, type RoomResponse } from '../services/roomService';
import { useConfirmStore } from '../stores/confirmStore';
import { useAuthStore } from '../stores/authStore';
import api from '../services/axios';

interface TenantInfo {
  name: string;
  phone: string;
  email: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: 'Còn trống', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  RENTED: { label: 'Đang thuê', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  HIDDEN: { label: 'Đã ẩn', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  MAINTENANCE: { label: 'Bảo trì', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const MyRooms = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const confirm = useConfirmStore(s => s.showConfirm);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [tenants, setTenants] = useState<Record<number, TenantInfo>>({});
  const [changingStatus, setChangingStatus] = useState<number | null>(null);

  const loadTenant = async (roomId: number) => {
    try {
      const res = await api.get(`/rooms/${roomId}/tenant`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.data) {
        setTenants(prev => ({ ...prev, [roomId]: res.data.data }));
      }
    } catch { /* ignore */ }
  };

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await roomService.getMyRooms(p);
      setRooms(res.content);
      setTotalPages(res.totalPages);
      res.content.filter(r => r.status === 'RENTED').forEach(r => loadTenant(r.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm(
      `Bạn có chắc muốn xóa phòng "${title}"? Hành động này không thể hoàn tác.`,
      { title: 'Xóa phòng', confirmText: 'Xóa', cancelText: 'Hủy', isDanger: true }
    );
    if (ok) {
      await roomService.delete(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleChangeStatus = async (room: RoomResponse, newStatus: string) => {
    if (newStatus === room.status || changingStatus === room.id) return;
    setChangingStatus(room.id);
    try {
      const updated = await roomService.changeStatus(room.id, newStatus);
      setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch { /* silent */ } finally {
      setChangingStatus(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Phòng của tôi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Quản lý danh sách phòng cho thuê</p>
        </div>
        <button onClick={() => navigate('/my-rooms/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Đăng phòng mới
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Home className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Bạn chưa có phòng nào</p>
          <button onClick={() => navigate('/my-rooms/new')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Đăng phòng đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex">
                <div className="w-32 flex-shrink-0 bg-gray-200 dark:bg-gray-700 overflow-hidden" style={{ minHeight: '7rem' }}>
                  {room.imageUrls.length > 0
                    ? <img src={room.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-gray-300" /></div>}
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{room.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[room.status]?.cls}`}>
                        {STATUS_LABELS[room.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{room.district ? `${room.district}, ` : ''}{room.city}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
                      {room.averageRating != null && (
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {room.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => navigate(`/rooms/${room.id}`)} title="Xem"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(`/my-rooms/${room.id}/edit`)} title="Chỉnh sửa"
                      className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <select
                      value={room.status}
                      disabled={changingStatus === room.id}
                      onChange={e => handleChangeStatus(room, e.target.value)}
                      title="Đổi trạng thái"
                      className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:border-blue-300 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
                    >
                      <option value="AVAILABLE">Còn trống</option>
                      <option value="RENTED">Đang thuê</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="HIDDEN">Ẩn</option>
                    </select>
                    <button onClick={() => handleDelete(room.id, room.title)} title="Xóa"
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thông tin người thuê — chỉ hiển thị khi RENTED */}
              {room.status === 'RENTED' && tenants[room.id] && (
                <div className="mx-4 mb-4 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1.5">Người đang thuê</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                      <User className="w-3 h-3 text-blue-400" /> {tenants[room.id].name}
                    </span>
                    {tenants[room.id].phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                        <Phone className="w-3 h-3 text-blue-400" /> {tenants[room.id].phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                      <Mail className="w-3 h-3 text-blue-400" /> {tenants[room.id].email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${i === page ? 'bg-blue-600 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRooms;
