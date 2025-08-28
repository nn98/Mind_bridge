import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import axios from "axios";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { profile, logoutSuccess } = useAuth();

  const isLoggedIn = !!profile;
  const role = String(profile?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const handleLogout = async (e) => {
    navigate("/logout");
  };

  const menu = [
    { label: "챗 상담", to: "/", section: "탐색" },
    { label: "감성", to: "/emotion", section: "탐색" },
    { label: "이메일", to: "/img", section: "탐색" },
    { label: "게시판", to: "/board", section: "탐색" },
    { label: "병원", to: "/hospital-region", section: "서비스" },
    { label: "자료실", to: "/library", section: "서비스" },
    { label: "지도", to: "/map", section: "서비스" },
    !isAdmin && isLoggedIn && { label: "회원정보", to: "/profile", section: "계정" },
    !isAdmin && { label: "도움말/문의하기", to: "/help", section: "계정" },
    !isLoggedIn && { label: "로그인", to: "/login", section: "로그인" },
    isAdmin && isLoggedIn && { label: "관리자 페이지", to: "/admin", section: "계정", adminShortcut: true },
    isLoggedIn && { label: "로그아웃", to: "__logout__", section: "계정", isLogout: true },
  ].filter(Boolean);

  const sections = menu.reduce((acc, m) => (acc.includes(m.section) ? acc : acc.concat(m.section)), []);

  const renderMenuItem = (m) => {
    if (m.isLogout) {
      return (
          <button key="__logout__" className="menu-item btn-like" onClick={handleLogout} type="button">
            {m.label}
          </button>
      );
    }
    return (
        <NavLink key={m.to} to={m.to} end={m.to === "/"} className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
          {m.label}
        </NavLink>
    );
  };

  return (
      <div className="dash-wrap nav-open">
        <aside className="dash-sidebar">
          <div className="brand">
            <img src="/img/로고1.png" alt="Mind Bridge 로고" className="avatar" />
            <div className="brand-text"><div className="title">MindBridge</div></div>
          </div>
          {sections.map((sec) => (
              <nav key={sec} className="menu">
                <div className="menu-section">{sec}</div>
                {menu.filter((m) => m.section === sec).map((m) => renderMenuItem(m))}
              </nav>
          ))}
        </aside>
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
  );
}
