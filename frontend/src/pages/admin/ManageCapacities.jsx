import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const restaurants = ['Oriental', 'Chinese', 'Italian', 'Indian'];

const Spinner = ({ label = "Loading…" }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite" aria-busy="true">
      <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  </div>
);

const ManageCapacities = () => {
  const navigate = useNavigate();
  const [capacities, setCapacities] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const API_BASE = 'https://reservation-backend-demo.onrender.com';

  const DAYS = 6;

  function pad2(n) { return String(n).padStart(2, '0'); }
  function formatLocalYYYYMMDD(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function getDateHeaderLabel(base, offset) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login', { replace: true, state: { from: '/admin/capacities' } });
          return;
        }
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/capacities`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          signal: ctrl.signal,
        });

        if (res.status === 401 || res.status === 403) {
          toast.error('Please log in to manage capacities.');
          navigate('/login', { replace: true, state: { from: '/admin/capacities' } });
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text().catch(() => '');
          console.error('Expected JSON but got:', contentType, { text });
          toast.error('Failed to load capacities.');
          setCapacities({});
          return;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok || typeof data !== 'object' || data === null || Array.isArray(data)) {
          toast.error((data && data.error) || 'Failed to load capacities.');
          setCapacities({});
        } else {
          setCapacities(data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch capacities:', err);
          setCapacities({});
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [API_BASE, navigate]);


  const handleChange = (key, value) => {
    let n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    n = Math.trunc(n);
    if (n < 0) n = 0;
    if (n > 5000) n = 5000; // optional upper bound to avoid accidental huge numbers
    setCapacities(prev => ({ ...prev, [key]: n }));
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login', { replace: true, state: { from: '/admin/capacities' } });
        return;
      }
      const token = await user.getIdToken(true);
      setIsSaving(true);
      const response = await fetch(`${API_BASE}/capacities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(capacities),
      });

      // Guard before parsing
      if (response.status === 401 || response.status === 403) {
        toast.error('You are not authorized to save capacities.');
        navigate('/login', { replace: true, state: { from: '/admin/capacities' } });
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text().catch(() => '');
        console.error('Expected JSON but got:', contentType, { text });
        toast.error('Unexpected server response while saving.');
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'There was a problem saving capacities. ❌');
        return;
      }

      toast.success('Capacities saved successfully! 🎉');

      // Re-fetch to reflect server state (and any clamping the backend may do)
      (async () => {
        try {
          const freshToken = await auth.currentUser.getIdToken();
          const res2 = await fetch(`${API_BASE}/capacities`, {
            headers: { Authorization: `Bearer ${freshToken}`, Accept: 'application/json' },
          });
          if (res2.ok) {
            const data2 = await res2.json().catch(() => null);
            if (data2 && typeof data2 === 'object' && !Array.isArray(data2)) {
              setCapacities(data2);
            }
          }
        } catch { }
      })();


    } catch (error) {
      console.error('Error updating capacities:', error);
      toast.error('There was a problem saving capacities. ❌');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading capacities…" />;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Toaster position="top-center" />
      <h2 className="text-3xl font-bold mb-6">Manage Restaurant Capacities</h2>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-3">Restaurant</th>
              {[...Array(DAYS)].map((_, index) => (
                <th key={index} className="p-3 whitespace-nowrap">
                  {getDateHeaderLabel(today, index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant} className="border-t">
                <td className="p-3 font-semibold">{restaurant}</td>
                {[...Array(DAYS)].map((_, index) => {
                  const d = new Date(today);
                  d.setDate(d.getDate() + index);
                  const dateKey = formatLocalYYYYMMDD(d);
                  const key = `${restaurant}_${dateKey}`;

                  return (
                    <td key={key} className="p-2">
                      <input
                        type="number"
                        value={capacities[key] ?? 0}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        min="0"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`mt-6 ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded`}
      >
        {isSaving ? 'Saving...' : 'Save Capacities'}
      </button>
    </div>
  );
};

export default ManageCapacities;
