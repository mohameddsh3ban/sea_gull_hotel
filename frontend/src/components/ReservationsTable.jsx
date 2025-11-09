import React, { useEffect, useState, useCallback } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import roboto from '../fonts/Roboto-VariableFont_wght.ttf';
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

Font.register({ family: 'Roboto', src: roboto });

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', fontSize: 8 },
  h1: { fontSize: 16, marginBottom: 8 },
  table: {
    display: 'table', width: '100%', borderStyle: 'solid',
    borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0
  },
  tableRow: { flexDirection: 'row' },
  colBase: {
    borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0,
    borderTopWidth: 0, padding: 4, wordWrap: 'break-word'
  },
  tableHeaderText: { fontWeight: 'bold', backgroundColor: '#eee' },
  colGuest: { width: '16%' },
  colRoom: { width: '8%' },
  colDate: { width: '12%' },
  colTime: { width: '6%' },
  colGuests: { width: '8%' },
  colRestaurant: { width: '12%' },
  colCourses: { width: '18%' },
  colComment: { width: '12%' },
  colExtras: { width: '8%' },
  colStatus: { width: '8%' },
});

const API_BASE = 'https://reservation-backend-demo.onrender.com';

// Loading skeleton component
const TableSkeleton = () => (
  <tbody>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-t animate-pulse">
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      </tr>
    ))}
  </tbody>
);

