import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Phone, Check, X, CheckCheck, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { bookingService, type BookingResponse } from '../services/bookingService';
import { useAuthStore } from '../stores/authStore';
import api from '../services/axios';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Đã xem phòng', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

const IncomingBookings = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [depositStatus, setDepositStatus] = useState<Record<number, string>>({});
  const [earlyConfirmId, setEarlyConfirmId] = useState<number | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({});

  const setCardError = (id: number, msg: string) => {
    setCardErrors(prev => ({ ...prev, [id]: msg }));
    setTimeout(() => setCardErrors(prev => { const n = { ...prev }; delete n[id]; return n; }), 4000);
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

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await bookingService.getIncoming(p);
      setBookings(res.content);
      setTotalPages(res.totalPages);
      res.content.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').forEach(b => loadDepositStatus(b.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const update = (updated: BookingResponse) => setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));

  const handleAction = async (id: number, action: 'confirm' | 'cancel' | 'complete') => {
    setActionLoading(id);
    try {
      let updated: BookingResponse;
      if (action === 'confirm') updated = await bookingService.confirm(id);
      else if (action === 'cancel') updated = await bookingService.cancel(id);
      else updated = await bookingService.complete(id);
      update(updated);
    } catch (err: any) {
      setCardError(id, err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lịch hẹn đến</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Quản lý lịch hẹn xem phòng từ sinh viên</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <CalendarDays className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có lịch hẹn nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-start justify-between gap-3 flex-wrap p-4">
                <div className="min-w-0">
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
                        <CheckCircle2 className="w-3 h-3" /> Đã cọc
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{b.roomAddress}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">{b.studentName}</span>
                      <span className="text-gray-400">({b.studentPhone})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(b.scheduledAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  {b.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{b.note}"</p>}
                </div>

                {b.status === 'PENDING' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(b.id, 'confirm')} disabled={actionLoading === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-60 transition-colors">
                      <Check className="w-3.5 h-3.5" /> Xác nhận
                    </button>
                    <button onClick={() => handleAction(b.id, 'cancel')} disabled={actionLoading === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors">
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                )}
                {b.status === 'CONFIRMED' && (
                  earlyConfirmId === b.id ? (
                    <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2.5 text-right max-w-[220px]">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 leading-snug">
                        Chưa đến ngày hẹn.<br/>Sinh viên đã đến sớm hơn?
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEarlyConfirmId(null)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          Hủy
                        </button>
                        <button
                          onClick={() => { setEarlyConfirmId(null); handleAction(b.id, 'complete'); }}
                          disabled={actionLoading === b.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition-colors">
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (new Date(b.scheduledAt) > new Date()) {
                          setEarlyConfirmId(b.id);
                        } else {
                          handleAction(b.id, 'complete');
                        }
                      }}
                      disabled={actionLoading === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold disabled:opacity-60 transition-colors flex-shrink-0">
                      <CheckCheck className="w-3.5 h-3.5" /> Đã xem xong
                    </button>
                  )
                )}
              </div>
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

export default IncomingBookings;
