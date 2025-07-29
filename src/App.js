import { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

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

import Map from "./components/Map.js";
import Header from "./components/Header";
import Picture from "./components/Picture.js";
import SelfTest from "./components/SelfTest";
import BoardSection from "./components/BoardSection";
import ChatModal from "./components/ChatModal";
import Footer from "./components/Footer";
import AboutSection from "./components/AboutSection";
import AuthSection from "./components/AuthSection";
import FloatingSidebar from "./components/FloatingSidebar";
import Faq from "./components/Faq";
import HospitalRegionPage from "./components/HospitalRegionPage.js";
import EmotionAnalysisPage from "./components/EmotionAnalysisPage.js";

import { sectionLabels } from "./constants/sectionLabels";
import { formInputs } from "./constants/formInputs";
import { buttonLabels } from "./constants/buttonLabels";
import { formLinks } from "./constants/formLinks";

const App = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [setSelectedBoard] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [subMenuVisible, setSubMenuVisible] = useState(null);
  const [signupState, setSignupState] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("chat");
  const [chatInput] = useState("");
  const [resultText, setResultText] = useState("");
  const [testType, setTestType] = useState("우울증");
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(""));
  const [mapVisible, setMapVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [faqVisible, setFaqVisible] = useState(false);
  const [customUser, setCustomUser] = useState(null); //게시판 로그인 정보
  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(false);

  // 로그인/회원가입/아이디찾기/비밀번호찾기 외부 클릭 상태 추가
  const [isOutsideClicked, setIsOutsideClicked] = useState(false);
  const loginRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsCustomLoggedIn(true);
    else setIsCustomLoggedIn(false);
  }, []);

  useEffect(() => {
    console.log("✅ isSignedIn:", isSignedIn);
    console.log("✅ isCustomLoggedIn:", isCustomLoggedIn);
    console.log("✅ Clerk user:", user);
    console.log("✅ Custom user:", customUser);
  }, [isSignedIn, isCustomLoggedIn, user, customUser]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target) &&
        (location.pathname === "/login" ||
          location.pathname === "/signup" ||
          location.pathname === "/find-id" ||
          location.pathname === "/find-password")
      ) {
        setIsOutsideClicked(true);
      } else if (
        location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password"
      ) {
        setIsOutsideClicked(false); // 다른 페이지로 이동 시 초기화
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [location]);

  const introRef = useRef(null);
  const servicesRef = useRef(null);
  const locationRef = useRef(null);
  const infoRef = useRef(null);

  const handleMouseEnter = (menu) => setHoveredMenu(menu);
  const handleMouseLeaveAll = (e) => {
    try {
      const from = e.currentTarget;
      const to = e.relatedTarget;
      if (!from.contains(to)) {
        setHoveredMenu(null);
        setSubMenuVisible(null);
      }
    } catch {
      setHoveredMenu(null);
      setSubMenuVisible(null);
    }
  };

  const handleBoardSelect = (value) => {
    if (value === "adminBoard" && !isAdmin) {
      alert("관리자만 접근 가능합니다.");
      return;
    }
    setSelectedBoard(value);
    navigate("/board");
  };

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

  return (
    <>
      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password" && (
          <Header
            hoveredMenu={hoveredMenu}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeaveAll={handleMouseLeaveAll}
            setSubMenuVisible={setSubMenuVisible}
            subMenuVisible={subMenuVisible}
            handleBoardSelect={handleBoardSelect}
            introRef={introRef}
            servicesRef={servicesRef}
            locationRef={locationRef}
            showSection={showSection}
            navigate={navigate}
            setScrollTarget={setScrollTarget}
            isCustomLoggedIn={isCustomLoggedIn}
            setIsCustomLoggedIn={setIsCustomLoggedIn}
          />
        )}

      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password" && (
          <FloatingSidebar
            mapVisible={mapVisible}
            setMapVisible={setMapVisible}
            faqVisible={faqVisible}
            setFaqVisible={setFaqVisible}
          />
        )}

      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password" &&
        faqVisible && <Faq />}

      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password" &&
        mapVisible && (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: "0 auto" }}>내 주변 병원 지도</h2>
            </div>
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
        <Route
          path="/board"
          element={
            isSignedIn || isCustomLoggedIn ? (
              <BoardSection
                user={isSignedIn ? user : customUser}
                isSignedIn={isSignedIn || isCustomLoggedIn}
              />
            ) : (
              <Navigate to="/board" />
            )
          }
        />
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
                {(!isOutsideClicked || location.pathname !== "/login") && (
                  <AuthSection
                    type="login"
                    setIsCustomLoggedIn={setIsCustomLoggedIn}
                    setCustomUser={setCustomUser}
                    sectionLabels={sectionLabels}
                    formInputs={formInputs}
                    buttonLabels={buttonLabels}
                    formLinks={formLinks}
                    signupState={signupState}
                    onLoginSuccess={() => setIsOutsideClicked(false)}
                  />
                )}
              </div>
            )
          }
        />
        <Route path="/logout" element={<AuthSection type="logout" />} />
        <Route
          path="/signup"
          element={
            isSignedIn ? (
              <Navigate to="/board" />
            ) : (
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
                {(!isOutsideClicked || location.pathname !== "/signup") && (
                  <AuthSection
                    type="signup"
                    setSignupState={setSignupState}
                    sectionLabels={sectionLabels}
                    formInputs={formInputs}
                    buttonLabels={buttonLabels}
                    formLinks={formLinks}
                    signupState={signupState}
                    onSignupSuccess={() => setIsOutsideClicked(false)}
                  />
                )}
              </div>
            )
          }
        />
        <Route
          path="/find-id"
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
              {(!isOutsideClicked || location.pathname !== "/find-id") && (
                <AuthSection
                  type="find-id"
                  sectionLabels={sectionLabels}
                  formInputs={formInputs}
                  buttonLabels={buttonLabels}
                  formLinks={formLinks}
                  signupState={signupState}
                  setSignupState={setSignupState}
                  onFindIdSuccess={() => setIsOutsideClicked(false)}
                />
              )}
            </div>
          }
        />
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
        chatInput={chatInput}
        resultText={resultText}
      />

      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/find-id" &&
        location.pathname !== "/find-password" && (
          <Footer setIsOpen={setIsOpen} isOpen={isOpen} />
        )}
    </>
  );
};

export default App;
