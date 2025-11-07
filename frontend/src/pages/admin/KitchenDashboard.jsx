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
    table: {
        display: 'table',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: { flexDirection: 'row' },
    colBase: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
        wordWrap: 'break-word'
    },
    tableHeaderText: { fontWeight: 'bold', backgroundColor: '#eee' },
    colRoom: { width: '10%' },
    colDate: { width: '10%' },
    colGuest: { width: '16%' },       // +2% to absorb removed Time
    colGuests: { width: '8%' },       // count of guests (was used but missing in styles)
    colRestaurant: { width: '12%' },  // +1%
    colCourses: { width: '18%' },     // +3%
    colExtras: { width: '17%' },      // +3%
    colStatus: { width: '9%' },       // +1%
});

const API_BASE = 'https://reservation-backend-demo.onrender.com';

const KitchenDashboard = () => {
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

    const fetchReservations = async () => {
        try {
            // ensure user is logged in
            const user = auth.currentUser;
            if (!user) {
                navigate('/login', { replace: true, state: { from: '/kitchen/dashboard' } });
                return;
            }
            const idToken = await user.getIdToken(true);

            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${API_BASE}/kitchen/reservations?from=${today}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                navigate('/login', { replace: true, state: { from: '/kitchen/dashboard' } });
                return;
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Fetch failed");
            setReservations(data.map(r => ({ ...r, paid: !!r.paid })));
        } catch (error) {
            console.error("Error fetching reservations:", error);
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
                <Text style={styles.h1}>Ala Carte Reservations Report</Text>
                <Text>{`Restaurant: ${filterRestaurant === 'all' ? 'All' : filterRestaurant}`}</Text>
                <Text>{`Date: ${filterDate === 'all' ? 'All' : filterDate}`}</Text>
                <Text>{`Generated on: ${new Date().toLocaleString()}`}</Text>

                <View style={styles.table}>
                    {/* header row (REMOVED Upsell Total) */}
                    <View style={styles.tableRow}>
                        <Text style={[styles.colBase, styles.colGuest, styles.tableHeaderText]} wrap>Guest</Text>
                        <Text style={[styles.colBase, styles.colRoom, styles.tableHeaderText]} wrap>Room</Text>
                        <Text style={[styles.colBase, styles.colDate, styles.tableHeaderText]} wrap>Date</Text>
                        <Text style={[styles.colBase, styles.colGuests, styles.tableHeaderText]} wrap>Guests</Text>
                        <Text style={[styles.colBase, styles.colRestaurant, styles.tableHeaderText]} wrap>Restaurant</Text>
                        <Text style={[styles.colBase, styles.colCourses, styles.tableHeaderText]} wrap>Main Courses</Text>
                        <Text style={[styles.colBase, styles.colExtras, styles.tableHeaderText]} wrap>Extras</Text>
                        <Text style={[styles.colBase, styles.colStatus, styles.tableHeaderText]} wrap>Status</Text>
                    </View>

                    {/* data rows (REMOVED Upsell Total cell) */}
                    {data.map((r, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.colBase, styles.colGuest]} wrap>{r.name || 'N/A'}</Text>
                            <Text style={[styles.colBase, styles.colRoom]} wrap>{r.room || ''}</Text>
                            <Text style={[styles.colBase, styles.colDate]} wrap>{r.date || ''}</Text>
                            <Text style={[styles.colBase, styles.colGuests]} wrap>{r.guests || ''}</Text>
                            <Text style={[styles.colBase, styles.colRestaurant]} wrap>{r.restaurant || 'N/A'}</Text>
                            <Text style={[styles.colBase, styles.colCourses]} wrap>
                                {Array.isArray(r.main_courses)
                                    ? r.main_courses.join(', ')
                                    : r.main_course || '—'}
                            </Text>
                            <Text style={[styles.colBase, styles.colExtras]} wrap>
                                {r.upsell_items
                                    ? Object.entries(r.upsell_items)
                                        .filter(([_, count]) => count > 0)
                                        .map(([item, count]) => `${item} × ${count}`)
                                        .join(', ')
                                    : '—'}
                            </Text>
                            <Text style={[styles.colBase, styles.colStatus]} wrap>
                                {r.upsell_items && Object.values(r.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0)
                                    ? (r.paid ? 'Paid' : 'Not paid')
                                    : '—'}
                            </Text>
                        </View>
                    ))}

                    {/* footer row - organized */}
                    <View style={[styles.tableRow, styles.tableFooterRow]}>
                        <Text style={[styles.colBase, styles.colGuest, styles.tableFooterText]} wrap>Totals</Text>
                        <Text style={[styles.colBase, styles.colRoom]}></Text>
                        <Text style={[styles.colBase, styles.colDate]}></Text>

                        {/* Put the number in the Guests column */}
                        <Text style={[styles.colBase, styles.colGuests, styles.tableFooterText]} wrap>{totalGuests}</Text>

                        <Text style={[styles.colBase, styles.colRestaurant]}></Text>
                        <Text style={[styles.colBase, styles.colCourses]}></Text>
                        <Text style={[styles.colBase, styles.colExtras]}></Text>
                        <Text style={[styles.colBase, styles.colStatus]}></Text>
                    </View>
                </View>
            </Page>
        </Document>
    );

    const uniqueDates = [...new Set(
        reservations
            .map(res => res.date?.slice(0, 10))
            .filter(Boolean)
    )].sort();

    return (
        <div className="max-w-6xl mx-auto p-8 pt-24">
            {/* Simple reception header */}
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Restaurant Reservations</h1>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-3 items-center bg-white shadow-md px-4 py-3 rounded-lg">
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

                    <select
                        value={filteredDate}
                        onChange={(e) => {
                            setFilteredDate(e.target.value);
                            setCurrentPage(1); // optional: keep pagination sane after filter
                        }}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="all">All Dates</option>
                        <option value={todayStr}>Today ({todayStr})</option>
                        {uniqueDates.map(date => (
                            <option key={date} value={date}>{date}</option>
                        ))}
                    </select>

                    <PDFDownloadLink
                        document={
                            <ReservationsPDF
                                data={filteredData}
                                totalGuests={totalGuests}
                                filterDate={filteredDate}
                                filterRestaurant={filteredRestaurant}
                            />
                        }
                        fileName={`kitchen_report_${filteredRestaurant}_${filteredDate}.pdf`}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
                        text-white font-medium px-5 py-2 rounded-lg shadow-md transition"
                    >
                        {({ loading }) => (loading ? 'Generating…' : 'Export PDF')}
                    </PDFDownloadLink>
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] bg-white shadow-lg rounded-xl">
                <table className="min-w-full text-base text-gray-800">
                    <thead className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="p-3">Guest</th>
                            <th className="p-3">Room</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Time</th>
                            <th className="p-3">Guests</th>
                            <th className="p-3">Restaurant</th>
                            <th className="p-3">Main Courses</th>
                            <th className="p-3">Extras</th>
                            <th className="p-3">Upsell Total</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((res) => (
                            <tr key={res.id} className="border-t hover:bg-blue-50 transition">
                                <td className="p-3">{res.name || 'N/A'}</td>
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
                                    {res.upsell_total_price ? `$${res.upsell_total_price}` : '—'}
                                </td>
                                <td className="p-3">
                                    {res.upsell_items && Object.values(res.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0)
                                        ? <span className="text-sm">{res.paid ? 'Paid' : 'Not paid'}</span>
                                        : <span className="text-gray-400">—</span>
                                    }
                                </td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-200 border-t sticky bottom-0 z-10 shadow-inner">
                            <td className="p-3" colSpan={4}>Total</td>
                            <td className="p-3">{totalGuests}</td>
                            <td className="p-3" colSpan={3}></td>
                            <td className="p-3">{/* Upsell total (not shown) */}</td>
                            <td className="p-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

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

export default KitchenDashboard;
