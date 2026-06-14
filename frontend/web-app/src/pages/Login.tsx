import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../services/axios';
import { useAuthStore } from '../stores/authStore';
import { Phone, Lock, Mail, Building2 } from 'lucide-react';

type Mode = 'password' | 'forgot_1' | 'forgot_1_5' | 'forgot_2';

const Login = () => {
  const [mode, setMode] = useState<Mode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const from = (location.state as any)?.from || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/auth/login', { phone, password });
      if (data.success) {
        sessionStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) sessionStorage.setItem('refreshToken', data.data.refreshToken);
        const profileRes = await axios.get('/users/profile');
        const profile = profileRes.data.data;
        setAuth(profile, data.data.accessToken);
        navigate(profile.role === 'ADMIN' ? '/admin' : (from || '/'));
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) { setError('Vui lòng nhập số điện thoại'); return; }
    setLoading(true); setError('');
    try {
      const payload: any = { phone };
      if (mode === 'forgot_1_5') payload.email = email;
      const { data } = await axios.post('/auth/forgot-password/send-otp', payload);
      if (data.success) {
        setMode('forgot_2');
        setSuccess(data.message || 'Mã OTP đã được gửi đến email của bạn');
      } else {
        setError(data.message || 'Không thể gửi mã OTP');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message;
      if (errMsg === 'REQUIRE_EMAIL') {
        setMode('forgot_1_5');
        setError('Tài khoản chưa liên kết email. Vui lòng nhập email để nhận OTP.');
      } else {
        setError(errMsg || 'Số điện thoại không tồn tại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) { setError('Vui lòng nhập mã OTP và mật khẩu mới'); return; }
    setLoading(true); setError('');
    try {
      const payload: any = { phone, otp, newPassword };
      if (email) payload.email = email;
      const { data } = await axios.post('/auth/forgot-password/reset', payload);
      if (data.success) {
        setSuccess('Đặt lại mật khẩu thành công!');
        setTimeout(() => { setMode('password'); setSuccess(''); }, 2000);
      } else {
        setError(data.message || 'Không thể đổi mật khẩu');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900 placeholder-gray-400";

  return (
    <div className="w-full max-w-[820px] p-2 sm:p-4" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="flex rounded-2xl overflow-hidden shadow-2xl shadow-black/20" style={{ minHeight: 480 }}>

        {/* Left branding */}
        <div className="hidden md:flex w-[42%] flex-shrink-0 flex-col justify-between bg-gradient-to-b from-blue-600 to-blue-800 p-9">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-lg font-bold">SmartAccommodation</span>
          </div>
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <div>
                <p className="text-white text-xl font-bold">Tìm phòng dễ dàng</p>
                <p className="text-blue-200 text-sm mt-1">Kết nối sinh viên với chủ nhà uy tín</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-blue-200 text-xs text-center">Nền tảng tìm kiếm nhà trọ thông minh</p>
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-lg">
          <div className="flex-1 flex flex-col justify-center px-8 py-8">

            {mode === 'password' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>
                  <p className="text-sm text-gray-500 mt-1">Chào mừng bạn trở lại!</p>
                </div>

                {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{error}</div>}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setMode('forgot_1'); setError(''); }} className="text-xs text-blue-600 hover:underline font-medium">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-blue-200">
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>
                <p className="text-center text-xs text-gray-500 mt-5">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-blue-600 font-bold hover:underline">Đăng ký ngay</Link>
                </p>
              </>
            )}

            {(mode === 'forgot_1' || mode === 'forgot_1_5') && (
              <>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Quên mật khẩu</h2>
                  <p className="text-sm text-gray-500 mt-1">Khôi phục quyền truy cập tài khoản</p>
                </div>
                {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{error}</div>}
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} disabled={mode === 'forgot_1_5'} className={`${inputCls} ${mode === 'forgot_1_5' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  </div>
                  {mode === 'forgot_1_5' && (
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" placeholder="Email nhận mã OTP" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setMode('password'); setError(''); }} className="w-1/3 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm rounded-xl transition-all">Hủy</button>
                    <button type="submit" disabled={loading} className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60">{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</button>
                  </div>
                </form>
              </>
            )}

            {mode === 'forgot_2' && (
              <>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
                </div>
                {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{error}</div>}
                {success && <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-100 text-green-600 px-3.5 py-2.5 rounded-xl text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />{success}</div>}
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <input type="text" placeholder="Mã OTP 6 số" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900 text-center tracking-widest font-bold" />
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setMode('forgot_1'); setError(''); setSuccess(''); }} className="w-1/3 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm rounded-xl transition-all">Quay lại</button>
                    <button type="submit" disabled={loading} className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60">{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="px-8 py-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center">
              © {new Date().getFullYear()} Smart Accommodation Finder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
