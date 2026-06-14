import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import { Phone, Lock, User, Check, Eye, EyeOff, GraduationCap, Home, Building2 } from 'lucide-react';

const StrengthBar = ({ password }: { password: string }) => {
  if (!password) return null;
  const rules = [
    { ok: password.length >= 6, label: 'Ít nhất 6 ký tự' },
    { ok: /[0-9]/.test(password), label: 'Có chữ số' },
    { ok: /[a-zA-Z]/.test(password), label: 'Có chữ cái' },
  ];
  const score = rules.filter(r => r.ok).length;
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh'];
  const textColors = ['', 'text-red-500', 'text-amber-500', 'text-green-600'];
  return (
    <div className="space-y-1.5 px-0.5">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
        <span className={`text-[11px] font-semibold ml-1 w-16 text-right ${textColors[score]}`}>{labels[score]}</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {rules.map((r, i) => (
          <span key={i} className={`flex items-center gap-1 text-[11px] ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
            <Check className={`w-3 h-3 ${r.ok ? 'opacity-100' : 'opacity-30'}`} />{r.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Register = () => {
  const [role, setRole] = useState<'STUDENT' | 'LANDLORD'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !fullName) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/auth/register', { phone, password, fullName, role });
      if (data.success) {
        navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
      } else {
        setError(data.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all";

  return (
    <div className="w-full max-w-[820px] p-2 sm:p-4" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="flex rounded-2xl overflow-hidden shadow-2xl shadow-black/20" style={{ minHeight: 520 }}>

        {/* Left branding */}
        <div className="hidden md:flex w-[42%] flex-shrink-0 flex-col justify-between bg-gradient-to-b from-blue-600 to-blue-800 p-9">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-lg font-bold">SmartAccommodation</span>
          </div>
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="text-center space-y-6">
              <div className="flex gap-6 justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold">Sinh viên</span>
                  <span className="text-blue-200 text-[10px] text-center leading-tight">Tìm phòng<br />phù hợp</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold">Chủ nhà</span>
                  <span className="text-blue-200 text-[10px] text-center leading-tight">Đăng phòng<br />cho thuê</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-bold">Tạo tài khoản,</p>
            <p className="text-blue-200 text-sm">bắt đầu tìm kiếm ngay hôm nay.</p>
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-lg">
          <div className="px-8 pt-7 pb-1">
            <h2 className="text-base font-bold text-gray-900">Tạo tài khoản mới</h2>
            <p className="text-xs text-gray-500 mt-0.5">Điền thông tin bên dưới để đăng ký</p>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 py-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{error}
                </div>
              )}

              {/* Role selector */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Bạn là:</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'STUDENT', label: 'Sinh viên', sub: 'Tìm phòng trọ', icon: GraduationCap },
                    { value: 'LANDLORD', label: 'Chủ nhà', sub: 'Đăng phòng cho thuê', icon: Home },
                  ] as const).map(({ value, label, sub, icon: Icon }) => (
                    <button
                      key={value} type="button" onClick={() => setRole(value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${role === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${role === value ? 'bg-blue-500' : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${role === value ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${role === value ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                        <p className={`text-[10px] ${role === value ? 'text-blue-500' : 'text-gray-400'}`}>{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" placeholder="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type={showPw ? 'text' : 'password'} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <StrengthBar password={password} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-blue-200">
                {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
              </button>

              <p className="text-center text-xs text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link>
              </p>
            </form>
          </div>

          <div className="px-8 py-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center">© {new Date().getFullYear()} Smart Accommodation Finder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
