import React, { useEffect, useState } from 'react';

const API_BASE = 'https://reservation-backend-demo.onrender.com';
const restaurants = ['Oriental', 'Chinese', 'Italian', 'Indian'];

const DAYS = 6;
const LOW_THRESHOLD = 4; // remaining <= 4 turns cell amber

const Spinner = ({ label = "Loading…" }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite" aria-busy="true">
      <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-accent animate-spin" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  </div>
);

function pad2(n) {
  return String(n).padStart(2, '0');
}
function formatLocalYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getStatusColor(remaining, capacity) {
  // special case: nothing set in backend
  if (!capacity) {
    return 'bg-gray-50 text-gray-500 ring-1 ring-gray-200';
  }
  if (remaining <= 0) return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  if (remaining <= LOW_THRESHOLD) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
}

function pct(n, d) {
  if (!d) return 0;
  return Math.max(0, Math.min(100, Math.round((n / d) * 100)));
}
function getBarColor(remaining, capacity) {
  if (!capacity) return 'bg-gray-300';
  if (remaining <= 0) return 'bg-red-400';
  if (remaining <= LOW_THRESHOLD) return 'bg-amber-400';
  return 'bg-emerald-400';
}

const CapacitiesOverview = () => {
  const [overview, setOverview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const start = formatLocalYYYYMMDD(new Date());
        const qs = new URLSearchParams({
          start,
          days: String(DAYS),
          restaurants: restaurants.join(','),
        });
        const res = await fetch(`${API_BASE}/capacity-overview?${qs.toString()}`);
        let data;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!res.ok || !Array.isArray(data)) {
          console.error('Backend error:', data);
          setOverview([]); // keep array to avoid .find crash
        } else {
          setOverview(data);
        }
      } catch (err) {
        console.error('Failed to load overview:', err);
        setOverview([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const getDateKey = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return formatLocalYYYYMMDD(d); // 'YYYY-MM-DD' local
  };

  const getDateHeaderLabel = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCellData = (restaurant, date) => {
    return Array.isArray(overview)
      ? overview.find(item => item.restaurant === restaurant && item.date === date)
      : undefined;
  };

  if (isLoading) {
    return <Spinner label="Fetching capacities…" />;
  }

  if (!overview?.length) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Capacities Calendar View</h2>
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
          No capacity data found for the selected window.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4">Capacities Calendar View</h2>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border-b border-r text-left w-40">Restaurant</th>
              {[...Array(DAYS)].map((_, i) => (
                <th key={i} className="p-3 border-b border-r text-center">
                  <div className="leading-tight">{getDateHeaderLabel(i)}</div>
                  <div className="text-[11px] text-gray-500">{getDateKey(i)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant} className="bg-white">
                <td className="p-3 border-b border-r bg-gray-50 font-medium">{restaurant}</td>
                {[...Array(DAYS)].map((_, i) => {
                  const date = getDateKey(i);
                  const cell = getCellData(restaurant, date);
                  const reserved = cell?.reserved || 0;
                  const capacity = cell?.capacity || 0;
                  const remaining = Math.max(capacity - reserved, 0);
                  const statusClass = getStatusColor(remaining, capacity);
                  return (
                    <td
                      key={i}
                      className={`p-2 text-sm border-b border-r ${statusClass}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold">
                          {capacity === 0 ? (
                            <span className="text-gray-500">Not set</span>
                          ) : (
                            <>
                              {remaining}
                              <span className="ml-1 font-normal text-xs opacity-70">left</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs opacity-75">{reserved}/{capacity}</div>
                      </div>

                      {/* progress bar */}
                      <div className="mt-1 h-1.5 w-full bg-white/60 rounded">
                        <div
                          className={`h-1.5 rounded ${getBarColor(remaining, capacity)}`}
                          style={{ width: `${capacity === 0 ? 0 : pct(reserved, capacity)}%` }}
                          aria-valuenow={reserved}
                          aria-valuemin={0}
                          aria-valuemax={capacity}
                          role="progressbar"
                          title={capacity === 0 ? "Capacity not set" : `${reserved}/${capacity} reserved`}
                        />
                      </div>

                      {/* subtle hint when low or full */}
                      {capacity === 0 ? (
                        <div className="mt-1 text-[11px] text-gray-500">Capacity not set</div>
                      ) : (
                        remaining <= LOW_THRESHOLD && (
                          <div className="mt-1 text-[11px]">
                            {remaining <= 0 ? "Fully booked" : "Limited seats"}
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CapacitiesOverview;
