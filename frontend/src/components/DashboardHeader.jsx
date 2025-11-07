import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardHeader = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) onLogout();

    // Clear all tokens
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('receptionToken');
    sessionStorage.removeItem('accountingToken');
    sessionStorage.removeItem('kitchenToken');

    // Redirect to the correct login page based on current section
    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/login');
    } else if (location.pathname.startsWith('/reception')) {
      navigate('/reception/login');
    } else if (location.pathname.startsWith('/accounting')) {
      navigate('/accounting/login');
    } else if (location.pathname.startsWith('/kitchen')) {
      navigate('/kitchen/login');
    } else {
      navigate('/'); // fallback
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 shadow px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        {/* ✅ leading slash ensures it looks inside /public/images */}
        <img src="/images/seagullwhite.png" alt="BookEasy" className="h-10 w-auto" />
        <span className="font-semibold text-white">BookEasy</span>
      </div>

      {/* Right side */}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-sm"
      >
        Logout
      </button>
    </header>
  );
};

export default DashboardHeader;
