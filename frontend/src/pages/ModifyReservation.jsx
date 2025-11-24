import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE = 'https://reservation-backend-demo.onrender.com';

const ModifyReservation = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState(null);
  
  // Edit State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [availableSlots, setAvailableSlots] = useState([]);

  // 1. Fetch Reservation Details
  useEffect(() => {
    // In a real app, you might want an endpoint specifically to fetch 1 res by ID without auth
    // For now, we assume you might have one or we use the list endpoint with a filter if secured.
    // Let's assume you create a simple GET /api/v1/reservations/{id} endpoint that is public-ish 
    // or protected by the token.
    // For this demo, let's assume we fetch it via the admin endpoint or a new public getter.
    
    // TODO: Ensure backend has GET /api/v1/reservations/{id} 
    // If not, add: @router.get("/reservations/{id}") ...
    
    const fetchRes = async () => {
      try {
        // You need to implement this endpoint in backend or use existing logic
        const res = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}`); 
        if (!res.ok) throw new Error("Could not find reservation");
        const data = await res.json();
        
        setReservation(data);
        setDate(data.date);
        setTime(data.time);
        setGuests(data.guests);
        
        // Load config to generate slots for this restaurant
        const confRes = await fetch(`${API_BASE}/api/v1/config`);
        const confData = await confRes.json();
        const myConfig = confData[data.restaurant];
        
        if (myConfig) {
          // Import/Copy your generateTimeSlots function here
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
          setAvailableSlots(generateTimeSlots(myConfig.openingTime, myConfig.closingTime, myConfig.intervalMinutes));
        }
      } catch (err) {
        toast.error("Error loading reservation");
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [reservationId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, guests: Number(guests) })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Update failed");
      }
      
      toast.success("Reservation Updated!");
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto pt-24 p-6">
      <Toaster />
      <div className="bg-white shadow rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Modify Reservation</h1>
        <p className="text-gray-600 mb-6">Editing booking for {reservation.restaurant}</p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full border p-2 rounded" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <select 
              value={time} 
              onChange={e => setTime(e.target.value)} 
              className="w-full border p-2 rounded"
            >
              {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Guests</label>
            <select 
               value={guests} 
               onChange={e => setGuests(e.target.value)} 
               className="w-full border p-2 rounded"
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
            Update Reservation
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModifyReservation;
