import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Phone, Mail, Lock, Camera } from 'lucide-react';
import api from '../services/axios';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const roleLabel: Record<string, string> = { STUDENT: 'Sinh viên', LANDLORD: 'Chủ nhà', ADMIN: 'Quản trị viên' };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true); setProfileMsg('');
    try {
      const res = await api.put('/users/profile', { fullName, email: email || null });
      setUser(res.data.data);
      setProfileMsg('✓ Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setProfileMsg(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) { setPwMsg('Vui lòng điền đầy đủ'); return; }
    if (newPassword.length < 6) { setPwMsg('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    setPwLoading(true); setPwMsg('');
    try {
      await api.put('/users/password', { oldPassword, newPassword });
      setPwMsg('✓ Đổi mật khẩu thành công!');
      setOldPassword(''); setNewPassword('');
    } catch (err: any) {
      setPwMsg(err?.response?.data?.message || 'Mật khẩu hiện tại không đúng');
    } finally {
      setPwLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const avatarUrl = res.data.data.url;
      await api.put('/users/profile', { fullName: user?.fullName, avatarUrl });
      setUser({ ...user, avatarUrl });
    } catch {
      alert('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>

      {/* Avatar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden flex items-center justify-center">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-blue-500" />}
          </div>
          <label className={`absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {uploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{user?.fullName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.phone}</p>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
            {roleLabel[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Thông tin cá nhân</h2>
        {profileMsg && (
          <div className={`mb-3 text-xs px-3 py-2 rounded-xl ${profileMsg.startsWith('✓') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800'}`}>
            {profileMsg}
          </div>
        )}
        <form onSubmit={handleUpdateProfile} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={user?.phone || ''} disabled className={`${inputCls} pl-9 opacity-60 cursor-not-allowed`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={`${inputCls} pl-9`} />
            </div>
          </div>
          <button type="submit" disabled={profileLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl disabled:opacity-60 transition-colors">
            {profileLoading ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Đổi mật khẩu</h2>
        {pwMsg && (
          <div className={`mb-3 text-xs px-3 py-2 rounded-xl ${pwMsg.startsWith('✓') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800'}`}>
            {pwMsg}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mật khẩu hiện tại</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${inputCls} pl-9`} />
            </div>
          </div>
          <button type="submit" disabled={pwLoading}
            className="w-full py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-sm rounded-xl disabled:opacity-60 transition-colors">
            {pwLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
