import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function AdminRoute() {
    const { profile, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div>Loading...</div>;
    // if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;

    const role = String(profile.role || "").toUpperCase();
    return role === "ADMIN" ? <Outlet /> : <Navigate to="/" replace />;
}
