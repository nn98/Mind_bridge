import React, { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
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
  const [signupState, setSignupState] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [resultText, setResultText] = useState('');
  const [testType, setTestType] = useState('우울증');
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(''));
  const [userLocation, setUserLocation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [faqVisible, setFaqVisible] = useState(false);


  const introRef = useRef(null);
  const noticeRef = useRef(null);
  const locationRef = useRef(null);
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
        noticeRef={noticeRef}
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


      {faqVisible && (
        <>
          <div className="faq-container">
            <h2 style={{ margin: '0 auto' }}>자주묻는질문</h2>
            <div className="faq-body">
              <div className="tab-content">
                <h3>Q. AI 상담이 실제 사람처럼 이야기하나요?</h3>
                A. Mind Bridge는 자연어 이해와 공감 대화를 기반으로 상담 서비스를 제공드리기 위해 노력하고 있습니다.
                <h3>Q. 개인 정보는 안전한가요?</h3> 
                A. 철저한 암호화와 보안 시스템으로 보호되고 있습니다
                <h3>Q. 이용 요금이 있나요?</h3>
                A. 기본 상담은 무료로 진행되며 추후 업데이트를 통해 기능이 추가되면 유료 버전이 생길수도 있습니다'</div>
            </div>
          </div>
        </>
      )}
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
            </button>
          </div>
          <Map />
        </div>
      )}

      <Routes>
        <Route path="/map" element={<Map />} />
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
          path="/"
          element={
            <AboutSection
              refs={{ introRef, noticeRef, locationRef }}
              scrollTarget={scrollTarget}
              setScrollTarget={setScrollTarget}
            />
          }
        />
        <Route
          path="/board"
          element={<BoardSection user={user} isSignedIn={isSignedIn} />}
        />
        <Route path="/img" element={<Picture />} />

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
