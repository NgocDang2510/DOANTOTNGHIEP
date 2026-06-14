import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const formatAmount = (raw: string | null) => {
  if (!raw) return '';
  const vnd = parseInt(raw) / 100;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd);
};

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get('status');
  const amount = params.get('amount');
  const txnRef = params.get('txnRef');

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đặt cọc thành công!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Giao dịch của bạn đã được xử lý thành công.
            </p>
            {amount && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Số tiền đặt cọc</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatAmount(amount)}</p>
              </div>
            )}
            {txnRef && (
              <p className="text-xs text-gray-400 mb-6">Mã giao dịch: {txnRef}</p>
            )}
          </>
        ) : isFailed ? (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Có lỗi xảy ra</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Không thể xác nhận trạng thái thanh toán. Vui lòng liên hệ hỗ trợ.
            </p>
          </>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/my-bookings')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Xem lịch hẹn
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
