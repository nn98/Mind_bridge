import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "../../css/Admin.css";

import AdminStats from "./components/AdminStats";
import UsersTable from "./components/UsersTable";
import CalendarPanel from "./components/CalendarPanel";
import EmotionStatus from "./components/EmotionStatus";
import PostsPanel from "./components/PostsPanel";

import { getAdminStats } from "./services/adminApi";
import { useAuth } from "../../AuthContext";

export default function AdminPage() {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(dayjs());
    const { profile } = useAuth();

    // 총 유저 / 총 게시글 / 유저 정보 배열
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        users: [],
    });

    // ✅ 최초 1회만 로드 (기존 코드의 무한루프 원인: [stats] 의존성 제거)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const data = await getAdminStats(token);
                setStats(data);
            } catch (error) {
                console.error("관리자 통계 불러오기 실패:", error);
            }
        };
        fetchStats();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            console.log("입력된 값:", search);
            setSearch("");
        }
    };

    // 권한 체크
    if (!profile || profile.role.toUpperCase() !== "ADMIN") {
        return <div className="admin-no-access">접근 권한이 없습니다.</div>;
    }

    return (
        <div className="admin">
            <Link to="/" className="admin-logo-link">
                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="admin-logo" />
            </Link>

            <header className="admin-header">
                <h1>🧑‍💼 관리자 대시보드 👩‍💼</h1>

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="고객명"
                />

                <AdminStats totalUsers={stats.totalUsers} totalPosts={stats.totalPosts} />

                <div className="admin-container">
                    {/* ▶ 상단 행 ◀ */}
                    <div className="section-row">
                        <UsersTable users={stats.users} />
                        <CalendarPanel date={date} setDate={setDate} />
                    </div>

                    {/* ▶ 하단 행 ◀ */}
                    <div className="section-row">
                        <EmotionStatus />
                        <PostsPanel />
                    </div>
                </div>
            </header>
        </div>
    );
}
