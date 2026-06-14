import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-500 to-indigo-600" />

      {/* Decorative blurred circles */}
      <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full flex items-center justify-center relative z-20">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
