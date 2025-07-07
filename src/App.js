import React, { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut, UserButton, RedirectToSignIn } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import Map from './Map';

import './css/App.css';
import './css/board.css';
import './css/chat.css';
import './css/dropdown.css';
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

import Header from './components/Header';
import Picture from './Picture.js';
import SelfTest from './components/SelfTest';
import BoardSection from './components/BoardSection';
import ChatModal from './components/ChatModal';
import Footer from './components/Footer';
import AboutSection from './components/AboutSection';
import AuthSection from './components/AuthSection';
import FaqSection from './components/FaqSection';
import FloatingSidebar from './components/FloatingSidebar';

import { sectionLabels } from './constants/sectionLabels';
import { formInputs } from './constants/formInputs';
import { buttonLabels } from './constants/buttonLabels';
import { formLinks } from './constants/formLinks';

const App = () => {
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [subMenuVisible, setSubMenuVisible] = useState(null);
  const [visibility, setVisibility] = useState(null);
  const [signupState, setSignupState] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [resultText, setResultText] = useState('');
  const [testType, setTestType] = useState('우울증');
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(''));
  const [userLocation, setUserLocation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false); // 추가됨
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const introRef = useRef(null);
  const noticeRef = useRef(null);
  const locationRef = useRef(null);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!showSignIn || !showSignUp) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setFadeOutAndClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showSignUp, showSignIn]);

  // 페이드아웃 후 완전 닫기
  const setFadeOutAndClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      setShowSignUp(false);
      setShowSignIn(false);
      setFadeOut(false);
    }, 300); // CSS 애니메이션 시간과 맞춰주세요
  };

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
        onSigninClick={() => {
          setShowSignUp(false);
          setShowSignIn(true);
        }}
        onSignupClick={() => {
          setShowSignUp(true);
          setShowSignIn(false);
        }}
        hoveredMenu={hoveredMenu}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeaveAll={handleMouseLeaveAll}
        setSubMenuVisible={setSubMenuVisible}
        subMenuVisible={subMenuVisible}
        handleBoardSelect={handleBoardSelect}
        introRef={introRef}
        noticeRef={noticeRef}
        locationRef={locationRef}
        showSection={showSection}
        navigate={navigate}
      />
      {showSignIn && (
        <div
          className={`modal-backdrop ${fadeOut ? 'fade-out' : 'fade-in'}`}
          onClick={setFadeOutAndClose}
        >
          <div
            className={`modal-content ${fadeOut ? 'fade-out' : 'fade-in'}`}
            onClick={e => e.stopPropagation()} // 모달 내용 클릭 시 닫기 방지
          >
            <SignIn routing="virtual" />
            <button className="close-modal-btn" onClick={setFadeOutAndClose}>
              <span className="close-x-icon" aria-label="닫기">&times;</span>
            </button>
          </div>
        </div>
      )}
      {showSignUp && (
        <div
          className={`modal-backdrop ${fadeOut ? 'fade-out' : 'fade-in'}`}
          onClick={setFadeOutAndClose}
        >
          <div
            className={`modal-content ${fadeOut ? 'fade-out' : 'fade-in'}`}
            onClick={e => e.stopPropagation()} // 모달 내용 클릭 시 닫기 방지
          >
            <SignUp routing="virtual" />
            <button className="close-modal-btn" onClick={setFadeOutAndClose}>
              <span className="close-x-icon" aria-label="닫기">&times;</span>
            </button>
          </div>
        </div>
      )}
      <FloatingSidebar showSection={showSection} />

      {mapVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '200px',
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
            <button
              onClick={() => setMapVisible(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ✖
            </button>
          </div>
          <Map />
        </div>
      )}

      <Routes>
        <Route path="/map" element={<Map />} />
        <Route path="/" element={<AboutSection refs={{ introRef, noticeRef, locationRef }} />} />
        <Route path="/faq" element={<FaqSection />} />
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
          path="/board"
          element={<BoardSection user={user} isSignedIn={isSignedIn} />}
        />
        <Route path="/img" element={<Picture />} />
        <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
        <Route
          path="/find-id"
          element={
            <AuthSection
              type="find-id"
              sectionLabels={sectionLabels}
              formInputs={formInputs}
              buttonLabels={buttonLabels}
              formLinks={formLinks}
              setActiveSection={() => { }}
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
              setActiveSection={() => { }}
            />
          }
        />
      </Routes>

      <ChatModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        tab={tab}
        setTab={setTab}
        selectedz={selectedChat}
        setSelectedChat={setSelectedChat}
        chatInput={chatInput}
        resultText={resultText}
      />

      <Footer />
    </>
  );
};

export default App;
