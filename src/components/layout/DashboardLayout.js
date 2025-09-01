import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import axios from "axios";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { profile, logoutSuccess } = useAuth();

  const isLoggedIn = !!profile;
  const role = String(profile?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const handleLogout = async () => {
    navigate("/logout");
  };

  // 메뉴 정의
  const menu = [
    { label: "챗 상담", to: "/", section: "탐색" },
    { label: "감성", to: "/emotion", section: "탐색" },
    { label: "이메일", to: "/img", section: "탐색" },
    { label: "게시판", to: "/board", section: "탐색" },

    { label: "병원", to: "/hospital-region", section: "서비스" },
    { label: "자료실", to: "/library", section: "서비스" },
    { label: "지도", to: "/map", section: "서비스" },

    // 계정 관련
    isLoggedIn && { label: "회원정보", to: "/profile", section: "계정" },
    !isAdmin && { label: "도움말/문의하기", to: "/help", section: "계정" },
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

    // 로그아웃 상태에서 보일 로그인(👉 섹션은 '로그인'으로 두되, 렌더링에서 '계정' 섹션 안으로 합침)
    !isLoggedIn && { label: "로그인", to: "/login", section: "로그인" },
  ].filter(Boolean);

  // 상단(탐색/서비스 등) 섹션 목록
  const sections = menu.reduce(
    (acc, m) => (acc.includes(m.section) ? acc : acc.concat(m.section)),
    []
  );

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

  // 계정 섹션에 넣을 아이템 = (로그아웃 시) 로그인 메뉴 + (로그인 시) 계정 메뉴들
  const accountItems = [
    // 계정 관련 메뉴(회원정보/관리자페이지/도움말/로그아웃 등)
    ...menu.filter((m) => m.section === "계정"),
    // 로그아웃 상태면 로그인 메뉴를 먼저
    ...menu.filter((m) => m.section === "로그인"),
  ];

  return (
    <div className="dash-wrap nav-open">
      <aside className="dash-sidebar">
        <div className="brand">
          <img src="/img/로고3.png" alt="Mind Bridge 로고" className="avatar" />
          <div className="brand-text">
            <div className="title">MindBridge</div>
          </div>
        </div>

        {/* 위쪽 메뉴들: '계정'과 '로그인' 제외 (탐색/서비스 등만) */}
        <div className="sidebar-top">
          {sections
            .filter((sec) => sec !== "계정" && sec !== "로그인")
            .map((sec) => (
              <nav key={sec} className="menu">
                <div className="menu-section">{sec}</div>
                {menu
                  .filter((m) => m.section === sec)
                  .map((m) => renderMenuItem(m))}
              </nav>
            ))}
        </div>

        {/* 아래쪽: 항상 '계정' 섹션으로만 표시, 그 안에 로그인/계정 아이템을 모두 넣음 */}
        <div className="sidebar-bottom">
          <nav className="menu">
            <div className="menu-section">계정</div>
            {accountItems.map((m) => renderMenuItem(m))}
          </nav>
        </div>
      </aside>

      <main className="dash-content">
        <Outlet />
      </main>
    </div>
  );
}
