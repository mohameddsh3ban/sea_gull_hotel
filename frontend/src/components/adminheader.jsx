import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

const AdminHeader = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300";
  const getLinkClass = ({ isActive }) =>
    isActive
      ? `${linkBase} bg-white text-[#0f172a]`
      : `${linkBase} text-white/90 hover:text-white hover:bg-white/10`;

  return (
    <header className="sticky top-0 z-40 bg-[#1f2937]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1f2937]/80 text-white border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Taller header */}
        <div className="h-20 flex items-center justify-between">
          {/* Left: Logo (clickable) + Title (static, no feedback) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center focus:outline-none"
              aria-label="Go to Admin Dashboard"
            >
              <img src="/images/seagullwhite.png" alt="Hotel Logo" className="h-12 w-auto" />
            </button>
            {/* Static title — not a link, no hover/focus styles, no pointer */}
            <span className="text-lg sm:text-xl font-semibold select-none">
              Admin Panel
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/admin/dashboard" className={getLinkClass}>Dashboard</NavLink>
            <NavLink to="/admin/manage-capacities" className={getLinkClass}>Manage Capacities</NavLink>
            <NavLink to="/admin/capacity-overview" className={getLinkClass}>Capacity Overview</NavLink>
            <NavLink to="/admin/reviews" className={getLinkClass}>Reviews</NavLink>

            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-red-500/90 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
              aria-label="Logout"
            >
              Logout
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {/* Hamburger */}
            <svg className={`h-6 w-6 ${open ? 'hidden' : 'block'}`} viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {/* Close */}
            <svg className={`h-6 w-6 ${open ? 'block' : 'hidden'}`} viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            <NavLink to="/admin/dashboard" className={getLinkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>
            <NavLink to="/admin/manage-capacities" className={getLinkClass} onClick={() => setOpen(false)}>Manage Capacities</NavLink>
            <NavLink to="/admin/capacity-overview" className={getLinkClass} onClick={() => setOpen(false)}>Capacity Overview</NavLink>
            <NavLink to="/admin/reviews" className={getLinkClass} onClick={() => setOpen(false)}>Reviews</NavLink>

            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="w-full text-left mt-1 px-3 py-2 rounded-md text-sm font-medium bg-red-500/90 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;
