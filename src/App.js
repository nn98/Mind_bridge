import { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";

import "./css/App.css";
import "./css/board.css";
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

import Map from "./components/Map";
import Header from "./components/Header";
import Picture from "./components/Picture";
import SelfTest from "./components/SelfTest";
import BoardSection from "./components/BoardSection";
import ChatModal from "./components/ChatModal";
import Footer from "./components/Footer";
import AboutSection from "./components/AboutSection";
import AuthSection from "./components/AuthSection";
import FloatingSidebar from "./components/FloatingSidebar";
import Faq from "./components/Faq";
import HospitalRegionPage from "./components/HospitalRegionPage";
import EmotionAnalysisPage from "./components/EmotionAnalysisPage";

import { sectionLabels } from "./constants/sectionLabels";
import { formInputs } from "./constants/formInputs";
import { buttonLabels } from "./constants/buttonLabels";
import { formLinks } from "./constants/formLinks";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, user } = useUser();

  // 중앙에서 로그인 상태 관리
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(false);
  const [customUser, setCustomUser] = useState(null);

  const sharedProps = { isCustomLoggedIn, customUser }; //로그인 상태 확인

  const [selectedChat, setSelectedChat] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [subMenuVisible, setSubMenuVisible] = useState(null);
  const [signupState, setSignupState] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("chat");
  const [resultText, setResultText] = useState("");
  const [testType, setTestType] = useState("우울증");
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(""));
  const [mapVisible, setMapVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [isOutsideClicked, setIsOutsideClicked] = useState(false);

  const loginRef = useRef(null);
  const introRef = useRef(null);
  const servicesRef = useRef(null);
  const locationRef = useRef(null);
  const infoRef = useRef(null);

  // 커스텀 로그인 상태 및 사용자 정보 초기 로딩
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsCustomLoggedIn(true);
      axios
        .get("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCustomUser(res.data);
        })
        .catch((err) => {
          console.error("유저 정보 불러오기 실패:", err);
          setCustomUser(null);
          setIsCustomLoggedIn(false);
        });
    } else {
      setIsCustomLoggedIn(false);
      setCustomUser(null);
    }
  }, []);

  // 로그인 상태 변화 로그 출력 (디버깅용)
  useEffect(() => {
    console.log("✅ isSignedIn:", isSignedIn);
    console.log("✅ isCustomLoggedIn:", isCustomLoggedIn);
    console.log("✅ Clerk user:", user);
    console.log("✅ Custom user:", customUser);
  }, [isSignedIn, isCustomLoggedIn, user, customUser]);

  // 커스텀 로그인 성공 시 홈으로 이동
  useEffect(() => {
    if (isCustomLoggedIn && customUser) {
      // 현재 경로가 로그인 페이지일 때만 홈으로 이동
      if (["/login", "/signup"].includes(location.pathname)) {
        navigate("/");
      }
    }
  }, [isCustomLoggedIn, customUser, navigate, location.pathname]);

  // 로그인/회원가입 모달 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target) &&
        ["/login", "/signup", "/find-id", "/find-password"].includes(
          location.pathname
        )
      ) {
        setIsOutsideClicked(true);
      } else {
        setIsOutsideClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [location]);

  const showSection = (section) => {
    const routes = {
      about: "/",
      faq: "/faq",
      self: "/self",
      board: "/board",
      img: "/img",
      signup: "/signup",
      login: "/login",
      map: "/map",
      region: "/hospital-region",
      chat: "popup-map",
    };
    if (section === "chat") {
      setMapVisible(true);
    } else {
      navigate(routes[section] || "/");
    }
  };

  // 로그인 상태에 따라 게시판 접근 제어
  const BoardRouteElement = () => {
    if (isCustomLoggedIn && customUser === null) {
      return <div>사용자 정보 불러오는 중...</div>;
    }

    if (isSignedIn && user) {
      return <BoardSection user={user} isSignedIn={true} />;
    }

    if (isCustomLoggedIn && customUser) {
      return <BoardSection user={customUser} isSignedIn={true} />;
    }

    return <Navigate to="/login" />;
  };

  // 로그인/회원가입 등 AuthSection 모달 래퍼
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
          sectionLabels={sectionLabels}
          formInputs={formInputs}
          buttonLabels={buttonLabels}
          formLinks={formLinks}
          signupState={signupState}
          setSignupState={setSignupState}
          onLoginSuccess={() => setIsOutsideClicked(false)}
          {...extraProps}
        />
      )}
    </div>
  );

  return (
    <>
      {!["/login", "/signup", "/find-id", "/find-password"].includes(
        location.pathname
      ) && (
        <Header
          introRef={introRef}
          servicesRef={servicesRef}
          infoRef={infoRef}
          setScrollTarget={setScrollTarget}
          isCustomLoggedIn={isCustomLoggedIn}
          setIsCustomLoggedIn={setIsCustomLoggedIn}
          setCustomUser={setCustomUser}
        />
      )}

      {!["/login", "/signup", "/find-id", "/find-password"].includes(
        location.pathname
      ) && (
        <FloatingSidebar
          mapVisible={mapVisible}
          setMapVisible={setMapVisible}
          faqVisible={faqVisible}
          setFaqVisible={setFaqVisible}
        />
      )}

      {faqVisible &&
        !["/login", "/signup", "/find-id", "/find-password"].includes(
          location.pathname
        ) && <Faq />}

      {mapVisible &&
        !["/login", "/signup", "/find-id", "/find-password"].includes(
          location.pathname
        ) && (
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
        <Route
          path="/"
          element={
            <AboutSection
              refs={{ introRef, locationRef, servicesRef, infoRef }}
              scrollTarget={scrollTarget}
              setScrollTarget={setScrollTarget}
            />
          }
        />
        <Route path="/map" element={<Map />} />
        <Route path="/hospital-region" element={<HospitalRegionPage />} />
        <Route path="/board" element={<BoardRouteElement />} />
        <Route path="/img" element={<Picture />} />
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
        <Route path="/emotion-analysis" element={<EmotionAnalysisPage />} />
        <Route
          path="/login"
          element={
            isSignedIn ? (
              <Navigate to="/" />
            ) : (
              authSectionWrapper("login", {
                setIsCustomLoggedIn,
                setCustomUser,
              })
            )
          }
        />
        <Route path="/logout" element={<AuthSection type="logout" />} />
        <Route
          path="/signup"
          element={
            isSignedIn ? <Navigate to="/board" /> : authSectionWrapper("signup")
          }
        />
        <Route path="/find-id" element={authSectionWrapper("find-id")} />
        <Route
          path="/find-password"
          element={
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
              {(!isOutsideClicked ||
                location.pathname !== "/find-password") && (
                <AuthSection
                  type="find-password"
                  sectionLabels={sectionLabels}
                  formInputs={formInputs}
                  buttonLabels={buttonLabels}
                  formLinks={formLinks}
                  signupState={signupState}
                  setSignupState={setSignupState}
                  onFindPasswordSuccess={() => setIsOutsideClicked(false)}
                />
              )}
            </div>
          }
        />
      </Routes>

      <ChatModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        tab={tab}
        setTab={setTab}
        selected={selectedChat}
        setSelectedChat={setSelectedChat}
        resultText={resultText}
      />

      {!["/login", "/signup", "/find-id", "/find-password"].includes(
        location.pathname
      ) && <Footer setIsOpen={setIsOpen} isOpen={isOpen} />}
    </>
  );
};

export default App;
