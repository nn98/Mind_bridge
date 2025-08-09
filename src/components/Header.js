import { Link, useNavigate, useLocation } from "react-router-dom";

const Header = ({
  introRef,
  servicesRef,
  infoRef,
  setScrollTarget,
  isCustomLoggedIn,
  customUser,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = isCustomLoggedIn;

  const scrollOrNavigate = (ref, target) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    } else {
      if (location.pathname !== "/") {
        navigate("/");
      }
      setScrollTarget?.(target);
    }
  };

  const handleScrollToIntro = () => scrollOrNavigate(introRef, "intro");
  const handleScrollToServices = () => scrollOrNavigate(servicesRef, "services");
  const handleScrollToInfo = () => scrollOrNavigate(infoRef, "info");
  const handleBoardClick = () => navigate("/board");

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <header className="header">
      <div id="google_translate_element" className="translate"></div>
      <nav className="nav">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <img src="/img/로고2.png" alt="Mind Bridge 로고" className="logo" />
          </Link>
        </div>

        <div className="nav-center">
          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: "pointer" }} onClick={handleScrollToIntro}>
              소개
            </div>
          </div>
          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: "pointer" }} onClick={handleScrollToServices}>
              서비스
            </div>
          </div>
          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: "pointer" }} onClick={handleScrollToInfo}>
              정보
            </div>
          </div>
          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: "pointer" }} onClick={handleBoardClick}>
              게시판
            </div>
          </div>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <span className="user-welcome-text">
                {customUser?.nickname || '사용자'}님 환영합니다!
              </span>

              {customUser?.role === "ADMIN" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="custom-blue-btn ml-4"
                  style={{ minWidth: "120px" }}
                >
                  관리자 페이지
                </button>
              )}

              <button onClick={handleLogout} className="custom-blue-btn ml-4">
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="custom-blue-btn"
            >
              로그인
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
