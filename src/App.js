import React, { useState, useRef, useEffect } from 'react';
import '../src/css/App.css';
import '../src/css/board.css';
import '../src/css/chat.css';
import '../src/css/dropdown.css';
import '../src/css/feature.css';
import '../src/css/header.css';
import '../src/css/hero.css';
import '../src/css/login.css';
import '../src/css/map.css';
import '../src/css/small_translate.css';

const App = () => {
  const [activeSection, setActiveSection] = useState('about');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [subMenuVisible, setSubMenuVisible] = useState(null);
  const [visibility, setVisibility] = useState(null);
  const [signupState, setSignupState] = useState('');
  const [selfAnswers, setSelfAnswers] = useState(Array(20).fill(''));


  const chatHistory = [
    { summary: '1차 상담 내용' },
    { summary: '2차 상담 내용' },
    { summary: '3차 상담 내용' }
  ];

  const handleScrollToTop = () => {
    const root = document.getElementById('root');
    if (root) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelfAnswer = (index, value) => {
    const updated = [...selfAnswers];
    updated[index] = value;
    setSelfAnswers(updated);
  };

  const faqList = [
    { q: 'Q. AI 상담이 실제 사람처럼 이야기하나요?', a: 'A. Mind Bridge는 자연어 이해와 공감 대화를 기반으로 상담 서비스를 제공드리기 위해 노력하고 있습니다' },
    { q: 'Q. 개인 정보는 안전한가요?', a: 'A. 철저한 암호화와 보안 시스템으로 보호되고 있습니다' },
    { q: 'Q. 이용 요금이 있나요?', a: 'A. 기본 상담은 무료로 진행되며 추후 업데이트를 통해 기능이 추가되면 유료 버전이 생길수도 있습니다' }
  ];

  const leaveTimer = useRef(null);
  const introRef = useRef(null);
  const noticeRef = useRef(null);
  const locationRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseEnter = (menu) => {
    clearTimeout(leaveTimer.current);
    setHoveredMenu(menu);
  };

  const handleMouseLeaveAll = () => {
    leaveTimer.current = setTimeout(() => {
      setHoveredMenu(null);
      setSubMenuVisible(null);
    }, 200);
  };

  const showSection = (id) => {
    setActiveSection(id);
    setHoveredMenu(null);
    setSubMenuVisible(null);
    setSelectedBoard('');
    setSelectedChat(null);
  };

  const handleBoardSelect = (value) => {
    if (value === 'adminBoard' && !isAdmin) {
      alert('관리자만 접근 가능합니다.');
      return;
    }
    setSelectedBoard(value);
    setActiveSection('board');
  };

  const handleSendEmail = () => {
    if (selectedChat === null) {
      alert('보낼 상담 기록을 선택해주세요.');
      return;
    }
    alert(`선택한 기록을 메일로 전송했습니다: ${chatHistory[selectedChat].summary}`);
  };

  const handleRead = () => {
    if (selectedChat === null) {
      alert('읽을 상담 기록을 선택해주세요.');
      return;
    }
    alert(`선택한 기록:\n${chatHistory[selectedChat].summary}`);
  };

  return (
    <div>
      <header className="header">
        <div id="google_translate_element" className="translate"></div>
      </header>

      <nav className="nav">
        <div className="nav-left">
          <img src="/로고2.png" alt="Mind Bridge 로고" className="logo" onClick={() => showSection('about')} style={{ cursor: 'pointer' }} />
        </div>
        <div className="nav-center">
          {['about', 'services', 'board', 'self'].map((sec) => (
            <div
              key={sec}
              className="nav-item-wrapper"
              onMouseEnter={() => ['services', 'board', 'about'].includes(sec) && handleMouseEnter(sec)}
              onMouseLeave={handleMouseLeaveAll}
            >
              <a
                href="#"
                onClick={() => !['services', 'board', 'about'].includes(sec) && showSection(sec)}
                className={`nav-link ${activeSection === sec && sec !== 'about' ? 'nav-link-hover' : ''}`}
              >
                {sectionLabels[sec]}
              </a>
              {sec === 'about' && hoveredMenu === 'about' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    <div className="dropdown-column">
                      <div className="dropdown-item" onClick={() => scrollToSection(introRef)}>회사 소개</div>
                      <div className="dropdown-item" onClick={() => scrollToSection(noticeRef)}>회사 공지</div>
                      <div className="dropdown-item" onClick={() => scrollToSection(locationRef)}>회사 위치</div>
                    </div>
                  </div>
                </div>
              )}
              {sec === 'services' && hoveredMenu === 'services' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    <div className="dropdown-column">
                      {['상담', '고객 서비스'].map((item, i) => (
                        <div
                          key={i}
                          className={`dropdown-item ${subMenuVisible === item ? 'highlight' : ''}`}
                          onMouseEnter={() => setSubMenuVisible(item)}
                        >
                          {item}
                          {subMenuVisible === item && (
                            <div className="dropdown-submenu">
                              {item === '상담' && (
                                <>
                                  <div className="dropdown-item" onClick={() => showSection('chat')}>AI 상담</div>
                                  <div className="dropdown-item" onClick={() => showSection('email')}>메일</div>
                                </>
                              )}
                              {item === '고객 서비스' && (
                                <>
                                  <div className="dropdown-item">서비스 준비 중</div>
                                  <div className="dropdown-item">서비스 준비 중</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {sec === 'board' && hoveredMenu === 'board' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    <div className="dropdown-column">
                      <div className="dropdown-item" onClick={() => handleBoardSelect('generalBoard')}>일반 게시판</div>
                      <div className="dropdown-item" onClick={() => handleBoardSelect('adminBoard')}>관리자 게시판</div>
                      <div className="dropdown-item" onClick={() => handleBoardSelect('noticeBoard')}>공지사항</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="nav-right">
          <button onClick={() => showSection('login')} className="auth-button">로그인</button>
        </div>
      </nav>

      <div className="floating-sidebar">
        <div className="floating-button">?</div>
        <div className="floating-button">?</div>
        <div className="floating-button top" onClick={handleScrollToTop}>TOP</div>
      </div>

      {activeSection === 'about' && (
        <>
          <section className="hero">
            <h1><strong>당신의 마음을 이해하는</strong> AI Mind Bridge</h1>
            <p>감성 분석, AI 상담, 번역, 이미지 기반 소통까지 한 번에</p>
            <a href="#faq" className="cta" onClick={() => showSection('faq')}>자주 묻는 질문</a>
          </section>

          <section ref={introRef} className="section">
            <h2>회사 소개</h2>
            <p>Mind Bridge는 인공지능 기반 정서 분석 및 상담 서비스를 제공합니다.</p>
          </section>

          <section ref={noticeRef} className="section">
            <h2>공지 사항</h2>
            <p>현재 정기 점검 중이며, 서비스가 일부 제한될 수 있습니다.</p>
          </section>

          <section ref={locationRef} className="section">
            <h2>회사 위치</h2>
            <div className="map-container">
              <iframe
                src="https://map.naver.com/p/search/%EC%86%94%EB%8D%B0%EC%8A%A4%ED%81%AC?c=15.00,0,0,0,dh"
                allowFullScreen
                className="map-iframe"
                title="회사 위치"
              />
              <p className="map-caption">📍 서울특별시 종로구 종로12길 15 코아빌딩 2층, 5층, 8층, 9층, 10층</p>
            </div>
          </section>
        </>
      )}

      {activeSection === 'faq' && (
        <section className="form-section">
          <h2>자주 묻는 질문</h2>
          {faqList.map((item, i) => (
            <p key={i}><strong>{item.q}</strong><br />{item.a}</p>
          ))}
        </section>
      )}

      {activeSection === 'signup' && (
        <section className="form-section form-section-flex">
          <div className="form-left">
            <h2>{sectionLabels.signup}</h2>
            {formInputs.signup.map((input, i) => (
              <input key={i} type={input.type} placeholder={input.placeholder} className="input" />
            ))}
            <button className="button">{buttonLabels.signup}</button>
          </div>

          <div className="form-right">
            <h3>내가 생각하는 나의 현재 상태</h3>
            <ul className="radio-list">
              {['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'].map((label, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="radio"
                      name="mentalState"
                      value={label}
                      checked={signupState === label}
                      onChange={(e) => setSignupState(e.target.value)}
                    />
                    {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {['login', 'id', 'password'].includes(activeSection) && (
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
      )}

      {activeSection === 'chat' && (
        <section className="chat-section">
          <h2>AI 상담 챗봇</h2>
          <div className="chat-box"><p><strong>AI:</strong> 안녕하세요 어떤 고민이 있으신가요?</p></div>
          <input type="text" placeholder="메시지를 입력하세요..." className="input-full" />
        </section>
      )}

      {activeSection === 'board' && (
        <section className="board-section">
          <h2>게시판</h2>
          {selectedBoard === 'generalBoard' && (
            <>
              <textarea className="textarea" placeholder="당신의 감정을 나눠보세요..."></textarea>
              <div>
                {['공개', '비공개', '관리자만 공개'].map((label, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name="visibility"
                      value={label}
                      checked={visibility === label}
                      onChange={(e) => setVisibility(e.target.value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
          {selectedBoard === 'adminBoard' && (
            <>
              <p>관리자 전용 게시판입니다.</p>
              <textarea className="textarea" placeholder="관리자만 작성 가능합니다"></textarea>
            </>
          )}
          {selectedBoard === 'noticeBoard' && (
            <>
              <textarea className="textarea" placeholder="공지사항 작성 (관리자만)"></textarea>
              <p>※ 일반 사용자는 읽기만 가능합니다.</p>
            </>
          )}
        </section>
      )}

      {activeSection === 'self' && (
        <section className="form-section">
          <h2>우울 자가진단 테스트 (CES-D)</h2>
          <p>지난 1주일 동안의 느낌과 행동을 잘 보고 해당하는 항목을 선택해주세요.</p>

          <ul className="self-test-list">
            {[
              '평소보다 식욕이 없었다',
              '평소보다 우울했다',
              '무슨 일을 해도 기운이 없었다',
              '평소보다 말수가 줄었다',
              '가족이나 친구에게 짜증을 냈다',
              '사는 게 허무하게 느껴졌다',
              '자주 울었다',
              '밤에 잠을 이루기 어려웠다',
              '자주 피곤함을 느꼈다',
              '다른 사람들과 이야기하기 싫었다',
              '어떤 일에도 집중이 잘 안 되었다',
              '자신이 실패자 같았다',
              '다른 사람이 자신을 싫어한다고 느꼈다',
              '일상에 만족하지 못했다',
              '희망을 느끼지 못했다',
              '모든 것이 귀찮게 느껴졌다',
              '혼자 있고 싶었다',
              '사람들이 나를 싫어하는 것 같았다',
              '나 자신을 가치 없게 느꼈다',
              '앞으로 더 나빠질 것 같았다'
            ].map((question, index) => (
              <li key={index} className="self-test-item">
                <p>{index + 1}. {question}</p>
                <div className="self-option-group">
                  {['거의 없다', '가끔 있다', '자주 있다', '항상 있다'].map((option, i) => (
                    <label key={i} className="self-option">
                      <input
                        type="radio"
                        name={`q${index}`}
                        value={option}
                        checked={selfAnswers[index] === option}
                        onChange={() => handleSelfAnswer(index, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="button" onClick={() => alert('제출 완료')}>제출</button>
            <button className="button" onClick={() => setSelfAnswers(Array(20).fill(''))}>다시하기</button>
          </div>
        </section>
      )}


      {activeSection === 'email' && (
        <section className="board-section">
          <h2>AI 상담 기록 메일 전송</h2>
          <ul style={{ textAlign: 'left' }}>
            {chatHistory.map((item, idx) => (
              <li key={idx}>
                <label>
                  <input
                    type="radio"
                    name="chatSelect"
                    value={idx}
                    checked={selectedChat === idx}
                    onChange={() => setSelectedChat(idx)}
                  />
                  {item.summary.length > 30 ? item.summary.slice(0, 30) + '...' : item.summary}
                </label>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <button className="button" onClick={handleRead}>텍스트 읽기</button>
            <button className="button" onClick={handleSendEmail}>메일 전송</button>
          </div>
        </section>
      )}

      <footer className="footer">
        <strong>주식회사 : (주) 화재감지기 | 주소 : 서울특별시 종로구 종로12길 15 코아빌딩<br />
        이메일 : help@mindbridge.ai | 전화: 02-1234-5678</strong>
        <img src="/문의.jpg" className="small-img" />
      </footer>
    </div>
  );
};

const sectionLabels = {
  about: '소개',
  services: '서비스',
  board: '게시판',
  chat: 'AI 상담',
  map: '회사 위치',
  email: '메일',
  login: '로그인',
  signup: '회원가입',
  id: '아이디 찾기',
  password: '비밀번호 찾기',
  faq: '자주 묻는 질문',
  self: '자가진단'
};

const formInputs = {
  login: [
    { type: 'email', placeholder: '아이디' },
    { type: 'password', placeholder: '비밀번호' }
  ],
  signup: [
    { type: 'text', placeholder: '이름' },
    { type: 'email', placeholder: '이메일' },
    { type: 'tel', placeholder: '전화번호' },
    { type: 'password', placeholder: '비밀번호' }
  ],
  id: [
    { type: 'text', placeholder: '이름' },
    { type: 'tel', placeholder: '전화번호' },
    { type: 'email', placeholder: '이메일' }
  ],
  password: [
    { type: 'text', placeholder: '아이디' },
    { type: 'tel', placeholder: '전화번호' },
    { type: 'email', placeholder: '이메일' }
  ]
};

const buttonLabels = {
  login: '로그인',
  signup: '가입하기',
  id: '아이디 찾기',
  password: '비밀번호 찾기'
};

const formLinks = {
  login: [
    { label: '회원가입', id: 'signup' },
    { label: '아이디 찾기', id: 'id' },
    { label: '비밀번호 찾기', id: 'password' }
  ]
};

export default App;
