// src/components/admin/services/AdminPage.js
import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "../../css/Admin.css";

import AdminStats from "./components/AdminStats";
import UsersTable from "./components/UsersTable";
import CalendarPanel from "./components/CalendarPanel";
import PostsPanel from "./components/PostsPanel";

import {getAdminStats} from "./services/adminApi";
import {useAuth} from "../../AuthContext";

// ✅ MetallicPaintWrapper 로고
import MetallicPaintWrapper from "./components/MetallicPaintWrapper";

export default function AdminPage() {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(dayjs());
    const {profile} = useAuth();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        users: [],
    });

    // 🔥 기본 섹션은 "users"
    const [section, setSection] = useState("users");

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

    // 🔥 유저 검색 필터 (닉네임 기준)
    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return stats.users;
        return stats.users.filter((u) =>
            String(u?.nickname || "").toLowerCase().includes(q)
        );
    }, [stats.users, search]);

    // 🔥 현재 선택된 섹션에 따라 화면 결정
    const renderSection = () => {
        switch (section) {
            case "users":
                return (
                    <>
                        <div className="admin-section-header">
                            <span className="admin-section-icon">👤</span>
                            <span className="admin-section-title-text">유저 정보</span>
                        </div>

                        <AdminStats
                            totalUsers={stats.totalUsers}
                            totalPosts={stats.totalPosts}
                        />

                        <div className="user-search-bar">
                            <input
                                type="text"
                                placeholder="닉네임 검색"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <UsersTable users={filteredUsers} showTitle={false}/>
                    </>
                );
            case "calendar":
                return <CalendarPanel date={date} setDate={setDate}/>;
            case "posts":
                return <PostsPanel/>;
            default:
                return (
                    <>
                        <div className="section-header">
                            <span className="section-icon">👤</span>
                            <span className="section-title">유저 정보</span>
                        </div>
                        <UsersTable users={filteredUsers}/>
                        <AdminStats
                            totalUsers={stats.totalUsers}
                            totalPosts={stats.totalPosts}
                        />
                    </>
                );
        }
    };

    if (!profile || String(profile.role || "").toUpperCase() !== "ADMIN") {
        return <div className="admin-no-access">접근 권한이 없습니다.</div>;
    }

    return (
        <div className="admin-layout">
            {/* 🔥 사이드바 */}
            <aside className="admin-sidebar">
                <Link to="/" className="admin-logo-link">
                    <div style={{width: 200, height: 200, marginLeft: "-15px"}}>
                        <MetallicPaintWrapper/>
                    </div>
                </Link>
                <button
                    className={`side-btn ${section === "users" ? "active" : ""}`}
                    onClick={() => setSection("users")}
                >
                    👥 유저 관리
                </button>
                <button
                    className={`side-btn ${section === "calendar" ? "active" : ""}`}
                    onClick={() => setSection("calendar")}
                >
                    📅 캘린더
                </button>
                <button
                    className={`side-btn ${section === "posts" ? "active" : ""}`}
                    onClick={() => setSection("posts")}
                >
                    📝 게시글
                </button>
            </aside>

            {/* 🔥 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>🧑‍💼 관리자 대시보드 👩‍💼</h1>
                </header>

                <div className="admin-section">{renderSection()}</div>
            </main>
        </div>
    );
}
