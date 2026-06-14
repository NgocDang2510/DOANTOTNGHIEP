import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, Star, Home, Wifi, Wind, WashingMachine, Car, Bath, ChefHat, Refrigerator, Camera, Building, Heart, ChevronLeft, ChevronRight, CalendarDays, User, Share2, X, Copy, Check } from 'lucide-react';
import { roomService, type RoomResponse } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { reviewService, type ReviewResponse } from '../services/reviewService';
import { useAuthStore } from '../stores/authStore';
import { useViewHistory } from '../hooks/useViewHistory';

const AMENITY_ICONS: Record<string, any> = {
  WIFI: Wifi, AIR_CONDITIONER: Wind, WASHING_MACHINE: WashingMachine, PARKING: Car,
  PRIVATE_BATHROOM: Bath, KITCHEN: ChefHat, FRIDGE: Refrigerator, SECURITY_CAMERA: Camera,
  ELEVATOR: Building, PET_ALLOWED: Heart,
};
const AMENITY_LABELS: Record<string, string> = {
  WIFI: 'WiFi', AIR_CONDITIONER: 'Điều hòa', WASHING_MACHINE: 'Máy giặt', PARKING: 'Chỗ để xe',
  PRIVATE_BATHROOM: 'WC riêng', KITCHEN: 'Bếp', FRIDGE: 'Tủ lạnh', SECURITY_CAMERA: 'Camera',
  ELEVATOR: 'Thang máy', PET_ALLOWED: 'Nuôi thú cưng',
};
const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Phòng đơn', SHARED: 'Ở ghép', APARTMENT: 'Căn hộ mini', HOUSE: 'Nhà nguyên căn',
};

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`w-5 h-5 cursor-pointer transition-colors ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        onClick={() => onChange?.(i)} />
    ))}
  </div>
);

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { addToHistory } = useViewHistory();

  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    action();
  };
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');

  // Review form
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // QR Share
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const roomUrl = `${window.location.origin}/rooms/${id}`;

  const handleShare = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(roomUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#1e3a8a', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch {
      // Fallback: just open share modal without QR
      setShowQR(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [r, rev] = await Promise.all([
          roomService.getById(Number(id)),
          reviewService.getRoomReviews(Number(id)),
        ]);
        setRoom(r);
        setReviews(rev.content);
        addToHistory({
          id: r.id,
          title: r.title,
          price: Number(r.price),
          imageUrl: r.imageUrls[0] || '',
          city: r.city,
          district: r.district,
          roomType: r.roomType,
          viewedAt: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const minBookingDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  })();

  const handleBook = async () => {
    if (!scheduledAt) { setBookingMsg('Vui lòng chọn ngày giờ hẹn'); return; }
    if (new Date(scheduledAt) < new Date(minBookingDate)) {
      setBookingMsg('Ngày hẹn phải cách ngày hiện tại ít nhất 3 ngày');
      return;
    }
    setBookingLoading(true); setBookingMsg('');
    try {
      await bookingService.create(Number(id), scheduledAt, note || undefined);
      setBookingMsg('✓ Đặt lịch xem phòng thành công! Chờ chủ nhà xác nhận.');
      setShowBooking(false);
      setScheduledAt(''); setNote('');
    } catch (err: any) {
      setBookingMsg(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      const rv = await reviewService.create(Number(id), rating, comment || undefined);
      setReviews(prev => [rv, ...prev]);
      setShowReview(false);
      setComment('');
    } catch (err: any) {
      setReviewError(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
  if (!room) return <div className="text-center py-20 text-gray-500">Không tìm thấy phòng</div>;

  const isStudent = user?.role === 'STUDENT';
  const isOwner = user?.id === room.landlordId;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Image gallery */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 mb-6" style={{ height: 400 }}>
        {room.imageUrls.length > 0 ? (
          <img src={room.imageUrls[imgIndex]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-20 h-20 text-gray-300" />
          </div>
        )}
        {room.imageUrls.length > 1 && (
          <>
            <button onClick={() => setImgIndex(i => (i - 1 + room.imageUrls.length) % room.imageUrls.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setImgIndex(i => (i + 1) % room.imageUrls.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {room.imageUrls.map((_, i) => (
                <div key={i} onClick={() => setImgIndex(i)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-all ${i === imgIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
        <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {ROOM_TYPE_LABELS[room.roomType]}
        </span>
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Chia sẻ
        </button>
      </div>

      {/* QR Share Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Chia sẻ phòng</h3>
              <button onClick={() => setShowQR(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* QR Code */}
            {qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Quét để mở phòng này</p>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <Share2 className="w-12 h-12 text-gray-300" />
              </div>
            )}

            {/* Room title */}
            <p className="text-center text-sm font-semibold text-gray-800 dark:text-white mt-4 line-clamp-2 px-2">
              {room.title}
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              {room.district ? `${room.district}, ` : ''}{room.city}
            </p>

            {/* URL copy */}
            <div className="flex gap-2 mt-4">
              <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 dark:text-gray-400 truncate">
                {roomUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {copied ? <><Check className="w-3.5 h-3.5" />Đã copy</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{room.title}</h1>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{room.address}{room.district ? `, ${room.district}` : ''}{room.city ? `, ${room.city}` : ''}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-2xl font-bold text-blue-600">{Number(room.price).toLocaleString('vi-VN')}đ<span className="text-sm font-normal text-gray-500">/tháng</span></span>
              {room.area && <span className="text-gray-500 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{room.area}m²</span>}
              {room.averageRating != null && (
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {room.averageRating.toFixed(1)} ({room.reviewCount} đánh giá)
                </span>
              )}
            </div>
          </div>

          {room.description && (
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-2">Mô tả</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{room.description}</p>
            </div>
          )}

          {room.amenities.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">Tiện ích</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.amenities.map(a => {
                  const Icon = AMENITY_ICONS[a] || Home;
                  return (
                    <div key={a} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{AMENITY_LABELS[a] || a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Đánh giá ({reviews.length})</h2>
              {isStudent && (
                <button onClick={() => setShowReview(v => !v)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  + Viết đánh giá
                </button>
              )}
            </div>

            {showReview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4 space-y-3">
                <StarRating value={rating} onChange={setRating} />
                {reviewError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                    <span className="text-xs text-red-600 dark:text-red-400">{reviewError}</span>
                  </div>
                )}
                <textarea value={comment} onChange={e => { setComment(e.target.value); setReviewError(''); }} placeholder="Nhận xét của bạn..."
                  rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowReview(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
                  <button onClick={handleReview} disabled={reviewLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
                    {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có đánh giá nào</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(rv => (
                  <div key={rv.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      {rv.studentAvatarUrl
                        ? <img src={rv.studentAvatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <User className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{rv.studentName}</span>
                        <StarRating value={rv.rating} />
                        <span className="text-xs text-gray-400">{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {rv.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{rv.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Landlord card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                  {room.landlordAvatarUrl
                    ? <img src={room.landlordAvatarUrl} alt="" className="w-full h-full object-cover" />
                    : <User className="w-6 h-6 text-blue-500" />}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{room.landlordName}</p>
                <p className="text-xs text-green-500 font-medium">Đang hoạt động</p>
              </div>
            </div>

            {!isOwner && (
              <div className="p-3 space-y-2">
                {/* Chat button — primary action */}
                <button
                  onClick={() => requireAuth(async () => {
                    const { chatService } = await import('../services/chatService');
                    const conv = await chatService.getOrCreateConversation(
                      user!.id, room.landlordId, room.landlordName, room.landlordAvatarUrl
                    );
                    navigate(`/chat/${conv.conversationId}`);
                  })}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat với chủ nhà
                </button>

                {/* Phone button */}
                <a
                  href={`tel:${room.landlordPhone}`}
                  className="w-full py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {room.landlordPhone}
                </a>
              </div>
            )}
          </div>

          {/* Booking card — show for all non-owners (auth-gated on action) */}
          {!isOwner && room.status === 'AVAILABLE' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Đặt lịch xem phòng</h3>
              {bookingMsg && (
                <div className={`mb-3 text-xs px-3 py-2 rounded-xl ${bookingMsg.startsWith('✓') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {bookingMsg}
                </div>
              )}
              {!showBooking ? (
                <button onClick={() => requireAuth(() => setShowBooking(true))}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Đặt lịch hẹn
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Thời gian hẹn xem</label>
                    <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                      min={minBookingDate}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    <p className="text-[11px] text-gray-400 mt-1">Ngày hẹn phải cách hôm nay ít nhất 3 ngày</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Ghi chú (tùy chọn)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Yêu cầu đặc biệt..." rows={2}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowBooking(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
                    <button onClick={handleBook} disabled={bookingLoading}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-colors">
                      {bookingLoading ? 'Đang gửi...' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <button onClick={() => navigate(`/my-rooms/${id}/edit`)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors">
              Chỉnh sửa phòng này
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
