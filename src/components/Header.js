import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { sectionLabels } from "../constants/sectionLabels";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";

const Header = ({
  introRef,
  servicesRef,
  infoRef,
  setScrollTarget,
  isCustomLoggedIn,
  setIsCustomLoggedIn,
  setCustomUser,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const clerk = useClerk();

  const isLoggedIn = isSignedIn || isCustomLoggedIn;  // Clerk 로그인 또는 커스텀 로그인 중 하나라도 true면 로그인 상태로 간주

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
  const handleBoardClick = () => navigate("/board"); // 로그인 여부는 App에서 판단


  //로그아웃
  const handleLogout = async () => {
    // Clerk 로그아웃
    signOut();
    // 커스텀 로그인 토큰 삭제 및 상태 초기화
    localStorage.removeItem("token");
    setIsCustomLoggedIn(false);
    setCustomUser(null);

    alert("로그아웃하였습니다.");

    navigate("/")
    // 로그아웃 후 메인 페이지 이동

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
              onClick={handleBoardClick}
            >
              {sectionLabels["board"]}
            </div>
          </div>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <UserButton />
              <button onClick={handleLogout} className="custom-blue-btn">
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="custom-blue-btn">
              로그인
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
