import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, X, ExternalLink, BookMarked, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { bookingService, type BookingResponse } from '../services/bookingService';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import api from '../services/axios';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Đã xem phòng', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [depositStatus, setDepositStatus] = useState<Record<number, string>>({});
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({});

  const setCardError = (id: number, msg: string) => {
    setCardErrors(prev => ({ ...prev, [id]: msg }));
    setTimeout(() => setCardErrors(prev => { const n = { ...prev }; delete n[id]; return n; }), 4000);
  };

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await bookingService.getMyBookings(p);
      setBookings(res.content);
      setTotalPages(res.totalPages);
      res.content.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').forEach(b => loadDepositStatus(b.id));
    } finally {
      setLoading(false);
    }
  };

  const loadDepositStatus = async (bookingId: number) => {
    try {
      const res = await api.get(`/payments/booking/${bookingId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.data) {
        setDepositStatus(prev => ({ ...prev, [bookingId]: res.data.data.status }));
      }
    } catch { /* no payment yet */ }
  };

  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    const bookingTypes = ['booking_completed', 'booking_confirmed', 'booking_cancelled'];
    if (bookingTypes.includes(latest.type)) load(page);
  }, [notifications.length]);

  const handleCancel = async (id: number) => {
    setCancelConfirmId(null);
    setCancellingId(id);
    try {
      const updated = await bookingService.cancel(id);
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err: any) {
      setCardError(id, err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeposit = async (bookingId: number) => {
    setPayingId(bookingId);
    try {
      const res = await api.post(`/payments/booking/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payUrl = res.data.data?.payUrl;
      if (payUrl) window.location.href = payUrl;
    } catch (err: any) {
      setCardError(bookingId, err?.response?.data?.message || 'Không thể tạo thanh toán');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lịch hẹn của tôi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Theo dõi lịch hẹn xem phòng của bạn</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <BookMarked className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Bạn chưa có lịch hẹn nào</p>
          <button onClick={() => navigate('/')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Tìm phòng ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex">
                {b.roomImageUrl && (
                  <div className="w-28 flex-shrink-0 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <img src={b.roomImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-4 flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button onClick={() => navigate(`/rooms/${b.roomId}`)}
                        className="font-bold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                        {b.roomTitle} <ExternalLink className="w-3 h-3" />
                      </button>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_MAP[b.status]?.cls}`}>
                        {STATUS_MAP[b.status]?.label}
                      </span>
                      {depositStatus[b.id] === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" /> Đã đặt cọc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{b.roomAddress}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(b.scheduledAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <span className="text-xs text-gray-400">Chủ nhà: {b.landlordName} ({b.landlordPhone})</span>
                    </div>
                    {b.note && <p className="text-xs text-gray-400 mt-1 italic">"{b.note}"</p>}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {b.status === 'COMPLETED' && depositStatus[b.id] !== 'SUCCESS' && b.roomStatus !== 'RENTED' && (
                      <button
                        onClick={() => handleDeposit(b.id)}
                        disabled={payingId === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-60 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {payingId === b.id ? 'Đang xử lý...' : 'Đặt cọc'}
                      </button>
                    )}
                    {b.status === 'COMPLETED' && depositStatus[b.id] !== 'SUCCESS' && b.roomStatus === 'RENTED' && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">Phòng đã có người thuê</span>
                    )}

                    {/* Cancel — inline confirm */}
                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                      cancelConfirmId === b.id ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2 text-right">
                          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Xác nhận hủy lịch hẹn này?</p>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setCancelConfirmId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              Không
                            </button>
                            <button onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 transition-colors">
                              Hủy lịch
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setCancelConfirmId(b.id)} disabled={cancellingId === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors">
                          <X className="w-3.5 h-3.5" /> Hủy
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Inline error per card */}
              {cardErrors[b.id] && (
                <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{cardErrors[b.id]}</p>
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

export default MyBookings;
