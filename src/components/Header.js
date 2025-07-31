import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { sectionLabels } from "../constants/sectionLabels";
import { UserButton, useUser } from "@clerk/clerk-react";

const Header = ({ introRef, servicesRef, infoRef, setScrollTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isSignedIn } = useUser(); // Clerk 로그인 상태
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(false); // localStorage 토큰 기반 상태

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsCustomLoggedIn(!!token);
  }, [location]);

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
  const handleScrollToServices = () =>
    scrollOrNavigate(servicesRef, "services");
  const handleScrollToInfo = () => scrollOrNavigate(infoRef, "info");

  // 게시판 클릭 시 처리
  const handleBoardClick = () => {
    if (!isSignedIn && !isCustomLoggedIn) {
      alert("로그인 후 이용 가능합니다.");
      navigate("/login");
      return;
    }
    navigate("/board");
  };

  return (
    <header className="header">
      <div id="google_translate_element" className="translate"></div>
      <nav className="nav">
        <div className="nav-left">
          <Link
            to="/"
            style={{ display: "inline-block", width: "50px", height: "auto" }}
          >
            <img src="/img/로고2.png" alt="Mind Bridge 로고" className="logo" />
          </Link>
        </div>

        <div className="nav-center">
          <div className="nav-item-wrapper">
            <div
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={handleScrollToIntro}
            >
              {sectionLabels["about"]}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <div
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={handleScrollToServices}
            >
              {sectionLabels["services"]}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <div
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={handleScrollToInfo}
            >
              {sectionLabels["info"]}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <div
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={handleBoardClick} // 수정: handleBoardClick으로 변경
            >
              {sectionLabels["board"]}
            </div>
          </div>
        </div>

        <div className="nav-right">
          {isSignedIn || isCustomLoggedIn ? (
            <>
              <UserButton />
              <button
                onClick={() => navigate("/logout")}
                className="custom-blue-btn"
              >
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
