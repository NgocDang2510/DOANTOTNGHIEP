import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import RoomDetail from './pages/RoomDetail';
import MyRooms from './pages/MyRooms';
import PostRoom from './pages/PostRoom';
import MyBookings from './pages/MyBookings';
import IncomingBookings from './pages/IncomingBookings';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import SavedRooms from './pages/SavedRooms';
import LandlordStats from './pages/LandlordStats';
import ComparePage from './pages/ComparePage';
import PaymentResult from './pages/PaymentResult';
import MapPage from './pages/MapPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConfirmModal from './components/ConfirmModal';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';

function App() {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Public Routes — accessible without login */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/payment-result" element={<PaymentResult />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/my-rooms" element={<MyRooms />} />
              <Route path="/my-rooms/new" element={<PostRoom />} />
              <Route path="/my-rooms/:id/edit" element={<PostRoom />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/incoming-bookings" element={<IncomingBookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/saved" element={<SavedRooms />} />
              <Route path="/stats" element={<LandlordStats />} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <ConfirmModal />
    </>
  );
}

export default App;
