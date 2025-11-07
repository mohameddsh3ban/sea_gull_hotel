import React, { useState } from 'react';
import { signInWithEmailAndPassword, getIdTokenResult } from "firebase/auth";
import { auth } from "@/firebase";
import { useNavigate, useLocation } from 'react-router-dom';



const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');




  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin/dashboard';

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password); // ← added back
      const tokenResult = await getIdTokenResult(cred.user, true);
      const role = tokenResult.claims.role || "";

      onLogin?.(cred.user);

      if (!role) {
        setError("Your account doesn't have a department assigned. Please contact an admin.");
        setIsLoading(false);
        return;
      }

      if (from && typeof from === "string") {
        if (role === "admin" && from.startsWith("/admin")) return navigate(from, { replace: true });
        if (role === "reception" && from.startsWith("/reception")) return navigate(from, { replace: true });
        if (role === "kitchen" && from.startsWith("/kitchen")) return navigate(from, { replace: true });
        if (role === "accounting" && from.startsWith("/accounting")) return navigate(from, { replace: true });
      }

      const fallback = {
        admin: "/admin/dashboard",
        reception: "/reception/dashboard",
        kitchen: "/kitchen/dashboard",
        accounting: "/accounting/dashboard",
      }[role] || "/admin/dashboard";

      navigate(fallback, { replace: true, state: { role } });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    // AuthLayout provides the outer layout & card
    <form onSubmit={handleLogin} className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Admin Portal</h2>


      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@example.com"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>


      {/* Password field with icon + show/hide */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M7 10V8a5 5 0 0 1 10 0v2" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
            </svg>
          </span>

          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-11 py-3 text-gray-900 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              // Eye-off
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M9.88 5.1A9.76 9.76 0 0 1 12 5c6 0 9 7 9 7a17.39 17.39 0 0 1-3.06 3.94M6.24 6.24A17.93 17.93 0 0 0 3 12s3 7 9 7a9.8 9.8 0 0 0 3.06-.5" />
              </svg>
            ) : (
              // Eye
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full rounded-xl py-3 font-semibold text-white transition
          ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
      >
        {isLoading ? 'Logging in…' : 'Login'}
      </button>

      <p className="text-center text-xs text-gray-500">
        Having trouble?{" "}
        <a href="mailto:omar.modrek@hurghadaseagull.com" className="underline hover:text-gray-700">Contact support</a>
      </p>
    </form>
  );
};

export default Login;
