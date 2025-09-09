import React, {useEffect, useMemo, useRef, useState} from "react";
import {Link} from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "../../css/Admin.css";

import AdminStats from "./components/AdminStats";
import UsersTable from "./components/UsersTable";
import CalendarPanel from "./components/CalendarPanel";
import EmotionStatus from "./components/EmotionStatus";
import PostsPanel from "./components/PostsPanel";

import {getAdminStats} from "./services/adminApi";
import {useAuth} from "../../AuthContext";

export default function AdminPage() {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(dayjs());
    const {profile} = useAuth();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        users: [],
    });

    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const searchWrapRef = useRef(null);
    const inputRef = useRef(null);

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

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return stats.users;
        return stats.users.filter((u) =>
            [u?.nickname, u?.email, u?.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [stats.users, search]);

    const suggestions = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        const pool = new Set();
        for (const u of stats.users) {
            if (u?.nickname) pool.add(String(u.nickname));
            if (u?.email) {
                const mail = String(u.email);
                pool.add(mail);
                const [local, domain] = mail.split("@");
                if (local) pool.add(local);
                if (domain) pool.add(domain);
            }
            if (u?.phone) pool.add(String(u.phone));
        }
        const arr = Array.from(pool);
        const starts = [];
        const contains = [];
        for (const v of arr) {
            const low = v.toLowerCase();
            if (low.startsWith(q)) starts.push(v);
            else if (low.includes(q)) contains.push(v);
        }
        const sortByQuality = (a, b) => {
            const la = a.length, lb = b.length;
            if (la !== lb) return la - lb;
            return a.localeCompare(b, "ko");
        };
        starts.sort(sortByQuality);
        contains.sort(sortByQuality);
        return [...starts, ...contains].slice(0, 8);
    }, [stats.users, search]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (!searchWrapRef.current) return;
            if (!searchWrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const onKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((prev) =>
                prev <= 0 ? suggestions.length - 1 : prev - 1
            );
        } else if (e.key === "Enter") {
            if (activeIdx >= 0 && activeIdx < suggestions.length) {
                e.preventDefault();
                setSearch(suggestions[activeIdx]);
                setOpen(false);
                setActiveIdx(-1);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIdx(-1);
            inputRef.current?.blur();
        }
    };

    if (!profile || String(profile.role || "").toUpperCase() !== "ADMIN") {
        return <div className="admin-no-access">접근 권한이 없습니다.</div>;
    }

    return (
        <div className="admin">
            <Link to="/" className="admin-logo-link">
                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="admin-logo"/>
            </Link>

            <header className="admin-header">
                <h1>🧑‍💼 관리자 대시보드 👩‍💼</h1>

                {/* 검색 */}
                <div className="admin-search" ref={searchWrapRef}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setOpen(true);
                            setActiveIdx(-1);
                        }}
                        onFocus={() => search && setOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder="고객명, 이메일, 전화번호 검색"
                    />
                    {open && suggestions.length > 0 && (
                        <ul className="suggest-list">
                            {suggestions.map((s, idx) => (
                                <li
                                    key={s}
                                    className={`suggest-item ${idx === activeIdx ? "active" : ""}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSearch(s);
                                        setOpen(false);
                                    }}
                                >
                                    {s}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            {/* 상단 통계 */}
            <AdminStats totalUsers={stats.totalUsers} totalPosts={stats.totalPosts}/>

            {/* 하단 패널 (왼쪽: 유저+감정 / 오른쪽: 캘린더+게시글) */}
            <div className="admin-grid-2col">
                <div className="col">
                    <div className="card">
                        <UsersTable users={filteredUsers} search={search}/>
                    </div>
                    <div className="card">
                        <EmotionStatus/>
                    </div>
                </div>
                <div className="col">
                    <div className="card calendar-card">
                        <CalendarPanel date={date} setDate={setDate}/>
                    </div>
                    <div className="card">
                        <PostsPanel/>
                    </div>
                </div>
            </div>
        </div>
    );
}
