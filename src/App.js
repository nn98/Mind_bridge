import React, { useState, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

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
// import Picture from './Picture.js'; // <-- 이 줄을 제거하거나 주석 처리
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

  const introRef = useRef(null);
  const noticeRef = useRef(null);
  const locationRef = useRef(null);

  const navigate = useNavigate();

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
      email: '/email',
      signup: '/signup',
      login: '/login',
    };
    navigate(routes[section] || '/');
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
      />

      <FloatingSidebar showSection={showSection} />

      <Routes>
        <Route
          path="/"
          element={<AboutSection refs={{ introRef, noticeRef, locationRef }} />}
        />
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
          element={
            <BoardSection
              selectedBoard={selectedBoard}
              visibility={visibility}
              setVisibility={setVisibility}
            />
          }
        />
        {/* <Route path="/img" element={<section className="img-section"><Picture /></section>} /> */}
        {/* 이 /img 경로는 이제 ChatModal에서 이미지를 생성하므로 필요 없거나 다른 용도로 사용될 수 있습니다. */}
        {/* 만약 /img 경로로 직접 접근해서 이미지 생성 기능을 사용하고 싶다면, ImageGenerator 컴포넌트를 직접 렌더링해야 합니다. */}
        {/* 예시: <Route path="/img" element={<section className="img-section"><ImageGenerator promptText="default image prompt" /></section>} /> */}
        <Route
          path="/email"
          element={
            <section className="board-section">
              <h2>AI 상담 기록 메일 전송</h2>
            </section>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthSection
              type="signup"
              sectionLabels={sectionLabels}
              formInputs={formInputs}
              buttonLabels={buttonLabels}
              formLinks={formLinks}
              setActiveSection={() => {}}
              signupState={signupState}
              setSignupState={setSignupState}
            />
          }
        />
        <Route
          path="/login"
          element={
            <section className="form-section">
              <h2>{sectionLabels.login}</h2>
              {formInputs.login.map((input, i) => (
                <input key={i} type={input.type} placeholder={input.placeholder} className="input" />
              ))}
              <button className="button">{buttonLabels.login}</button>
            </section>
          }
        />
        <Route path="*" element={<div>404: 페이지를 찾을 수 없습니다</div>} />
      </Routes>

      <ChatModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        tab={tab}
        setTab={setTab}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        chatInput={chatInput}
        resultText={resultText}
      />

      <Footer />
    </>
  );
};

export default App;