// src/pages/admin/Reviews.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";

const API_BASE = "https://reservation-backend-demo.onrender.com";

function toDate(x) {
    // Try to parse whatever the backend sends (ISO string expected)
    try { return x ? new Date(x) : null; } catch { return null; }
}

function fmt(dt) {
    if (!dt) return "";
    return dt.toLocaleString();
}

async function authFetch(url, opts = {}) {
    const auth = getAuth();
    const user = auth.currentUser;

    // 🔑 force refresh to pick up custom claims (like role: "admin")
    const token = user ? await user.getIdToken(true) : null;

    const headers = {
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
    };

    const res = await fetch(url, { ...opts, headers });

    // optional: throw for 401/403 so UI can show it
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
            (body.error && body.message)
                ? `${body.error}: ${body.message}`
                : (body.message || body.error || `Request failed with ${res.status}`);
        // log full body so we can see Firestore errors in console
        console.error("reviews API error", body);
        throw new Error(msg);
    }

    return res;
}

export default function Reviews() {
    const [restaurantId, setRestaurantId] = useState("Italian"); // default
    const [sort, setSort] = useState("newest"); // newest | oldest
    const [pageSize, setPageSize] = useState(10); // 10 | 25 | 50
    const [limit, setLimit] = useState(10); // grows with "Load more"
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ count: 0, avg: 0, histogram: {} });
    const [periodDays, setPeriodDays] = useState(90); // 7 | 30 | 90
    const [error, setError] = useState("");
    const [showBreakdown, setShowBreakdown] = useState(false);


    // Fetch summary + initial list
    useEffect(() => {
        let isMounted = true;
        (async () => {
            setError("");
            setLoading(true);
            try {
                // 1) summary
                const sRes = await authFetch(
                    `${API_BASE}/api/reviews/summary?restaurantId=${encodeURIComponent(
                        restaurantId
                    )}&period_days=${periodDays}`
                );
                const sData = await sRes.json();
                if (isMounted) setSummary(sData);

                // 2) log
                const lRes = await authFetch(
                    `${API_BASE}/api/reviews/log?restaurantId=${encodeURIComponent(
                        restaurantId
                    )}&limit=${limit}`
                );
                const lData = await lRes.json();

                let arr = (lData.items || []).map((r) => ({
                    ...r,
                    _createdAt: toDate(r.createdAt),
                }));

                if (sort === "oldest") {
                    arr = [...arr].reverse();
                }

                if (isMounted) setItems(arr);
            } catch (e) {
                if (isMounted) setError(e.message || String(e));
                if (isMounted) setItems([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [restaurantId, sort, limit, periodDays]);




    const histogramRows = useMemo(() => {
        const hist = summary?.histogram || {};
        const keys = Object.keys(hist).sort((a, b) => Number(a) - Number(b));
        return keys.map((k) => ({ score: k, count: hist[k] || 0 }));
    }, [summary]);

    function reloadNewLimit(newLimit) {
        setLimit(newLimit);
    }

    function loadMore() {
        reloadNewLimit(limit + pageSize);
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-4">Restaurant Reviews</h1>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Restaurant</label>
                    <select
                        value={restaurantId}
                        onChange={(e) => {
                            setRestaurantId(e.target.value);
                            setLimit(pageSize); // reset paging when restaurant changes
                        }}
                        className="w-full border p-2 rounded"
                    >
                        <option value="Italian">Italian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Indian">Indian</option>
                        <option value="Oriental">Oriental</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Sort</label>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full border p-2 rounded"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Page size</label>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const ps = Number(e.target.value);
                            setPageSize(ps);
                            setLimit(ps); // reset to one page
                        }}
                        className="w-full border p-2 rounded"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Period</label>
                    <div className="flex gap-2">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => {
                                    setPeriodDays(d);
                                    setLimit(pageSize); // reset list when period changes
                                }}
                                className={`px-3 py-1 rounded text-sm ${periodDays === d
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => reloadNewLimit(pageSize)}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2"
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </div>


            {/* Summary */}
            <div className="bg-white rounded-xl shadow p-4 mb-4">
                <div className="flex flex-wrap items-center gap-6">
                    <div>
                        <div className="text-sm text-gray-600">Average</div>
                        <div className="text-2xl font-semibold">
                            {summary?.avg?.toFixed?.(2) || "0.00"}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Total Reveiws</div>
                        <div className="text-2xl font-semibold">{summary?.count || 0}</div>
                    </div>
                </div>

                {/* Breakdown toggle */}
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setShowBreakdown((v) => !v)}
                        className="px-3 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-700"
                    >
                        {showBreakdown ? "Hide breakdown" : "Review count per guest rating"}
                    </button>
                </div>

                {/* Bar chart breakdown */}
                {showBreakdown && (
                    <div className="mt-4 space-y-2">
                        {histogramRows.length === 0 ? (
                            <div className="text-gray-500">No reviews in the last 90 days.</div>
                        ) : (
                            histogramRows.map((row) => {
                                const max = Math.max(...histogramRows.map((r) => r.count || 0), 1);
                                const widthPct = Math.round(((row.count || 0) / max) * 100);
                                return (
                                    <div key={row.score} className="flex items-center gap-3">
                                        <div className="w-10 text-sm text-gray-600">{row.score}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                            <div
                                                className="h-4 bg-blue-600"
                                                style={{ width: `${widthPct}%` }}
                                                aria-label={`${row.count} reviews for score ${row.score}`}
                                            />
                                        </div>
                                        <div className="w-10 text-right text-sm text-gray-700">
                                            {row.count}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Error (for fetch failures) */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4">
                    {error}
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl shadow">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="font-semibold">Showing {items.length} reviews</div>
                    {loading && <div className="text-sm text-gray-500">Loading…</div>}
                </div>

                <div className="divide-y">
                    {items.map((r) => (
                        <div key={r.id} className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-lg font-semibold">
                                    {r.rating}/10
                                </div>
                                <div className="text-sm text-gray-500">
                                    {fmt(r._createdAt)}
                                </div>
                            </div>

                            {/* Optional fields if you stored them */}
                            <div className="text-sm text-gray-700 mt-1">
                                {r.guestName ? <span>Guest: {r.guestName} • </span> : null}
                                {r.room ? <span>Room: {r.room} • </span> : null}
                                {r.guestEmail ? <span>Email: {r.guestEmail}</span> : null}
                            </div>

                            {r.comment && (
                                <div className="mt-2 text-gray-800">{r.comment}</div>
                            )}

                            <div className="mt-2 text-xs text-gray-500">
                                Reservation ID: {r.reservationId}
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && !loading && (
                        <div className="p-6 text-gray-500">No reviews to show.</div>
                    )}
                </div>

                {items.length >= limit && (
                    <div className="p-4 border-t flex items-center justify-center">
                        <button
                            onClick={loadMore}
                            className="bg-blue-600 text-white rounded px-4 py-2"
                            disabled={loading}
                        >
                            Load more
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

}
