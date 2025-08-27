import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function PrivateRoute() {
    const { profile, loading } = useAuth?.() ?? {};
    const location = useLocation();
    if (loading) return <div>Loading...</div>;
    return profile ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}
