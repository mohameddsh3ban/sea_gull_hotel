import React, { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";

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
    colGuest: { width: '15%' },
    colRoom: { width: '10%' },
    colDate: { width: '10%' },
    colTime: { width: '10%' },
    colGuests: { width: '8%' },
    colRestaurant: { width: '12%' },
    colCourses: { width: '18%' },
    colExtras: { width: '9%' },
    colMoney: { width: '8%' }, // Upsell Total / Status
    colPaid: { width: '8%' }
});

const API_BASE = 'https://reservation-backend-demo.onrender.com';

const formatMoney = (v) => {
    if (v === 0 || v === '0' || v === '0.00') return '$0.00';
    if (v == null) return '—';
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—';
};

const AccountingDashboard = () => {
    const navigate = useNavigate();

    // inputs
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [restaurantFilter, setRestaurantFilter] = useState('all');
    const [upsellFilter, setUpsellFilter] = useState('all');

    // data & state
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [err, setErr] = useState('');

    // filtered rows
    const filteredData = useMemo(() => {
        return reservations.filter((r) => {
            const restaurantOk =
                restaurantFilter === 'all' ? true : r.restaurant === restaurantFilter;
            const upsellValue = Number(r?.upsell_total_price) || 0;
            const upsellOk =
                upsellFilter === 'all'
                    ? true
                    : upsellFilter === 'with'
                        ? upsellValue > 0
                        : upsellValue === 0; // 'without'
            return restaurantOk && upsellOk;
        });
    }, [reservations, restaurantFilter, upsellFilter]);

    // totals
    const totalGuests = useMemo(
        () => filteredData.reduce((s, r) => s + (parseInt(r.guests) || 0), 0),
        [filteredData]
    );
    const totalUpsell = useMemo(
        () => filteredData.reduce((s, r) => s + (Number(r.upsell_total_price) || 0), 0),
        [filteredData]
    );

    const loadData = async () => {
        setErr('');
        if (!fromDate || !toDate) {
            setErr('Please select both From and To dates.');
            return;
        }
        if (fromDate > toDate) {
            setErr('“From” date must be on or before “To” date.');
            return;
        }

        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                navigate('/login', { replace: true, state: { from: '/accounting/dashboard' } });
                setIsLoading(false);
                return;
            }
            const token = await user.getIdToken();
            const params = new URLSearchParams({ from: fromDate, to: toDate });
            const res = await fetch(`${API_BASE}/accounting/reservations?${params}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.status === 401 || res.status === 403) {
                navigate('/login', { replace: true, state: { from: '/accounting/dashboard' } });
                return;
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fetch failed');
            setReservations(data);
        } catch (e) {
            console.error(e);
            setErr(e.message || 'Failed to fetch');
        } finally {
            setIsLoading(false);
        }
    };

    // PDF
    const ReservationsPDF = ({ data }) => (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.h1}>Restaurant Reservations</Text>
                <Text>{`Date range: ${fromDate || '—'} → ${toDate || '—'}`}</Text>
                <Text>{`Restaurant: ${restaurantFilter === 'all' ? 'All' : restaurantFilter}`}</Text>
                <Text>{`Generated on: ${new Date().toLocaleString()}`}</Text>

                <View style={styles.table}>
                    {/* header */}
                    <View style={styles.tableRow}>
                        <Text style={[styles.colBase, styles.colGuest, styles.tableHeaderText]} wrap>Guest</Text>
                        <Text style={[styles.colBase, styles.colRoom, styles.tableHeaderText]} wrap>Room</Text>
                        <Text style={[styles.colBase, styles.colDate, styles.tableHeaderText]} wrap>Date</Text>
                        <Text style={[styles.colBase, styles.colTime, styles.tableHeaderText]} wrap>Time</Text>
                        <Text style={[styles.colBase, styles.colGuests, styles.tableHeaderText]} wrap>Guests</Text>
                        <Text style={[styles.colBase, styles.colRestaurant, styles.tableHeaderText]} wrap>Restaurant</Text>
                        <Text style={[styles.colBase, styles.colCourses, styles.tableHeaderText]} wrap>Main Courses</Text>
                        <Text style={[styles.colBase, styles.colExtras, styles.tableHeaderText]} wrap>Extras</Text>
                        <Text style={[styles.colBase, styles.colMoney, styles.tableHeaderText]} wrap>Upsell</Text>
                        <Text style={[styles.colBase, styles.colMoney, styles.tableHeaderText]} wrap>Status</Text>
                    </View>

                    {/* rows */}
                    {data.map((r, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.colBase, styles.colGuest]} wrap>{r.name || 'N/A'}</Text>
                            <Text style={[styles.colBase, styles.colRoom]} wrap>{r.room || ''}</Text>
                            <Text style={[styles.colBase, styles.colDate]} wrap>{r.date || ''}</Text>
                            <Text style={[styles.colBase, styles.colTime]} wrap>{r.time || ''}</Text>
                            <Text style={[styles.colBase, styles.colGuests]} wrap>{r.guests || ''}</Text>
                            <Text style={[styles.colBase, styles.colRestaurant]} wrap>{r.restaurant || 'N/A'}</Text>
                            <Text style={[styles.colBase, styles.colCourses]} wrap>
                                {Array.isArray(r.main_courses) ? r.main_courses.join(', ') : (r.main_course || '—')}
                            </Text>
                            <Text style={[styles.colBase, styles.colExtras]} wrap>
                                {r.upsell_items
                                    ? Object.entries(r.upsell_items)
                                        .filter(([_, c]) => c > 0)
                                        .map(([item, c]) => `${item} × ${c}`)
                                        .join(', ')
                                    : '—'}
                            </Text>
                            <Text style={[styles.colBase, styles.colMoney]} wrap>
                                {formatMoney(r.upsell_total_price)}
                            </Text>
                            <Text style={[styles.colBase, styles.colMoney]} wrap>
                                {r.upsell_items && Object.values(r.upsell_items).some((c) => (parseInt(c, 10) || 0) > 0)
                                    ? (r.paid ? 'Paid' : 'Not paid')
                                    : '—'}
                            </Text>
                        </View>
                    ))}

                    {/* footer */}
                    <View style={[styles.tableRow, { backgroundColor: '#eee' }]}>
                        <Text style={[styles.colBase, styles.colGuest]} wrap>Totals</Text>
                        <Text style={[styles.colBase, styles.colRoom]} />
                        <Text style={[styles.colBase, styles.colDate]} />
                        <Text style={[styles.colBase, styles.colTime]} />
                        <Text style={[styles.colBase, styles.colGuests]} wrap>{totalGuests}</Text>
                        <Text style={[styles.colBase, styles.colRestaurant]} />
                        <Text style={[styles.colBase, styles.colCourses]} />
                        <Text style={[styles.colBase, styles.colExtras]} />
                        <Text style={[styles.colBase, styles.colMoney]} wrap>{formatMoney(totalUpsell)}</Text>
                        <Text style={[styles.colBase, styles.colPaid]} />
                    </View>
                </View>
            </Page>
        </Document>
    );

    return (
        <div className="max-w-6xl mx-auto p-8 pt-24">
            {/* Title (no logout, to match Kitchen) */}
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Restaurant Reservations</h1>
            </header>

            {/* Filters block (same style as Kitchen, buttons aligned) */}
            {/* Filters block – everything INSIDE one white container */}
            <div className="mb-6">
                <div className="w-full bg-white shadow-md rounded-lg px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">From</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">To</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Restaurant</label>
                            <select
                                value={restaurantFilter}
                                onChange={(e) => setRestaurantFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="all">All Restaurants</option>
                                <option value="Oriental">Oriental</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Italian">Italian</option>
                                <option value="Indian">Indian</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Upsell</label>
                            <select
                                value={upsellFilter}
                                onChange={(e) => setUpsellFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="all">All</option>
                                <option value="with">With Upsell</option>
                                <option value="without">Without Upsell</option>
                            </select>
                        </div>

                        {/* Actions INSIDE the box, right-aligned on desktop */}
                        <div className="flex md:justify-end gap-3">
                            <button
                                onClick={loadData}
                                disabled={isLoading}
                                className={`px-3 py-2 rounded-lg text-white transition h-[42px] ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                    }`}
                            >
                                {isLoading ? 'Loading…' : 'Load'}
                            </button>

                            {filteredData.length > 0 && (
                                <PDFDownloadLink
                                    document={<ReservationsPDF data={filteredData} />}
                                    fileName={`accounting_report_${fromDate}_${toDate}.pdf`}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
                                         text-white font-medium px-3 py-2 h-[42px] rounded-lg shadow-md transition"
                                >
                                    {({ loading }) => (loading ? 'Generating…' : 'Export PDF')}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {err && <div className="text-red-600 mb-4">{err}</div>}

            {/* Table block — same visual language as Kitchen */}
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
                        {filteredData.map((res) => (
                            <tr key={res.id} className="border-t hover:bg-blue-50 transition">
                                <td className="p-3">{res.name || 'N/A'}</td>
                                <td className="p-3">{res.room}</td>
                                <td className="p-3">{res.date}</td>
                                <td className="p-3">{res.time}</td>
                                <td className="p-3">{res.guests}</td>
                                <td className="p-3">{res.restaurant || 'N/A'}</td>
                                <td className="p-3">
                                    {Array.isArray(res.main_courses)
                                        ? res.main_courses.join(', ')
                                        : res.main_course || '—'}
                                </td>
                                <td className="p-3">
                                    {res.upsell_items
                                        ? Object.entries(res.upsell_items)
                                            .filter(([_, count]) => count > 0)
                                            .map(([item, count]) => `${item} × ${count}`)
                                            .join(', ')
                                        : '—'}
                                </td>
                                <td className="p-3">{formatMoney(res.upsell_total_price)}</td>
                                <td className="p-3">
                                    {res.upsell_items &&
                                        Object.values(res.upsell_items).some(
                                            (c) => (parseInt(c, 10) || 0) > 0
                                        ) ? (
                                        <span className="text-sm">
                                            {res.paid ? 'Paid' : 'Not paid'}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-200 border-t sticky bottom-0 z-10 shadow-inner">
                            <td className="p-3" colSpan={4}>
                                Total
                            </td>
                            <td className="p-3">{totalGuests}</td>
                            <td className="p-3" colSpan={3}></td>
                            <td className="p-3">{formatMoney(totalUpsell)}</td>
                            <td className="p-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AccountingDashboard;
