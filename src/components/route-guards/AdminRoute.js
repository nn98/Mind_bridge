// src/components/admin/AdminRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../AuthContext";

export default function AdminRoute() {
    const { profile, loading, fetchProfile } = useAuth();
    const location = useLocation();

    // 토큰/세션 있고 프로필이 없으면 한 번 가져오기
    useEffect(() => {
        const token = localStorage.getItem("token"); // "LOGIN"(쿠키세션) 포함
        if (!profile && token && typeof fetchProfile === "function") {
            fetchProfile().catch(() => { });
        }
    }, [profile, fetchProfile]);

    // 1) 로딩 중
    if (loading) return <div>Loading...</div>;

    // 2) 로그인 안 됨 → 로그인으로
    if (!profile) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3) 관리자 여부 판정 (role | roles[] | authorities[])
    const roles = [
        profile.role,
        ...(Array.isArray(profile.roles) ? profile.roles : []),
        ...(Array.isArray(profile.authorities)
            ? profile.authorities.map((a) => (typeof a === "string" ? a : a?.authority))
            : []),
    ]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase());

    const isAdmin =
        roles.includes("ADMIN") || roles.includes("ROLE_ADMIN") || profile.isAdmin === true;

    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
