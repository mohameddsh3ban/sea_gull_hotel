import React from 'react';
import ReservationsTable from '../../components/ReservationsTable'; // Adjust path

const AccountingDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Accounting Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all restaurant reservations for accounting.</p>
      </header>
      <ReservationsTable userRole="accounting" />
    </div>
  );
};

export default AccountingDashboard;
