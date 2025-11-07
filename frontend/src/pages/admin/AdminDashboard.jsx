import React, { useEffect, useState } from 'react';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

import roboto from '../../fonts/Roboto-VariableFont_wght.ttf';
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

Font.register({ family: 'Roboto', src: roboto });

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', fontSize: 8 },
  h1: { fontSize: 16, marginBottom: 8 },

  // ---- table (outer shell) ----
  table: {
    display: 'table', width: '100%', borderStyle: 'solid',
    borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0
  },
  tableRow: { flexDirection: 'row' },

  // ---- cell base ----
  colBase: {
    borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0,
    borderTopWidth: 0, padding: 4, wordWrap: 'break-word'
  },

  // ---- header text ----
  tableHeaderText: { fontWeight: 'bold', backgroundColor: '#eee' },

  colGuest: { width: '16%' },
  colRoom: { width: '8%' },
  colDate: { width: '12%' },
  colTime: { width: '6%' },
  colGuests: { width: '8%' },
  colRestaurant: { width: '12%' },
  colCourses: { width: '18%' },
  colComment: { width: '12%' },  // Comments
  colExtras: { width: '8%' },    // NEW: Extras has its own width
  colStatus: { width: '8%' },
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredRestaurant, setFilteredRestaurant] = useState('all');
  const [filteredDate, setFilteredDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const todayStr = new Date().toISOString().split('T')[0];


  useEffect(() => {
    fetchReservations();
  }, []);

  const API_BASE = 'https://reservation-backend-demo.onrender.com';

  const fetchReservations = async () => {
    console.log("🔍 fetchReservations called");
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login', { replace: true, state: { from: '/admin/dashboard' } });
        return;
      }
      const token = await user.getIdToken();
      const today = new Date().toISOString().split('T')[0];
      const urlBase = `${API_BASE}/all-reservations`;

      const url = `${urlBase}?from=${today}`;
      console.log("GET", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      // final guards
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const { allow, text } = await (async () => {
          const a = response.headers.get("allow") || response.headers.get("Allow") || "";
          const t = await response.text().catch(() => "");
          return { allow: a, text: t };
        })();
        console.error("Fetch /admin/reservations failed:", response.status, response.statusText, {
          allow,
          url: attempt.url,
          method: attempt.method,
          text,
        });
        throw new Error(`HTTP ${response.status}`);
      }
      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error("Expected JSON but got:", contentType, { url: attempt.url, method: attempt.method, text });
        throw new Error("Server did not return JSON");
      }

      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };


  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to cancel this reservation?");
    if (!confirm) return;
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login', { replace: true, state: { from: '/admin/dashboard' } });
        return;
      }
      const token = await user.getIdToken(true);

      const response = await fetch(`${API_BASE}/reservations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
      });


      if (response.status === 401 || response.status === 403) {
        navigate('/login', { replace: true, state: { from: '/admin/dashboard' } });
        return;
      }
      if (!response.ok) throw new Error('Failed to delete reservation');
      fetchReservations();
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  const filteredData = reservations.filter(res => {
    const resDate = res.date?.slice(0, 10);
    const matchesRestaurant =
      filteredRestaurant === 'all' || res.restaurant === filteredRestaurant;
    const matchesDate =
      filteredDate === 'all' || resDate === filteredDate;
    return matchesRestaurant && matchesDate;
  });

  const totalGuests = filteredData.reduce((sum, res) => sum + (parseInt(res.guests) || 0), 0);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const ReservationsPDF = ({ data, totalGuests, filterDate, filterRestaurant }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Reservations Report</Text>
        <Text>{`Restaurant: ${filterRestaurant === 'all' ? 'All' : filterRestaurant}`}</Text>
        <Text>{`Date: ${filterDate === 'all' ? 'All' : filterDate}`}</Text>
        <Text>{`Generated on: ${new Date().toLocaleString()}`}</Text>

        {/* ---------- TABLE ---------- */}
        {/* ======= in ReservationsPDF ======= */}
        <View style={styles.table}>
          {/* header row */}
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

          {/* data rows */}
          {data.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.colBase, styles.colGuest]} wrap>{r.name || 'N/A'}</Text>
              <Text style={[styles.colBase, styles.colRoom]} wrap>{r.room || ''}</Text>
              <Text style={[styles.colBase, styles.colDate]} wrap>{r.date || ''}</Text>
              <Text style={[styles.colBase, styles.colTime]} wrap>{r.time || ''}</Text>
              <Text style={[styles.colBase, styles.colGuests]} wrap>{r.guests || ''}</Text>
              <Text style={[styles.colBase, styles.colRestaurant]} wrap>{r.restaurant || 'N/A'}</Text>
              <Text style={[styles.colBase, styles.colCourses]} wrap>
                {Array.isArray(r.main_courses)
                  ? r.main_courses.join(', ')
                  : r.main_course || '—'}
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
                {r.upsell_items &&
                  Object.values(r.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0)
                  ? (r.paid ? 'Paid' : 'Not paid')
                  : '—'}
              </Text>
            </View>
          ))}

          {/* total row */}
          <View style={[styles.tableRow, { backgroundColor: '#f9f9f9' }]}>
            <Text style={[styles.colBase, styles.colGuest]} wrap>Total guests:</Text>
            <Text style={[styles.colBase, styles.colRoom]} />
            <Text style={[styles.colBase, styles.colDate]} />
            <Text style={[styles.colBase, styles.colTime]} />
            <Text style={[styles.colBase, styles.colGuests]} />
            <Text style={[styles.colBase, styles.colRestaurant]} />
            <Text style={[styles.colBase, styles.colCourses]} wrap>{totalGuests}</Text>
            <Text style={[styles.colBase, styles.colComment]} />
            <Text style={[styles.colBase, styles.colExtras]} />   {/* <-- was colComment */}
            <Text style={[styles.colBase, styles.colStatus]} />
          </View>
        </View>
        {/* ---------- END TABLE ---------- */}
      </Page>
    </Document>
  );

  const uniqueDates = [...new Set(
    reservations
      .map(res => res.date?.slice(0, 10))
      .filter(Boolean)
  )].sort();

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Title to match Kitchen */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Restaurant Reservations</h1>
      </header>

      {/* Filters — same look as Kitchen */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-3 items-center bg-white shadow-md px-4 py-3 rounded-lg">
          {/* Restaurant */}
          <select
            value={filteredRestaurant}
            onChange={(e) => setFilteredRestaurant(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Restaurants</option>
            <option value="Oriental">Oriental</option>
            <option value="Chinese">Chinese</option>
            <option value="Italian">Italian</option>
            <option value="Indian">Indian</option>
          </select>

          {/* Date */}
          <select
            value={filteredDate}
            onChange={(e) => setFilteredDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Dates</option>
            <option value={todayStr}>Today ({todayStr})</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>

          {/* Export PDF */}
          <PDFDownloadLink
            document={
              <ReservationsPDF
                data={filteredData}
                totalGuests={totalGuests}
                filterDate={filteredDate}
                filterRestaurant={filteredRestaurant}
              />
            }
            fileName={`reservation_report_${filteredRestaurant}_${filteredDate}.pdf`}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
                       text-white font-medium px-5 py-2 rounded-lg shadow-md transition"
          >
            {({ loading }) => (loading ? 'Generating…' : 'Export PDF')}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Table block — same visual language as Kitchen */}
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
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((res) => (
              <tr key={res.id} className="border-t hover:bg-blue-50 transition">
                <td className="p-3">{res.name || 'N/A'}</td>
                <td className="p-3">{res.email || 'N/A'}</td>
                <td className="p-3">{res.room}</td>
                <td className="p-3">{res.date}</td>
                <td className="p-3">{res.time}</td>
                <td className="p-3">{res.guests}</td>
                <td className="p-3">{res.restaurant || 'N/A'}</td>
                <td className="p-3">
                  {Array.isArray(res.main_courses) ? res.main_courses.join(', ') : (res.main_course || '—')}
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
                  {res.upsell_items &&
                    Object.values(res.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0)
                    ? (res.paid ? 'Paid' : 'Not paid')
                    : '—'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
            {/* Sticky total row like Kitchen */}
            <tr className="font-bold bg-gray-200 border-t sticky bottom-0 z-10 shadow-inner">
              <td className="p-3" colSpan={6}>Total</td>
              <td className="p-3">{totalGuests}</td>
              <td className="p-3" colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination circles (Kitchen style) */}
      <div className="flex justify-center mt-6 mb-4 space-x-3">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium shadow 
              ${currentPage === i + 1
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white text-blue-600 border-2 border-gray-400 hover:bg-blue-50'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
