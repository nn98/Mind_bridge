import { Outlet } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function PrivateRoute() {
    // const { profile, loading } = useAuth();
    // const location = useLocation();
    const { loading } = useAuth();
    if (loading) return <div>Loading...</div>;

    // return profile ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
    return <Outlet />;
}
