import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Building2, CalendarCheck, Eye, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/axios';

interface StatsData {
  totalRooms: number;
  availableRooms: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingsByMonth: { month: string; count: number }[];
  topRooms: { id: number; title: string; viewCount: number; status: string; price: number }[];
}

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function LandlordStats() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'LANDLORD') { navigate('/'); return; }
    api.get('/stats/landlord', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Lỗi tải thống kê'))
      .finally(() => setLoading(false));
  }, [user, token, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-red-500">{error}</div>
  );

  if (!stats) return null;

  const pieData = [
    { name: 'Chờ xác nhận', value: stats.pendingBookings },
    { name: 'Đã xác nhận', value: stats.confirmedBookings },
    { name: 'Hoàn thành', value: stats.completedBookings },
    { name: 'Đã hủy', value: stats.cancelledBookings },
  ].filter(d => d.value > 0);

  const summaryCards = [
    { label: 'Tổng phòng', value: stats.totalRooms, sub: `${stats.availableRooms} đang trống`, icon: Building2, color: 'blue' },
    { label: 'Tổng lịch hẹn', value: stats.totalBookings, sub: `${stats.pendingBookings} chờ xác nhận`, icon: CalendarCheck, color: 'purple' },
    { label: 'Hoàn thành', value: stats.completedBookings, sub: 'lượt xem phòng', icon: CheckCircle, color: 'green' },
    { label: 'Đã hủy', value: stats.cancelledBookings, sub: 'lịch hẹn', icon: XCircle, color: 'red' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        Thống kê của tôi
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              <div className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Bookings by month */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Lịch hẹn theo tháng (12 tháng gần nhất)
          </h2>
          {stats.bookingsByMonth.every(d => d.count === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.bookingsByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, 'Lịch hẹn']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Booking status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-500" />
            Trạng thái lịch hẹn
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Lịch hẹn']} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Rooms Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-green-500" />
          Top phòng được xem nhiều nhất
        </h2>
        {stats.topRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">#</th>
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Tên phòng</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Giá</th>
                  <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Trạng thái</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Lượt xem</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRooms.map((room, i) => (
                  <tr
                    key={room.id}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 text-gray-400 font-mono">{i + 1}</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200 font-medium max-w-[200px] truncate">{room.title}</td>
                    <td className="py-3 text-right text-blue-600 dark:text-blue-400 font-medium">{formatPrice(room.price)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        room.status === 'RENTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {room.status === 'AVAILABLE' ? 'Còn trống' : room.status === 'RENTED' ? 'Đang thuê' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 dark:text-white">{room.viewCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
