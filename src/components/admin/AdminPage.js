import React, { useEffect, useMemo, useRef, useState } from "react";
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

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    users: [],
  });

  // dropdown UI 제어
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchWrapRef = useRef(null);
  const inputRef = useRef(null);

  // 최초 1회 로드
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

  // ====== 테이블 필터링 (닉네임/이메일/전화번호) ======
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stats.users;
    return stats.users.filter((u) =>
      [u?.nickname, u?.email, u?.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [stats.users, search]);

  // ====== 자동완성/연관 검색어 생성 ======
  // - 닉네임 / 이메일(local-part, domain) / 전화번호에서 후보 생성
  // - startsWith 가중치 → includes 순서
  // - 중복 제거 후 최대 8개
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

    // 길이/가까운 매치 우선정렬
    const sortByQuality = (a, b) => {
      const la = a.length, lb = b.length;
      if (la !== lb) return la - lb; // 짧은게 위
      return a.localeCompare(b, "ko");
    };

    starts.sort(sortByQuality);
    contains.sort(sortByQuality);

    return [...starts, ...contains].slice(0, 8);
  }, [stats.users, search]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 키보드 네비게이션
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
        applySuggestion(suggestions[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  const applySuggestion = (value) => {
    setSearch(value);
    setOpen(false);
    setActiveIdx(-1);
  };

  // 권한 체크
  if (!profile || String(profile.role || "").toUpperCase() !== "ADMIN") {
    return <div className="admin-no-access">접근 권한이 없습니다.</div>;
  }

  return (
    <div className="admin">
      <Link to="/" className="admin-logo-link">
        <img src="/img/로고1.png" alt="Mind Bridge 로고" className="admin-logo" />
      </Link>

      <header className="admin-header">
        <h1>🧑‍💼 관리자 대시보드 👩‍💼</h1>

        {/* 🔎 검색 + 자동완성 드롭다운 */}
        <div
          className="admin-search"
          ref={searchWrapRef}
          role="combobox"
          aria-expanded={open}
          aria-owns="search-suggest-list"
        >
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
            aria-autocomplete="list"
            aria-controls="search-suggest-list"
            aria-label="유저 검색"
          />

          {/* ▼ 제안 리스트 */}
          {open && suggestions.length > 0 && (
            <ul id="search-suggest-list" className="suggest-list" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={idx === activeIdx}
                  className={`suggest-item ${idx === activeIdx ? "active" : ""}`}
                  onMouseDown={(e) => {
                    // blur 전에 확정되도록 mousedown 사용
                    e.preventDefault();
                    applySuggestion(s);
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span className="suggest-text">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AdminStats totalUsers={stats.totalUsers} totalPosts={stats.totalPosts} />

        <div className="admin-container">
          {/* ▶ 상단 행 ◀ */}
          <div className="section-row">
            <UsersTable users={filteredUsers} search={search} />
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
