import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { auth } from "../../firebase";

const API_BASE = 'https://reservation-backend-demo.onrender.com';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/v1/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Analytics...</div>;
  if (!data) return <div className="p-8">No data available</div>;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Business Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm uppercase font-bold">Total Sushi Revenue (30d)</p>
          <p className="text-3xl font-bold text-gray-800">${data.kpi.total_revenue}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm uppercase font-bold">Total Guests (30d)</p>
          <p className="text-3xl font-bold text-gray-800">{data.kpi.total_guests}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm uppercase font-bold">Avg. Daily Guests</p>
          <p className="text-3xl font-bold text-gray-800">
            {Math.round(data.kpi.total_guests / 30)}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Guest Trends */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Guest Trends (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="guests" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Upsell Revenue (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Occupancy Forecast */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4 text-gray-700">7-Day Capacity Forecast</h3>
        <p className="text-sm text-gray-500 mb-4">Percentage of seats booked for upcoming days.</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts.occupancy} layout="vertical" margin={{left: 40}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="date" type="category" width={100} />
              <Tooltip cursor={{fill: 'transparent'}} content={({active, payload}) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border shadow text-sm">
                      <p className="font-bold">{d.restaurant} on {d.date}</p>
                      <p>Booked: {d.reserved} / {d.capacity}</p>
                      <p>Occupancy: {d.occupancy}%</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              <Bar dataKey="occupancy" name="% Occupancy" fill="#8884d8" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
