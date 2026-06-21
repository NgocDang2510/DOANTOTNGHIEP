import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Building2, CalendarCheck, BookMarked, User, LogOut, Shield, MessageCircle, Heart, BarChart2, Map } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useChatSocket } from '../hooks/useChatSocket';
import AiChatWidget from '../components/AiChatWidget';
import NotificationBell from '../components/NotificationBell';
import CompareBar from '../components/CompareBar';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const isLandlord = user?.role === 'LANDLORD';
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  const isOnChatPage = location.pathname.startsWith('/chat');

  const handleGlobalMessage = useCallback(() => {
    if (!isOnChatPage) setUnreadCount(prev => prev + 1);
  }, [isOnChatPage]);

  useChatSocket((isStudent || isLandlord) ? handleGlobalMessage : undefined);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/60 to-violet-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[800px] h-[800px] bg-blue-100/70 dark:bg-blue-950/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-60 w-[600px] h-[600px] bg-indigo-100/60 dark:bg-indigo-950/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 right-1/4 w-[500px] h-[500px] bg-violet-100/50 dark:bg-violet-950/20 rounded-full blur-3xl" />
      </div>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 border-b border-white/10 dark:border-gray-700 shadow-lg shadow-blue-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">SAF</span>
            </NavLink>

            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}`
              }>
                <Home className="w-4 h-4" />
                <span className="hidden sm:block">Tìm phòng</span>
              </NavLink>

              <NavLink to="/map" className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}`
              }>
                <Map className="w-4 h-4" />
                <span className="hidden sm:block">Bản đồ</span>
              </NavLink>

              {isLandlord && (
                <>
                  <NavLink to="/my-rooms" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }>
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:block">Phòng của tôi</span>
                  </NavLink>
                  <NavLink to="/incoming-bookings" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }>
                    <CalendarCheck className="w-4 h-4" />
                    <span className="hidden sm:block">Lịch hẹn đến</span>
                  </NavLink>
                  <NavLink to="/stats" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }>
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:block">Thống kê</span>
                  </NavLink>
                </>
              )}

              {isStudent && (
                <>
                  <NavLink to="/my-bookings" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }>
                    <BookMarked className="w-4 h-4" />
                    <span className="hidden sm:block">Lịch hẹn của tôi</span>
                  </NavLink>
                  <NavLink to="/saved" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }>
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:block">Đã lưu</span>
                  </NavLink>
                </>
              )}

              {(isStudent || isLandlord) && (
                <NavLink
                  to="/chat"
                  onClick={() => setUnreadCount(0)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                  }
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:block">Tin nhắn</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                }>
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:block">Admin</span>
                </NavLink>
              )}
            </nav>

            {/* Right: Profile + theme + logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {user && <NotificationBell />}

              {user ? (
                <>
                  <NavLink to="/profile" className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'}`
                  }>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden md:block max-w-[100px] truncate">{user.fullName || 'Hồ sơ'}</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 text-sm font-medium bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors shadow-sm">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* AI Chat Widget */}
      <AiChatWidget />

      {/* Compare Bar */}
      <CompareBar />
    </div>
  );
};

export default MainLayout;
