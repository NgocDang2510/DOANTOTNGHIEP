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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">SAF</span>
            </NavLink>

            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
              }>
                <Home className="w-4 h-4" />
                <span className="hidden sm:block">Tìm phòng</span>
              </NavLink>

              <NavLink to="/map" className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
              }>
                <Map className="w-4 h-4" />
                <span className="hidden sm:block">Bản đồ</span>
              </NavLink>

              {isLandlord && (
                <>
                  <NavLink to="/my-rooms" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
                  }>
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:block">Phòng của tôi</span>
                  </NavLink>
                  <NavLink to="/incoming-bookings" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
                  }>
                    <CalendarCheck className="w-4 h-4" />
                    <span className="hidden sm:block">Lịch hẹn đến</span>
                  </NavLink>
                  <NavLink to="/stats" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
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
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
                  }>
                    <BookMarked className="w-4 h-4" />
                    <span className="hidden sm:block">Lịch hẹn của tôi</span>
                  </NavLink>
                  <NavLink to="/saved" className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
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
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
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
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
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
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {user && <NotificationBell />}

              {user ? (
                <>
                  <NavLink to="/profile" className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`
                  }>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <span className="hidden md:block max-w-[100px] truncate">{user.fullName || 'Hồ sơ'}</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
