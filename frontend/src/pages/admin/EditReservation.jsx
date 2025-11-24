import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { auth } from "../../firebase";

const API_BASE = 'https://reservation-backend-demo.onrender.com';

const EditReservation = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    restaurant: '',
    name: '',
    room: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);

  // Helper to generate slots (same as in ReservationForm)
  const generateTimeSlots = (start, end, interval) => {
    const slots = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let current = new Date(); current.setHours(startH, startM, 0, 0);
    const endTime = new Date(); endTime.setHours(endH, endM, 0, 0);
    while (current <= endTime) {
      slots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { navigate('/login'); return; }
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Reservation Details
        const resResponse = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}`, { headers });
        if (!resResponse.ok) throw new Error("Reservation not found");
        const resData = await resResponse.json();

        setFormData({
            date: resData.date,
            time: resData.time,
            guests: resData.guests,
            restaurant: resData.restaurant || resData.restaurantId,
            name: resData.name,
            room: resData.room
        });

        // 2. Fetch Config for that restaurant to show valid times
        const confResponse = await fetch(`${API_BASE}/api/v1/config`);
        const confData = await confResponse.json();
        const myConfig = confData[resData.restaurant || resData.restaurantId];

        if (myConfig) {
            const slots = generateTimeSlots(myConfig.openingTime, myConfig.closingTime, myConfig.intervalMinutes);
            setAvailableSlots(slots);
        } else {
            // Fallback if no config
            setAvailableSlots(['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']);
        }

      } catch (err) {
        console.error(err);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reservationId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        
        const response = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // Only sending editable fields defined in backend schema
            body: JSON.stringify({
                date: formData.date,
                time: formData.time,
                guests: parseInt(formData.guests)
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Update failed");
        }

        toast.success("Reservation updated & Guest notified! 📧");
        setTimeout(() => navigate('/admin/dashboard'), 2000);

    } catch (error) {
        toast.error(error.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading reservation data...</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow rounded-2xl mt-10">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Edit Reservation</h2>
      <p className="text-gray-500 mb-6">Editing: {formData.name} (Room {formData.room}) - {formData.restaurant}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" 
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <select 
                name="time" 
                value={formData.time} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
                {availableSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
            <input 
                type="number" 
                name="guests" 
                value={formData.guests} 
                onChange={handleChange} 
                min="1" 
                max="10" 
                required 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" 
            />
        </div>

        <button 
            type="submit" 
            disabled={submitting}
            className={`w-full text-white py-2 rounded transition ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
            {submitting ? 'Saving...' : 'Save Changes'}
        </button>
        
        <button 
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="w-full text-gray-600 py-2 hover:underline"
        >
            Cancel
        </button>
      </form>
    </div>
  );
};

export default EditReservation;
