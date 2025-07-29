import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { sectionLabels } from "../constants/sectionLabels";
import { useUser, UserButton } from "@clerk/clerk-react";

const Header = ({ introRef, servicesRef, infoRef, setScrollTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser(); // 직접 로그인 상태 체크

  console.log("Header - isSignedIn:", isSignedIn);
  console.log("Header - isLoaded:", isLoaded);

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

  // Clerk 상태가 로딩 중이면 아무것도 안 보여주거나 로딩 UI를 넣을 수 있음
  if (!isLoaded) return null;

  return (
    <header className="header">
      <div id="google_translate_element" className="translate"></div>
      <nav className="nav">
        <div className="nav-left">
          <Link to="/">
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
              onClick={() =>
                (window.location.href =
                  "https://mind-bridge-zeta.vercel.app/board")
              }
            >
              {sectionLabels["board"]}
            </div>
          </div>
        </div>

        <div className="nav-right">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <button
              className="custom-blue-btn"
              onClick={() => navigate("/login")}
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
