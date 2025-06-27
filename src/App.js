import React, { useState, useRef, useEffect } from 'react';
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

import { sectionLabels } from './constants/sectionLabels';
import { formInputs } from './constants/formInputs';
import { buttonLabels } from './constants/buttonLabels';
import { formLinks } from './constants/formLinks';

const App = () => {
  const [activeSection, setActiveSection] = useState('about');
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

  const showSection = (section) => {
    setActiveSection(section);
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
    } catch (error) {
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
    setActiveSection('board');
  };

  const handleScrollToTop = () => {
    const root = document.getElementById('root');
    if (root) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelfAnswer = (index, value) => {
    const updatedAnswers = [...selfAnswers];
    updatedAnswers[index] = value;
    setSelfAnswers(updatedAnswers);
  };

  const handleSelfSubmit = (result) => {
    setResultText(result);
  };

  const renderForms = () => {
    if (["login", "id", "password"].includes(activeSection)) {
      return (
        <section className="form-section">
          <h2>{sectionLabels[activeSection]}</h2>
          {formInputs[activeSection].map((input, i) => (
            <input key={i} type={input.type} placeholder={input.placeholder} className="input" />
          ))}
          <button className="button">{buttonLabels[activeSection]}</button>
          {formLinks[activeSection] && (
            <div className="form-links">
              {formLinks[activeSection].map(({ label, id }) => (
                <a key={id} href="#" onClick={() => showSection(id)}>{label}</a>
              ))}
            </div>
          )}
        </section>
      );
    }
    return null;
  };

  return (
    <div>
      <Header
        activeSection={activeSection}
        showSection={showSection}
        hoveredMenu={hoveredMenu}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeaveAll={handleMouseLeaveAll}
        setSubMenuVisible={setSubMenuVisible}
        subMenuVisible={subMenuVisible}
        handleBoardSelect={handleBoardSelect}
        introRef={introRef}
        noticeRef={noticeRef}
        locationRef={locationRef}
      />

      <div className="floating-sidebar">
        <div className="floating-button1" onClick={() => showSection('faq')}>안내</div>
        <div className="floating-button1" onClick={() => alert('챗봇 호출')}>봇</div>
        <div className="floating-button1" onClick={handleScrollToTop}>↑</div>
      </div>

      {activeSection === 'about' && (
        <AboutSection refs={{ introRef, noticeRef, locationRef }} />
      )}

      {activeSection === 'faq' && <FaqSection />}

      {activeSection === 'self' && (
        <SelfTest
          testType={testType}
          setTestType={setTestType}
          selfAnswers={selfAnswers}
          handleSelfAnswer={handleSelfAnswer}
          handleSelfSubmit={handleSelfSubmit}
          resultText={resultText}
          setSelfAnswers={setSelfAnswers}
          setResultText={setResultText}
        />
      )}

      {activeSection === 'board' && (
        <BoardSection
          selectedBoard={selectedBoard}
          visibility={visibility}
          setVisibility={setVisibility}
        />
      )}

      {activeSection === 'chat' && (
        <section className="chat-section">
          <Picture />
        </section>
      )}

      {activeSection === 'email' && (
        <section className="board-section">
          <h2>AI 상담 기록 메일 전송</h2>
        </section>
      )}

      {activeSection === 'signup' && (
        <AuthSection
          type="signup"
          sectionLabels={sectionLabels}
          formInputs={formInputs}
          buttonLabels={buttonLabels}
          formLinks={formLinks}
          setActiveSection={setActiveSection}
          signupState={signupState}
          setSignupState={setSignupState}
        />
      )}

      {activeSection !== 'image' && (
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
      )}

      {renderForms()}

      <Footer />
    </div>
  );
};

export default App;
