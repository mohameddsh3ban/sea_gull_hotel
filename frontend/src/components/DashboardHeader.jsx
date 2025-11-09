// File: frontend/src/components/DashboardHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth"; // <-- IMPORT THIS
import { auth } from "../firebase";     // <-- IMPORT THIS

const DashboardHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // <-- USE FIREBASE SIGNOUT
      navigate('/login');  // <-- REDIRECT TO LOGIN
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if it fails, try to redirect
      navigate('/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 shadow px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
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