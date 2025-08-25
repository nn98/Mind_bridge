// src/App.jsx
import { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

import "./css/App.css";
import "./css/chat.css";
import "./css/feature.css";
import "./css/header.css";
import "./css/hero.css";
import "./css/login.css";
import "./css/map.css";
import "./css/small_translate.css";
import "./css/FloatingChatButton.css";
import "./css/selfTest.css";
import "./css/result.css";
import "./css/banner.css";
import "./css/HospitalRegionPage.css";
import "./css/dashboard.css";
import "./css/theme.css";

import Map from "./components/Map";
import Picture from "./components/Picture";
import SelfTest from "./components/SelfTest";
import AboutSection from "./components/about/AboutSection/AboutSectionMain";
import { BoardSection } from "./components/board/BoardSectionmain";
import AuthSection from "./components/AuthSection";
import FloatingSidebar from "./components/FloatingSidebar";
import Faq from "./components/Faq";
import HospitalRegionPage from "./components/HospitalRegionPage";
import EmotionAnalysisPage from "./components/EmotionAnalysisPage";
import ResourceLibrary from "./components/ResourceLibrary";
import AdminPage from "./components/admin/AdminPage";
import KakaoWaitPage from "./components/KakaoWaitPage";
import UserProfile from "./components/chat-modal/components/UserProfile";
import HelpPage from './components/HelpPage';

import DashboardLayout from "./components/layout/DashboardLayout";
import ChatConsult from "./components/dashboard/ChatConsult";
import AuthLoadingPage from './components/AuthLoadingPage'

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [appToast, setAppToast] = useState({ show: false, message: "" });

  const [customUser, setCustomUser] = useState(null);
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(false);

  const [signupState, setSignupState] = useState("");
  const [tab, setTab] = useState("chat");
  const [resultText, setResultText] = useState("");
  const [testType, setTestType] = useState("우울증");
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(""));
  const [mapVisible, setMapVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [isOutsideClicked, setIsOutsideClicked] = useState(false);

  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);

  // ✅ 중앙 챗 → 모달로 넘길 첫 질문
  const [bootstrapQuery, setBootstrapQuery] = useState("");

  const loginRef = useRef(null);
  const introRef = useRef(null);
  const servicesRef = useRef(null);
  const locationRef = useRef(null);
  const infoRef = useRef(null);

  const Toast = ({ message, show }) => (show ? <div className="app-toast">{message}</div> : null);

  const isAuthPageOrAdmin = ["/login", "/signup", "/find-id", "/find-password", "/admin"].includes(
    location.pathname
  );

  // "/" 에서는 헤더/푸터 숨김 (네 로직 유지)
  const isDashboard = location.pathname === "/";
  const hideShell = isAuthPageOrAdmin || isDashboard;

  console.log(`LoggedIn? : ${isCustomLoggedIn}`);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCustomUser(null);
    setIsCustomLoggedIn(false);
    navigate("/login", { replace: true, state: { message: "로그아웃되었습니다." } });
  };

  useEffect(() => {
    if (location.state?.message) {
      setAppToast({ show: true, message: location.state.message });
      setTimeout(() => setAppToast({ show: false, message: "" }), 3000);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isCustomLoggedIn && customUser && ["/login", "/signup"].includes(location.pathname)) {
      navigate("/");
    }
  }, [isCustomLoggedIn, customUser, navigate, location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target) &&
        ["/login", "/signup", "/find-id", "/find-password"].includes(location.pathname)
      ) {
        setIsOutsideClicked(true);
      } else {
        setIsOutsideClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [location]);

  const BoardRouteElement = () => {
    if (isCustomLoggedIn && customUser === null) return <div>사용자 정보 불러오는 중...</div>;
    if (isCustomLoggedIn && customUser) return <BoardSection user={customUser} />;
    return <Navigate to="/login" state={{ message: "로그인이 필요한 서비스입니다." }} />;
  };

  const authSectionWrapper = (type, extraProps = {}) => (
    <div
      ref={loginRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#f5f5f5",
        zIndex: 1000,
      }}
    >
      {!isOutsideClicked && (
        <AuthSection
          type={type}
          signupState={signupState}
          setSignupState={setSignupState}
          {...extraProps}
        />
      )}
    </div>
  );

  const handleConsultSubmit = (text) => {
    setBootstrapQuery(text);
    setTab("chat");
  };

  return (
    <>
      {/* 기존 헤더/플로팅/FAQ/지도는 hideShell로 제어 */}
      {!hideShell && (
        <>
          <FloatingSidebar
            mapVisible={mapVisible}
            setMapVisible={setMapVisible}
            faqVisible={faqVisible}
            setFaqVisible={setFaqVisible}
          />
        </>
      )}

      {faqVisible && !hideShell && <Faq />}

      {mapVisible && !hideShell && (
        <div
          style={{
            position: "fixed",
            top: "150px",
            right: "150px",
            zIndex: 1000,
            background: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            borderRadius: "12px",
            padding: "10px",
          }}
        >
          <h2 style={{ textAlign: "center" }}>내 주변 병원 지도</h2>
          <Map />
        </div>
      )}

      <Routes>
        <Route element={<DashboardLayout currentUser={customUser} onLogout={handleLogout} />}>
          <Route index element={<ChatConsult customUser={customUser} />} />
          <Route path="/emotion" element={<EmotionAnalysisPage mode="page" />} />
          <Route path="/img" element={<Picture customUser={customUser} isCustomLoggedIn={isCustomLoggedIn} />} />
          <Route path="/board" element={<BoardRouteElement />} />
          <Route path="/hospital-region" element={<HospitalRegionPage />} />
          <Route path="/library" element={<ResourceLibrary />} />
          <Route path="/map" element={<Map />} />
          <Route path="/help" element={<HelpPage />} />
          {isCustomLoggedIn && customUser && (
            <>
              <Route
                path="/profile"
                element={<UserProfile
                  customUser={customUser}
                  isCustomLoggedIn={isCustomLoggedIn}
                  setCustomUser={setCustomUser}
                  setIsCustomLoggedIn={setIsCustomLoggedIn}
                />
                } />
              <Route path="/contact" element={<div style={{ padding: 16 }}><h1>문의하기</h1></div>} />
            </>
          )}
        </Route>

        {/* 레이아웃 밖 라우트들 */}
        <Route
          path="/login/wait"
          element={
            <KakaoWaitPage
              isCustomLoggedIn={isCustomLoggedIn}
              setCustomUser={setCustomUser}
              setIsCustomLoggedIn={setIsCustomLoggedIn}
              signupState={signupState}
              setSignupState={setSignupState}
            />
          }
        />
        <Route
          path="/auth/loading"
          element={
            <AuthLoadingPage
              setCustomUser={setCustomUser}
              setIsCustomLoggedIn={setIsCustomLoggedIn}
            />
          }
        />
        <Route
          path="/admin"
          element={
            isCustomLoggedIn && customUser?.role === "ADMIN" ? (
              <AdminPage currentUser={customUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/legacy-home"
          element={
            <AboutSection
              refs={{ introRef, locationRef, servicesRef, infoRef }}
              scrollTarget={scrollTarget}
              setScrollTarget={setScrollTarget}
              setIsEmotionModalOpen={setIsEmotionModalOpen}
            />
          }
        />
        <Route
          path="/self"
          element={
            <SelfTest
              testType={testType}
              setTestType={setTestType}
              selfAnswers={selfAnswers}
              handleSelfAnswer={(i, v) => {
                const newAnswers = [...selfAnswers];
                newAnswers[i] = v;
                setSelfAnswers(newAnswers);
              }}
              handleSelfSubmit={(r) => setResultText(r)}
              resultText={resultText}
              setSelfAnswers={setSelfAnswers}
              setResultText={setResultText}
            />
          }
        />
        <Route path="/login" element={authSectionWrapper("login", { setIsCustomLoggedIn, setCustomUser })} />
        <Route
          path="/logout"
          element={<AuthSection type="logout" setIsCustomLoggedIn={setIsCustomLoggedIn} setCustomUser={setCustomUser} />}
        />
        <Route path="/signup" element={authSectionWrapper("signup")} />
        <Route path="/find-id" element={authSectionWrapper("find-id")} />
        <Route
          path="/find-password"
          element={authSectionWrapper("find-password", { onFindPasswordSuccess: () => setIsOutsideClicked(false) })}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toast show={appToast.show} message={appToast.message} />
    </>
  );
};

export default App;
