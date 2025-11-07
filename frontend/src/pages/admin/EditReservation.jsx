import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditReservation = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: '2025-04-15',
    time: '19:00',
    guests: 2,
    room: '101',
    name: 'John Doe',
    restaurant: 'The Garden View'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated Reservation:', formData);
    navigate('/admin/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow rounded-2xl mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Reservation #{reservationId}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input type="time" name="time" value={formData.time} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" required className="w-full border p-2 rounded" placeholder="Number of Guests" />
        <input type="text" name="room" value={formData.room} onChange={handleChange} required className="w-full border p-2 rounded" placeholder="Room Number (Required)" />
        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Guest Name" />
        <input type="text" name="restaurant" value={formData.restaurant} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Restaurant Name" />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Save Changes</button>
      </form>
    </div>
  );
};

export default EditReservation;
