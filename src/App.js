import { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
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
import AboutSection from './components/about/AboutSection';
import AuthSection from "./components/AuthSection";
import FloatingSidebar from "./components/FloatingSidebar";
import Faq from "./components/Faq";
import HospitalRegionPage from "./components/HospitalRegionPage";
import EmotionAnalysisPage from "./components/EmotionAnalysisPage";
import ResourceLibrary from "./components/ResourceLibrary";
import AdminPage from "./components/AdminPage";


const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [appToast, setAppToast] = useState({ show: false, message: "" });

  const [isCustomLoggedIn, setIsCustomLoggedIn] = useState(!!localStorage.getItem("token"));
  const [customUser, setCustomUser] = useState(null);

  const [selectedChat, setSelectedChat] = useState(null);
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

  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);

  const loginRef = useRef(null);
  const introRef = useRef(null);
  const servicesRef = useRef(null);
  const locationRef = useRef(null);
  const infoRef = useRef(null);

  const Toast = ({ message, show }) => {
    if (!show) return null;
    return <div className="app-toast">{message}</div>;
  };

  const isAuthPageOrAdmin = [
    "/login",
    "/signup",
    "/find-id",
    "/find-password",
    "/admin",
  ].includes(location.pathname);

  useEffect(() => {
    fetchCustomUser();
  }, []);

  const fetchCustomUser = () => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCustomUser(res.data);
          setIsCustomLoggedIn(true);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setCustomUser(null);
          setIsCustomLoggedIn(false);
        });
    } else {
      setIsCustomLoggedIn(false);
      setCustomUser(null);
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setAppToast({ show: true, message: location.state.message });
      setTimeout(() => {
        setAppToast({ show: false, message: "" });
      }, 3000);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (
      isCustomLoggedIn &&
      customUser &&
      ["/login", "/signup"].includes(location.pathname)
    ) {
      navigate("/");
    }
  }, [isCustomLoggedIn, customUser, navigate, location.pathname]);

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

  const BoardRouteElement = () => {
    if (isCustomLoggedIn && customUser === null) {
      return <div>사용자 정보 불러오는 중...</div>;
    }
    if (isCustomLoggedIn && customUser) {
      return <BoardSection user={customUser} />;
    }
    return <Navigate to="/login" state={{ message: "로그인이 필요한 서비스입니다." }} />;
  };

  const authSectionWrapper = (type, extraProps = {}) => (
    <div
      ref={loginRef}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%",
        height: "100%", background: "#f5f5f5", zIndex: 1000,
      }}
    >
      {!isOutsideClicked && (
        <AuthSection
          type={type}
          signupState={signupState}
          setSignupState={setSignupState}
          onLoginSuccess={fetchCustomUser}
          {...extraProps}
        />
      )}
    </div>
  );

  return (
    <>
      {!isAuthPageOrAdmin && (
        <>
          <Header
            introRef={introRef}
            servicesRef={servicesRef}
            infoRef={infoRef}
            setScrollTarget={setScrollTarget}
            isCustomLoggedIn={isCustomLoggedIn}
            customUser={customUser}
          />
          <FloatingSidebar
            mapVisible={mapVisible}
            setMapVisible={setMapVisible}
            faqVisible={faqVisible}
            setFaqVisible={setFaqVisible}
          />
          <ChatModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            tab={tab}
            setTab={setTab}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            resultText={resultText}
            customUser={customUser}
            isCustomLoggedIn={isCustomLoggedIn}
          />
          <Toast message={appToast.message} show={appToast.show} />
        </>
      )}

      {faqVisible && !isAuthPageOrAdmin && <Faq />}

      {mapVisible && !isAuthPageOrAdmin && (
        <div style={{
          position: "fixed", top: "150px", right: "150px", zIndex: 1000,
          background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          borderRadius: "12px", padding: "10px",
        }}>
          <h2 style={{ textAlign: "center" }}>내 주변 병원 지도</h2>
          <Map />
        </div>
      )}

      <EmotionAnalysisPage
        isOpen={isEmotionModalOpen}
        onClose={() => setIsEmotionModalOpen(false)}
      />

      <Routes>
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
          path="/"
          element={
            <AboutSection
              refs={{
                introRef: introRef,
                locationRef: locationRef,
                servicesRef: servicesRef,
                infoRef: infoRef,
              }}
              scrollTarget={scrollTarget}
              setScrollTarget={setScrollTarget}
              setIsEmotionModalOpen={setIsEmotionModalOpen}
            />
          }
        />
        <Route path="/library" element={<ResourceLibrary />} />
        <Route path="/map" element={<Map />} />
        <Route path="/hospital-region" element={<HospitalRegionPage />} />
        <Route path="/board" element={<BoardRouteElement />} />
        <Route
          path="/img"
          element={
            <Picture
              customUser={customUser}
              isCustomLoggedIn={isCustomLoggedIn}
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
        <Route
          path="/login"
          element={authSectionWrapper("login", {
            setIsCustomLoggedIn,
            setCustomUser,
          })}
        />
        <Route
          path="/logout"
          element={
            <AuthSection
              type="logout"
              setIsCustomLoggedIn={setIsCustomLoggedIn}
              setCustomUser={setCustomUser}
            />
          }
        />
        <Route
          path="/signup"
          element={authSectionWrapper("signup")}
        />
        <Route path="/find-id" element={authSectionWrapper("find-id")} />
        <Route
          path="/find-password"
          element={authSectionWrapper("find-password", {
            onFindPasswordSuccess: () => setIsOutsideClicked(false),
          })}
        />
      </Routes>

      {!isAuthPageOrAdmin && <Footer setIsOpen={setIsOpen} isOpen={isOpen} setIsEmotionModalOpen={setIsEmotionModalOpen} />}
    </>
  );
};

export default App;
