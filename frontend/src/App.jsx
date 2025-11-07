// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';


import GuestHome from './pages/GuestHome';
import ReservationForm from './pages/ReservationForm';
import Confirmation from './pages/Confirmation';

import AdminDashboard from './pages/admin/AdminDashboard';
import EditReservation from './pages/admin/EditReservation';
import ManageCapacities from './pages/admin/ManageCapacities';
import CapacitiesOverview from './pages/admin/CapacitiesOverview';
import UploadGuestList from './pages/admin/UploadGuestList';
import Reviews from './pages/admin/Reviews';



import ReceptionDashboard from './pages/admin/ReceptionDashboard';
import AccountingDashboard from './pages/admin/AccountingDashboard';
import KitchenDashboard from './pages/admin/KitchenDashboard';

// NEW: one login + protected route
import Login from './pages/admin/Login';               // <-- if you kept it as AdminLogin.jsx, rename file to Login.jsx and update this import
import ProtectedRoute from './components/ProtectedRoute';

import DashboardHeader from './components/DashboardHeader';



import Header from './components/Header';
import AdminHeader from './components/adminheader';
import AuthLayout from './components/AuthLayout';
import Footer from './components/Footer';
import About from './pages/About';
import Contact from './pages/Contact';
import GuestCancel from './pages/GuestCancel';
import ReviewPage from './pages/Review';


const AppRoutes = () => {

  const location = useLocation();


  // ---- Which section are we on? ----
  const isAdminPage = location.pathname.startsWith('/admin');
  const isReceptionPage = location.pathname.startsWith('/reception');
  const isAccountingPage = location.pathname.startsWith('/accounting');
  const isKitchenPage = location.pathname.startsWith('/kitchen');
  const isAnyLoginPage = location.pathname === '/login' || location.pathname.endsWith('/login');



  return (
    <div className="flex flex-col min-h-screen">
      {/* Header logic */}
      {isAnyLoginPage
        ? null                     // no header on any login page
        : isAdminPage
          ? <AdminHeader />        // admin header on admin pages
          : (isReceptionPage || isAccountingPage || isKitchenPage)
            ? <DashboardHeader />  // shared header for non-admin dashboards
            : <Header />}

      <main className="flex-grow bg-gray-100">
        <Routes>
          {/* ---------- Guest Routes ---------- */}
          <Route path="/" element={<GuestHome />} />
          <Route path="/reservation/:restaurantId" element={<ReservationForm />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cancel/:token" element={<GuestCancel />} />
          <Route path="/review/:token" element={<ReviewPage />} />


          {/* ---------- Auth (single login) ---------- */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* ✅ Legacy login redirects */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/reception/login" element={<Navigate to="/login" replace />} />
          <Route path="/accounting/login" element={<Navigate to="/login" replace />} />
          <Route path="/kitchen/login" element={<Navigate to="/login" replace />} />

          {/* ---------- Admin (role: admin) ---------- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit/:reservationId"
            element={
              <ProtectedRoute requiredRole="admin">
                <EditReservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-capacities"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageCapacities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/capacity-overview"
            element={
              <ProtectedRoute requiredRole="admin">
                <CapacitiesOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-guest-list"
            element={
              <ProtectedRoute requiredRole="admin">
                <UploadGuestList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute requiredRole="admin">
                <Reviews />
              </ProtectedRoute>
            }
          />

          {/* ---------- Reception (role: reception) ---------- */}
          <Route
            path="/reception/dashboard"
            element={
              <ProtectedRoute requiredRole="reception">
                <ReceptionDashboard />
              </ProtectedRoute>
            }
          />

          {/* ---------- Accounting (role: accounting) ---------- */}
          <Route
            path="/accounting/dashboard"
            element={
              <ProtectedRoute requiredRole="accounting">
                <AccountingDashboard />
              </ProtectedRoute>
            }
          />

          {/* ---------- Kitchen (role: kitchen) ---------- */}
          <Route
            path="/kitchen/dashboard"
            element={
              <ProtectedRoute requiredRole="kitchen">
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </main>

      {/* Footer is hidden on Admin, Reception, and Accounting */}
      {!isAdminPage && !isReceptionPage && !isAccountingPage && !isKitchenPage && !isAnyLoginPage && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};


export default App;
