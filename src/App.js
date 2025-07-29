// src/App.jsx
import { useState, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

import './css/App.css';
import './css/board.css';
import './css/chat.css';
import './css/feature.css';
import './css/header.css';
import './css/hero.css';
import './css/login.css';
import './css/map.css';
import './css/small_translate.css';
import './css/FloatingChatButton.css';
import './css/selfTest.css';
import './css/result.css';
import './css/banner.css';
import './css/HospitalRegionPage.css';

import Map from './components/Map.js';
import Header from './components/Header';
import Picture from './components/Picture.js';
import SelfTest from './components/SelfTest';
import BoardSection from './components/BoardSection';
import ChatModal from './components/ChatModal';
import Footer from './components/Footer';
import AboutSection from './components/AboutSection';
import AuthSection from './components/AuthSection';
import FloatingSidebar from './components/FloatingSidebar';
import Faq from "./components/Faq";
import HospitalRegionPage from './components/HospitalRegionPage.js';
import EmotionAnalysisPage from './components/EmotionAnalysisPage';

import { sectionLabels } from './constants/sectionLabels';
import { formInputs } from './constants/formInputs';
import { buttonLabels } from './constants/buttonLabels';
import { formLinks } from './constants/formLinks';

const App = () => {
  const [setSelectedBoard] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [subMenuVisible, setSubMenuVisible] = useState(null);
  const [signupState, setSignupState] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [chatInput] = useState('');
  const [resultText, setResultText] = useState('');
  const [testType, setTestType] = useState('우울증');
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(''));
  const [mapVisible, setMapVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [faqVisible, setFaqVisible] = useState(false);

  const introRef = useRef(null);
  const servicesRef = useRef(null);
  const locationRef = useRef(null);
  const infoRef = useRef(null);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  

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
    if (value === 'adminBoard' && !isAdmin) {
      alert('관리자만 접근 가능합니다.');
      return;
    }
    setSelectedBoard(value);
    navigate('/board');
  };

  const showSection = (section) => {
    const routes = {
      about: '/',
      faq: '/faq',
      self: '/self',
      board: '/board',
      img: '/img',
      signup: '/signup',
      login: '/login',
      map: '/map',
      region: '/hospital-region',
      chat: 'popup-map',
    };

    if (section === 'chat') {
      setMapVisible(true);
    } else {
      navigate(routes[section] || '/');
    }
  };

  return (
    <>
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
      />

      <FloatingSidebar
        mapVisible={mapVisible}
        setMapVisible={setMapVisible}
        faqVisible={faqVisible}
        setFaqVisible={setFaqVisible}
      />

      {faqVisible && <Faq />}

      {mapVisible && (
        <div
          style={{
            position: 'fixed',
            top: '150px',
            right: '150px',
            zIndex: 1000,
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            borderRadius: '12px',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: '0 auto' }}>내 주변 병원 지도</h2>
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
        <Route path="/board" element={<BoardSection user={user} isSignedIn={isSignedIn} />} />
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

        {/* 로그인 상태에 따른 접근 제어 */}
        <Route
          path="/login"
          element={
            isSignedIn ? (
              <Navigate to="/board" />
            ) : (
              <AuthSection
                type="login"
                sectionLabels={sectionLabels}
                formInputs={formInputs}
                buttonLabels={buttonLabels}
                formLinks={formLinks}
                signupState={signupState}
                setSignupState={setSignupState}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isSignedIn ? (
              <Navigate to="/board" />
            ) : (
              <AuthSection
                type="signup"
                sectionLabels={sectionLabels}
                formInputs={formInputs}
                buttonLabels={buttonLabels}
                formLinks={formLinks}
                signupState={signupState}
                setSignupState={setSignupState}
              />
            )
          }
        />
        <Route
          path="/find-id"
          element={
            <AuthSection
              type="find-id"
              sectionLabels={sectionLabels}
              formInputs={formInputs}
              buttonLabels={buttonLabels}
              formLinks={formLinks}
              signupState={signupState}
              setSignupState={setSignupState}
            />
          }
        />
        <Route
          path="/find-password"
          element={
            <AuthSection
              type="find-password"
              sectionLabels={sectionLabels}
              formInputs={formInputs}
              buttonLabels={buttonLabels}
              formLinks={formLinks}
              signupState={signupState}
              setSignupState={setSignupState}
            />
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

      <Footer />
    </>
  );
};

export default App;
