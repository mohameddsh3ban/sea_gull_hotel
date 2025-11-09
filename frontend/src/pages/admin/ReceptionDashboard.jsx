import React from 'react';
import ReservationsTable from '../../components/ReservationsTable'; // Adjust path

const ReceptionDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reception Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all restaurant reservations for reception.</p>
      </header>
      <ReservationsTable userRole="reception" />
    </div>
  );
};

export default ReceptionDashboard;
