// frontend/src/pages/admin/AdminDashboard.jsx

import React from 'react';
import ReservationsTable from '../../components/ReservationsTable';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all restaurant reservations.</p>
      </header>
      <ReservationsTable userRole="admin" />
    </div>
  );
};

export default AdminDashboard;
