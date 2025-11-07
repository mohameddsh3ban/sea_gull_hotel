import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = 'https://reservation-backend-demo.onrender.com'; // Your deployed backend

const GuestCancel = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`${API_BASE}/cancel/${token}`);
        if (res.ok) {
          const data = await res.json();
          setReservation(data);
          setStatus('confirm');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    fetchReservation();
  }, [token]);

  const handleCancel = async () => {
    try {
      const res = await fetch(`${API_BASE}/cancel/${token}`, {
        method: 'POST',
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 bg-white rounded shadow text-center">
      {status === 'loading' && <p className="text-gray-600">⏳ Loading reservation...</p>}

      {status === 'confirm' && (
        <>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">⚠️ Confirm Cancellation</h2>
          <p className="text-gray-700 mb-4">
            Are you sure you want to cancel your reservation for{" "}
            <strong>{reservation.name}</strong> at{" "}
            <strong>{reservation.restaurant}</strong> on{" "}
            <strong>{reservation.date}</strong>?
          </p>
          <button
            onClick={handleCancel}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Yes, Cancel Reservation
          </button>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 className="text-2xl font-bold text-green-600 mb-2">✅ Reservation Cancelled</h2>
          <p className="text-gray-700">Your reservation has been successfully cancelled.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 className="text-2xl font-bold text-red-600 mb-2">❌ Invalid or Expired Link</h2>
          <p className="text-gray-700">We couldn’t find a reservation to cancel.</p>
        </>
      )}
    </div>
  );
};

export default GuestCancel;
