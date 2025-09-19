import {Outlet, NavLink, useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "../../AuthContext";
import {Link} from "react-router-dom";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();   // ✅ 현재 경로 확인
    const {profile} = useAuth();

    const isLoggedIn = !!profile;
    const role = String(profile?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

    const handleLogout = async () => {
        navigate("/logout");
    };

    const menu = [
        {label: "챗 상담", to: "/", section: "탐색"},
        {label: "감성", to: "/emotion", section: "탐색"},
        {label: "이메일", to: "/img", section: "탐색"},
        {label: "게시판", to: "/board", section: "탐색"},
        {label: "병원 목록", to: "/map", section: "서비스"},
        {label: "자료실", to: "/library", section: "서비스"},
        isLoggedIn && {label: "회원정보", to: "/profile", section: "계정"},
        !isAdmin && {label: "도움말/문의하기", to: "/help", section: "계정"},
        isAdmin && isLoggedIn && {
            label: "관리자 페이지",
            to: "/admin",
            section: "계정",
            adminShortcut: true,
        },
        isLoggedIn && {label: "로그아웃", to: "__logout__", section: "계정", isLogout: true},
        !isLoggedIn && {label: "로그인", to: "/login", section: "로그인"},
    ].filter(Boolean);

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
                className={({isActive}) => `menu-item ${isActive ? "active" : ""}`}
            >
                {m.label}
            </NavLink>
        );
    };

    const accountItems = [
        ...menu.filter((m) => m.section === "계정"),
        ...menu.filter((m) => m.section === "로그인"),
    ];

    // ✅ "/" 경로일 때만 dash-content, 나머지는 plain-content
    const mainClass = location.pathname === "/" ? "dash-content" : "plain-content";

    return (
        <div className="dash-wrap nav-open">
            <aside className="dash-sidebar">
                <div className="brand">
                    <Link to="/" className="brand" aria-label="챗 상담으로 이동">
                        <img src="/img/로고3.png" alt="Mind Bridge 로고" className="avatar"/>
                        <div className="brand-text">
                            <div className="title">MindBridge</div>
                        </div>
                    </Link>
                </div>

                <div className="sidebar-top">
                    {sections
                        .filter((sec) => sec !== "계정" && sec !== "로그인")
                        .map((sec) => (
                            <nav key={sec} className="menu">
                                <div className="menu-section">{sec}</div>
                                {menu.filter((m) => m.section === sec).map((m) => renderMenuItem(m))}
                            </nav>
                        ))}
                </div>

                <div className="sidebar-bottom">
                    <nav className="menu">
                        <div className="menu-section">계정</div>
                        {accountItems.map((m) => renderMenuItem(m))}
                    </nav>
                </div>
            </aside>

            {/* ✅ "/"에서만 dash-content */}
            <main className={mainClass}>
                <Outlet/>
            </main>
        </div>
    );
}