const ReservationsTable = ({ userRole }) => {
  const navigate = useNavigate();
  
  // State management
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    next_last_id: null,
    per_page: 50,
    has_next: false,
    current_page_items: 0, // Track items on current page
  });
  const [allReservations, setAllReservations] = useState([]); // To accumulate reservations
  
  // Filters
  const [filters, setFilters] = useState({
    restaurant: 'all',
    date: 'all', // This will be replaced by from/to
    search: '',
    from: new Date().toISOString().split('T')[0], // Today
    to: ''
  });
  
  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch reservations with filters
  const fetchReservations = useCallback(async (loadMore = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login', { replace: true, state: { from: '/admin/dashboard' } });
        return;
      }
      
      const token = await user.getIdToken();
      
      // Build query parameters
      const queryParams = {
        limit: pagination.per_page.toString(),
        restaurant: filters.restaurant,
        search: filters.search,
      };

      if (filters.from) {
        queryParams.from_date = filters.from;
      }
      if (filters.to) {
        queryParams.to_date = filters.to;
      }
      if (loadMore && pagination.next_last_id) {
        queryParams.last_id = pagination.next_last_id;
      }
      
      const params = new URLSearchParams();
      for (const key in queryParams) {
        if (queryParams[key] !== 'all' && queryParams[key] !== '') {
          params.append(key, queryParams[key]);
        }
      }
      
      const response = await fetch(`${API_BASE}/api/v1/reservations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        navigate('/login', { replace: true, state: { from: '/admin/dashboard' } });
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      
      setReservations(prev => loadMore ? [...prev, ...(data.items || [])] : (data.items || []));
      setAllReservations(prev => loadMore ? [...prev, ...(data.items || [])] : (data.items || []));

      setPagination(prev => ({
        ...prev,
        next_last_id: data.pagination.next_last_id,
        has_next: data.pagination.has_next,
        current_page_items: (data.items || []).length,
      }));
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, navigate, pagination.per_page, pagination.next_last_id]);
  
  // Initial load and filter changes
  useEffect(() => {
    setReservations([]); // Clear reservations on filter change
    setAllReservations([]);
    setPagination(prev => ({ ...prev, next_last_id: null })); // Reset cursor
    fetchReservations(false);
  }, [filters.restaurant, filters.from, filters.to, filters.search]); // Add filters.search here
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Delete reservation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      // Refresh current page (or re-fetch all from start)
      setReservations([]);
      setAllReservations([]);
      setPagination(prev => ({ ...prev, next_last_id: null }));
      fetchReservations(false);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete reservation');
    }
  };

  // toggle paid helper (direct, with Firebase ID token)
  const togglePaid = async (reservationId, currentPaid) => {
    const nextPaid = !currentPaid;

    // optimistic UI
    setReservations(prev =>
        prev.map(r => r.id === reservationId ? { ...r, paid: nextPaid, _savingPaid: true } : r)
    );

    try {
        const user = auth.currentUser;
        if (!user) {
            navigate('/login', { replace: true, state: { from: '/reception/dashboard' } });
            return;
        }
        const idToken = await user.getIdToken();

        const resp = await fetch(`${API_BASE}/api/v1/reservations/${reservationId}/paid`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ paid: nextPaid }),
        });

        if (resp.status === 401 || resp.status === 403) {
            navigate('/login', { replace: true, state: { from: '/reception/dashboard' } });
            return;
        }

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || 'Update failed');
        }
    } catch (e) {
        console.error('Failed to update paid status:', e);
        // rollback
        setReservations(prev =>
            prev.map(r => r.id === reservationId ? { ...r, paid: currentPaid } : r)
        );
        alert('Could not save status.');
    } finally {
        setReservations(prev =>
            prev.map(r => r.id === reservationId ? { ...r, _savingPaid: false } : r)
        );
    }
  };
  
  // Calculate summary stats
  const totalGuests = allReservations.reduce((sum, res) => sum + (parseInt(res.guests) || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Generate PDF data (all loaded reservations for performance)
  const ReservationsPDF = ({ data, totalGuests, filterDate, filterRestaurant }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Reservations Report</Text>
        <Text>{`Restaurant: ${filterRestaurant === 'all' ? 'All' : filterRestaurant}`}</Text>
        <Text>{`Date: ${filterDate === 'all' ? 'All' : filterDate}`}</Text>
        <Text>{`Generated on: ${new Date().toLocaleString()}`}</Text>
        
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableRow}>
            <Text style={[styles.colBase, styles.colGuest, styles.tableHeaderText]} wrap>Guest</Text>
            <Text style={[styles.colBase, styles.colRoom, styles.tableHeaderText]} wrap>Room</Text>
            <Text style={[styles.colBase, styles.colDate, styles.tableHeaderText]} wrap>Date</Text>
            <Text style={[styles.colBase, styles.colTime, styles.tableHeaderText]} wrap>Time</Text>
            <Text style={[styles.colBase, styles.colGuests, styles.tableHeaderText]} wrap>Guests</Text>
            <Text style={[styles.colBase, styles.colRestaurant, styles.tableHeaderText]} wrap>Restaurant</Text>
            <Text style={[styles.colBase, styles.colCourses, styles.tableHeaderText]} wrap>Main Courses</Text>
            <Text style={[styles.colBase, styles.colComment, styles.tableHeaderText]} wrap>Comments</Text>
            <Text style={[styles.colBase, styles.colExtras, styles.tableHeaderText]} wrap>Extras</Text>
            <Text style={[styles.colBase, styles.colStatus, styles.tableHeaderText]} wrap>Status</Text>
          </View>
          
          {/* Data rows */}
          {data.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.colBase, styles.colGuest]} wrap>{r.name || 'N/A'}</Text>
              <Text style={[styles.colBase, styles.colRoom]} wrap>{r.room || ''}</Text>
              <Text style={[styles.colBase, styles.colDate]} wrap>{r.date || ''}</Text>
              <Text style={[styles.colBase, styles.colTime]} wrap>{r.time || ''}</Text>
              <Text style={[styles.colBase, styles.colGuests]} wrap>{r.guests || ''}</Text>
              <Text style={[styles.colBase, styles.colRestaurant]} wrap>{r.restaurant || 'N/A'}</Text>
              <Text style={[styles.colBase, styles.colCourses]} wrap>
                {Array.isArray(r.main_courses) ? r.main_courses.join(', ') : r.main_course || '—'}
              </Text>
              <Text style={[styles.colBase, styles.colComment]} wrap>{r.comments || '—'}</Text>
              <Text style={[styles.colBase, styles.colExtras]} wrap>
                {r.upsell_items
                  ? Object.entries(r.upsell_items)
                    .filter(([_, count]) => count > 0)
                    .map(([item, count]) => `${item} × ${count}`)
                    .join(', ')
                  : '—'}
              </Text>
              <Text style={[styles.colBase, styles.colStatus]} wrap>
                {r.upsell_items && Object.values(r.upsell_items).some(c => c > 0)
                  ? (r.paid ? 'Paid' : 'Not paid')
                  : '—'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
  
  // Pagination controls
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-6 px-4">
      <div className="text-sm text-gray-600">
        Showing {allReservations.length} reservations
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => fetchReservations(true)}
          disabled={!pagination.has_next || loading}
          className={`px-4 py-2 rounded-lg font-medium ${
            pagination.has_next && !loading
              ? 'bg-white border border-gray-300 hover:bg-gray-50'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Load More
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Restaurant Reservations</h1>
        <p className="text-gray-600 mt-2">Total items: {allReservations.length}</p>
      </header>
      
      {/* Enhanced filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by name, room, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>
          
          {/* Restaurant filter */}
          <select
            value={filters.restaurant}
            onChange={(e) => setFilters(prev => ({ ...prev, restaurant: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Restaurants</option>
            <option value="Oriental">Oriental</option>
            <option value="Chinese">Chinese</option>
            <option value="Italian">Italian</option>
            <option value="Indian">Indian</option>
          </select>
          
          {/* Date range */}
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="date"
            value={filters.to}
            placeholder="To date"
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          
          {/* Export PDF */}
          <PDFDownloadLink
            document={
              <ReservationsPDF
                data={allReservations}
                totalGuests={totalGuests}
                filterDate={filters.date}
                filterRestaurant={filters.restaurant}
              />
            }
            fileName={`reservations_report_${new Date().toISOString().split('T')[0]}.pdf`}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
                     text-white font-medium px-5 py-2 rounded-lg shadow-md transition text-center"
          >
            {({ loading }) => (loading ? 'Generating…' : 'Export PDF')}
          </PDFDownloadLink>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          Error: {error}
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] bg-white shadow-lg rounded-xl">
        <table className="w-full text-base text-gray-800">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Guest</th>
              <th className="p-3">Email</th>
              <th className="p-3">Room</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Guests</th>
              <th className="p-3">Restaurant</th>
              <th className="p-3">Main Courses</th>
              <th className="p-3">Extras</th>
              <th className="p-3">Status</th>
              {userRole === 'admin' && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          
          {loading ? (
            <TableSkeleton />
          ) : (
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id} className="border-t hover:bg-blue-50 transition">
                  <td className="p-3">{res.name || 'N/A'}</td>
                  <td className="p-3">{res.email || 'N/A'}</td>
                  <td className="p-3">{res.room}</td>
                  <td className="p-3">{res.date}</td>
                  <td className="p-3">{res.time}</td>
                  <td className="p-3">{res.guests}</td>
                  <td className="p-3">{res.restaurant || 'N/A'}</td>
                  <td className="p-3">
                    {Array.isArray(res.main_courses) ? res.main_courses.join(', ') : res.main_course || '—'}
                  </td>
                  <td className="p-3">
                    {res.upsell_items
                      ? Object.entries(res.upsell_items)
                        .filter(([_, count]) => count > 0)
                        .map(([item, count]) => `${item} × ${count}`)
                        .join(', ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    {userRole === 'reception' && res.upsell_items && Object.values(res.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0) ? (
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!res.paid}
                                onChange={() => togglePaid(res.id, !!res.paid)}
                                disabled={res._savingPaid}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {res.paid ? 'Paid' : 'Not paid'}
                                {res._savingPaid ? '…' : ''}
                            </span>
                        </label>
                    ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            res.email_status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : res.email_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {res.email_status || 'pending'}
                        </span>
                    )}
                    {userRole !== 'reception' && res.upsell_items && Object.values(res.upsell_items).some(c => c > 0) && (
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        res.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {res.paid ? 'Paid' : 'Not paid'}
                      </span>
                    )}
                  </td>
                  {userRole === 'admin' && (
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={userRole === 'admin' ? "11" : "10"} className="text-center py-8 text-gray-500">
                    No reservations found
                  </td>
                </tr>
              )}
              
              {/* Summary row */}
              <tr className="font-bold bg-gray-200 border-t sticky bottom-0 z-10 shadow-inner">
                <td className="p-3" colSpan={5}>Page Total</td>
                <td className="p-3">{totalGuests}</td>
                <td className="p-3" colSpan={userRole === 'admin' ? "5" : "4"}></td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
      
      {/* Pagination controls */}
      {!loading && pagination.total_pages > 1 && <PaginationControls />}
    </div>
  );
};

export default ReservationsTable;
