// src/components/AuthLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AuthLayout = ({
    logoSrc,
    brandName = 'BookEasy',
    heroSrc = '/images/hotel-hero.jpg',
    heroAlt = 'Reservation system',
    tabs = [],
    partner,
    links = [],
    children,
}) => {
    return (
        <div className="relative min-h-screen flex items-center justify-center">
            {/* Top logo */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                <img
                    src="/images/seagullwhite.png"
                    alt="Seagull"
                    className="h-20 md:h-24 w-auto"
                />
            </div>
            {/* Fullscreen background */}
            <img
                src={heroSrc}
                alt={heroAlt}
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" /> {/* overlay */}

            {/* Content */}
            <div className="relative z-10 w-full max-w-6xl px-4 py-10 md:py-16">
                <div className="grid gap-10 md:grid-cols-12 items-center">
                    {/* Caption */}
                    <div className="md:col-span-6 text-white">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
                            Seamless reservations for <span className="text-blue-300">Restaurants</span>
                        </h2>
                        <p className="mt-4 text-lg leading-relaxed text-gray-100 drop-shadow">
                            Manage bookings, covers, capacities, and guest lists — all from one elegant dashboard.
                        </p>
                    </div>

                    {/* Auth card */}
                    <div className="md:col-span-6 flex justify-center">
                        <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl p-6 md:p-8">
                            {/* Brand */}
                            <div className="mb-6 text-center">
                                {logoSrc ? (
                                    <img src={logoSrc} alt={brandName} className="h-10 mx-auto" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-wide text-blue-700">
                                        {brandName}
                                    </span>
                                )}
                            </div>

                            {/* Tabs */}
                            {tabs.length > 0 && (
                                <div className="mb-6 flex justify-center">
                                    <div className="inline-flex rounded-full bg-slate-100 p-1">
                                        {tabs.map((t) => (
                                            <NavLink
                                                key={t.to}
                                                to={t.to}
                                                end
                                                className={({ isActive }) =>
                                                    `px-4 py-2 text-sm font-medium rounded-full transition ${isActive
                                                        ? 'bg-white shadow text-blue-700'
                                                        : 'text-slate-600 hover:text-slate-800'
                                                    }`
                                                }
                                            >
                                                {t.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form card body */}
                            <div className="space-y-6">
                                {children ?? <Outlet />}
                            </div>

                            {/* Partner */}
                            {partner && (partner.label || partner.logoSrc) && (
                                <div className="mt-8 text-center">
                                    {partner.label && (
                                        <div className="text-sm text-slate-600 mb-2">{partner.label}</div>
                                    )}
                                    {partner.logoSrc && (
                                        <img src={partner.logoSrc} alt="Partner" className="h-5 mx-auto" />
                                    )}
                                </div>
                            )}

                            {/* Footer links */}
                            {links.length > 0 && (
                                <div className="mt-6 text-center text-sm text-slate-500">
                                    {links.map((l, i) => (
                                        <span key={l.to}>
                                            <a href={l.to} className="hover:text-slate-800 hover:underline">
                                                {l.label}
                                            </a>
                                            {i < links.length - 1 && <span className="mx-2">•</span>}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
