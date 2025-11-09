// File: frontend/src/pages/admin/UploadGuestList.jsx
import React, { useState } from 'react';
import { auth } from '../../firebase'; // <-- IMPORT AUTH

const API_URL = 'https://hotel-backend-ddng.onrender.com/upload-guestlist';

const UploadGuestList = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    const user = auth.currentUser; // <-- GET CURRENT USER
    if (!user) {
        setMessage('❌ Error: You are not logged in.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // GET TOKEN THE CORRECT WAY
    const adminToken = await user.getIdToken();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          // NOTE: The backend for this endpoint uses 'x-admin-token'.
          // A better practice would be to unify all auth to use the 'Authorization: Bearer <token>' header.
          // For now, we just supply the token correctly.
          'x-admin-token': adminToken,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Error uploading file.');
      console.error(error);
    }
  };

  return (
    // ... rest of the component is the same
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow text-center">
      <h2 className="text-xl font-bold mb-4">📤 Upload Guest List</h2>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="mb-4"
        />
        <br />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload
        </button>
      </form>
      {message && (
        <p className="mt-4 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadGuestList;