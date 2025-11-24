import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { auth } from "../../firebase";

const API_BASE = 'https://reservation-backend-demo.onrender.com';
const RESTAURANTS = ['Oriental', 'Chinese', 'Italian', 'Indian'];

const AdminSettings = () => {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initial defaults if DB is empty
  const defaultConfig = {
    isActive: true,
    openingTime: "18:00",
    closingTime: "22:00",
    intervalMinutes: 30
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/config`);
      const data = await res.json();
      setConfigs(data || {});
    } catch (error) {
      console.error("Failed to load configs", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (restName, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [restName]: {
        ...(prev[restName] || defaultConfig),
        restaurantId: restName, // ensure ID is set
        [field]: value
      }
    }));
  };

  const handleSave = async (restName) => {
    setSaving(true);
    const configToSave = {
      restaurantId: restName,
      ...(configs[restName] || defaultConfig)
    };

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const res = await fetch(`${API_BASE}/api/v1/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configToSave)
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success(`${restName} settings saved!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Restaurant Configuration</h1>
      <p className="mb-8 text-gray-600">Manage opening hours and reservation availability.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RESTAURANTS.map(name => {
          const conf = configs[name] || defaultConfig;
          return (
            <div key={name} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{name} Restaurant</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${conf.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    {conf.isActive ? 'Active' : 'Closed'}
                  </span>
                  <button 
                    onClick={() => handleChange(name, 'isActive', !conf.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conf.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conf.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                    <input 
                      type="time" 
                      value={conf.openingTime}
                      onChange={(e) => handleChange(name, 'openingTime', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                    <input 
                      type="time" 
                      value={conf.closingTime}
                      onChange={(e) => handleChange(name, 'closingTime', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Slot Interval (Minutes)</label>
                  <select 
                    value={conf.intervalMinutes}
                    onChange={(e) => handleChange(name, 'intervalMinutes', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSave(name)}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Save Settings
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSettings;
