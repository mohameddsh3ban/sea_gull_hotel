import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "@/firebase";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";

export default function ProtectedRoute({ children, requiredRole }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setState({ loading: false, ok: false });

      // Force-refresh to pick up any new custom claims
      const token = await getIdTokenResult(u, true);
      const role = token.claims.role || "guest";

      const allowed =
        !requiredRole
          ? true
          : Array.isArray(requiredRole)
            ? requiredRole.includes(role)
            : role === requiredRole;

      setState({ loading: false, ok: allowed });
    });
    return () => unsub();
  }, [requiredRole]);

  if (state.loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-slate-300 border-t-transparent" />
      </div>
    );
  }

  if (!state.ok) return <Navigate to="/login" replace />;
  return children;
}
