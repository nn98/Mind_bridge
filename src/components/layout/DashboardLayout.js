import { Outlet, NavLink } from "react-router-dom";

export default function DashboardLayout({ currentUser, onLogout }) {

  const isLoggedIn = !!currentUser;
  const role = String(currentUser?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const  menu = [
    { label: "챗 상담", to: "/", section: "탐색" },
    { label: "감성", to: "/emotion", section: "탐색" },
    { label: "이미지", to: "/img", section: "탐색" },
    { label: "게시판", to: "/board", section: "탐색" },

    { label: "병원", to: "/hospital-region", section: "서비스" },
    { label: "자료실", to: "/library", section: "서비스" },
    { label: "지도", to: "/map", section: "서비스" },

    // 계정 관련 (비관리자 & 로그인 상태에서만)
    !isAdmin &&
      isLoggedIn && { label: "회원정보", to: "/profile", section: "계정" },
    !isAdmin &&
      isLoggedIn && { label: "문의하기", to: "/contact", section: "계정" },

    { label: "도움말", to: "/help", section: "계정" },

    // 비로그인: 로그인 메뉴를 "로그인" 섹션에
    !isLoggedIn && { label: "로그인", to: "/login", section: "로그인" },

    // 로그인 상태: 같은 메뉴 목록 안에서 관리자/로그아웃 노출
    isAdmin &&
      isLoggedIn && {
        label: "관리자 페이지",
        to: "/admin",
        section: "계정",
        adminShortcut: true,
      },
    isLoggedIn && {
      label: "로그아웃",
      to: "__logout__",
      section: "계정",
      isLogout: true,
    },
  ].filter(Boolean);

  // 섹션 묶기 (순서 유지)
  const sections = menu.reduce((acc, m) => {
    if (!acc.includes(m.section)) acc.push(m.section);
    return acc;
  }, []);

  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    else console.warn("onLogout prop이 전달되지 않았습니다.");
  };

  // 메뉴 아이템 렌더
  const renderMenuItem = (m) => {
    if (m.isLogout) {
      return (
        <button
          key="__logout__"
          className="menu-item btn-like"
          onClick={handleLogout}
          type="button"
        >
          {m.label}
        </button>
      );
    }
    return (
      <NavLink
        key={m.to}
        to={m.to}
        end={m.to === "/"}
        className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
      >
        {m.label}
      </NavLink>
    );
  };

  return (
    <div className="dash-wrap nav-open">
      {/* 사이드바 */}
      <aside className="dash-sidebar">
        <div className="brand">
          <img src="/img/로고1.png" alt="Mind Bridge 로고" className="avatar" />
          <div className="brand-text">
            <div className="title">MindBridge</div>
          </div>
        </div>

        {/* 메뉴 섹션 */}
        {sections.map((sec) => (
          <nav key={sec} className="menu">
            <div className="menu-section">{sec}</div>
            {menu
              .filter((m) => m.section === sec)
              .map((m) => renderMenuItem(m))}
          </nav>
        ))}
      </aside>

      {/* 메인 */}

        <main className="dash-content">
          <Outlet />
        </main>
      
    </div>
  );
}
