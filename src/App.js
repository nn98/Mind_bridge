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
import '../src/css/FloatingChatButton.css';
import Chat from './Chat.js';

import '../src/css/selfTest.css';
import '../src/css/result.css';

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
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [resultText, setResultText] = useState('');
  const [testType, setTestType] = useState('우울증');
  const introRef = useRef(null);
  const noticeRef = useRef(null);
  const locationRef = useRef(null);

  const testQuestions = {
    '우울증': [
      '평소보다 식욕이 없었다',
      '무슨 일을 해도 기운이 없었다',
      '사는 게 허무하게 느껴졌다',
      '자주 울었다',
      '희망을 느끼지 못했다',
      '평소보다 우울했다',
      '평소보다 말수가 줄었다',
      '가족이나 친구에게 짜증을 냈다',
      '밤에 잠을 이루기 어려웠다',
      '자주 피곤함을 느꼈다',
      '다른 사람들과 이야기하기 싫었다',
      '어떤 일에도 집중이 잘 안 되었다',
    ],
    '불안장애': [
      '사소한 일에도 걱정이 많다',
      '예상치 못한 일에 쉽게 당황한다',
      '자주 심장이 두근거린다',
      '숨이 가빠지는 느낌이 든다',
      '긴장을 잘 풀지 못한다',
      '불안한 예감이 든다',
      '일상적인 상황에서도 과하게 불안해진다',
      '사람 많은 곳에서 불편함을 느낀다',
      '두려움이 쉽게 생긴다',
      '내가 잘하고 있는지 불안하다',
      '나쁜 일이 일어날까 두렵다',
      '불안해서 잠들기 어렵다',
    ],
    '스트레스': [
      '최근 집중이 잘 안 된다',
      '잠들기 어려운 경우가 많다',
      '쉽게 짜증이 난다',
      '피로감이 자주 느껴진다',
      '매사에 무기력하다',
      '일상이 지루하게 느껴진다',
      '몸이 자주 뻐근하거나 아프다',
      '업무나 학업이 버겁게 느껴진다',
      '다른 사람과 갈등이 자주 생긴다',
      '감정 조절이 어렵다',
      '휴식 시간이 있어도 쉬는 느낌이 들지 않는다',
      '불규칙한 식사로 스트레스를 느낀다',
    ]
  };

  const showSection = (id) => {
    setActiveSection(id);
    setHoveredMenu(null);
    setSubMenuVisible(null);
    setSelectedBoard('');
    setSelectedChat(null);
    setResultText('');
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

  const chatHistory = [
    { summary: '상담 내용' },
  ];

  const scrollToSection = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const leaveTimer = useRef(null);

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

  const getDetailedResult = (type, score) => {
    const results = {
      '우울증': [
        {
          range: [0, 4],
          title: '정상 범주의 기분 상태',
          description: `일상생활에서 별다른 우울 증상을 보이지 않는 건강한 상태입니다. 감정 조절과 일상 기능 수행이 원활하며, 스스로 삶을 긍정적으로 평가할 수 있습니다.`,
          categories: {
            '유지 전략': [
              '긍정적인 대인 관계 유지',
              '정기적인 운동 및 취미 생활 지속'
            ]
          }
        },
        {
          range: [5, 9],
          title: '경미한 우울감',
          description: `약간의 우울 증상이 간헐적으로 나타날 수 있으며, 스트레스 상황에서 기분 기복이 생길 수 있습니다. 아직 기능 저하는 심하지 않지만 예방적 개입이 유효합니다.`,
          categories: {
            '자기 관리 전략': [
              '충분한 수면과 영양 섭취',
              '주기적인 운동 및 일기 쓰기'
            ],
            '사회적 연결 유지': [
              '친한 친구와의 대화 시간 늘리기',
              '소소한 취미나 소모임 참여하기'
            ]
          }
        },
        {
          range: [10, 14],
          title: '중등도 수준의 우울장애',
          description: `하루 대부분 우울한 기분이 지속되며, 이유 없이 눈물이 나기도 합니다. 무기력감이 심하고, 집중력이 저하되어 일상적인 업무 수행에 어려움이 있을 수 있습니다. 평소 좋아하던 활동에도 흥미를 잃고, 인간관계를 피하려는 경향이 있으며, 수면장애(불면증 또는 과다수면)와 식습관 변화(식욕 저하 또는 폭식)가 나타날 수 있습니다.

중등도 수준의 우울을 방치하면 더 악화될 수 있습니다. 자존감이 낮아지고, 자신을 비난하는 생각이 반복되는 패턴에 굳어질 수 있지요. 일상에서 할 수 있는 작은 변화라도 천천히 실천하며 전문가의 도움을 받는 것이 중요합니다. 가능한 빨리 전문가를 찾아가 상담을 받으시길 권해 드립니다.`,
          categories: {
            '전문가 상담 고려하기': [
              '인지행동치료(CBT)를 통해 부정적인 사고 패턴 변화시키기',
              '상담사와의 대화를 통해 감정을 객관적으로 조망하기'
            ],
            '일상적인 루틴 회복 노력': [
              '기상 시간을 일정하게 유지하며, 최소한의 활동이라도 수행하기(예: 샤워하기, 침대 정리)',
              '무리한 목표보다는 실현 가능한 작은 목표부터 실천하기(예: 하루 5분 운동)'
            ],
            '신체 활동 증가': [
              '가벼운 운동 등 신체 움직임을 활용해 기분을 조절할 수 있도록 함',
              '자연 속에서 걷기, 요가, 가벼운 스트레칭 등 몸을 움직이는 습관 들이기'
            ],
            '감정 표현 및 스트레스 해소': [
              '자신의 감정을 일기나 글로 써보며 정리하기',
              '음악 감상, 미술 활동 등으로 감정을 표현하는 방법 찾기'
            ]
          }
        },
        {
          range: [15, 60],
          title: '고위험 수준의 우울장애',
          description: `심한 무기력감, 절망감, 자살 사고 등이 동반될 수 있는 상태입니다. 감정 조절이 매우 어렵고 일상생활 수행이 불가능할 수 있으며 즉각적인 전문 개입이 요구됩니다.`,
          categories: {
            '긴급 개입 필요': [
              '정신건강의학과 전문의 상담 즉시 필요',
              '가까운 정신건강센터 또는 상담전화(1577-0199) 연결'
            ],
            '가족 및 지지체계 활용': [
              '가족이나 가까운 친구에게 현재 상태 알리기',
              '위기 시 혼자 있지 않도록 하기'
            ]
          }
        }
      ],
      '불안장애': [
        {
          range: [0, 4],
          title: '정상 범주의 불안 수준',
          description: `일상적인 긴장감 외에 특별한 불안 증상을 보이지 않으며, 일과 대인관계 등 기능에 영향을 주지 않습니다.`,
          categories: {
            '유지 활동': [
              '편안한 수면과 식사 유지',
              '감사 일기 쓰기 또는 명상'
            ]
          }
        },
        {
          range: [5, 9],
          title: '가벼운 불안 증상',
          description: `불안감이 간헐적으로 느껴지지만 일상생활에는 큰 지장이 없는 수준입니다. 스트레스 상황에서 불안이 악화될 수 있어 예방적 관리가 권장됩니다.`,
          categories: {
            '감정 인식 및 조절': [
              '호흡 조절 훈련 및 명상 습관화',
              '스트레스 일기 작성'
            ]
          }
        },
        {
          range: [10, 14],
          title: '중등도 수준의 불안장애',
          description: `지속적인 긴장감과 불안으로 인해 일상생활에서 집중력 저하, 예민함, 가슴 두근거림 등의 신체 증상이 동반될 수 있습니다. 불안 자극에 과도하게 반응하고, 예상하지 못한 상황에도 쉽게 당황하거나 회피하려는 경향이 나타납니다. 

이러한 불안이 반복되면 스트레스에 더욱 취약해지고 회피 행동이 강화될 수 있으므로 적절한 관리가 필요합니다.`,
          categories: {
            '전문가 상담 고려하기': [
              '불안 관련 인지행동치료(CBT) 시행 고려',
              '상담 치료를 통해 불안 사고를 인식하고 조절하기'
            ],
            '일상 루틴 관리': [
              '불안 유발 상황을 일지에 기록하고, 대응 전략 준비하기',
              '예측 가능한 일상 패턴 형성하여 안정감 주기'
            ],
            '신체 이완 활동': [
              '복식 호흡, 명상, 스트레칭 등 규칙적으로 실천하기',
              '자연과 가까운 공간에서 걷기 및 이완 활동 수행'
            ],
            '감정 표현 연습': [
              '감정 상태를 기록하거나 미술/음악 활동으로 표현하기',
              '감정 표현에 대한 부정적 인식 완화하기'
            ]
          }
        },
        {
          range: [15, 60],
          title: '고위험 수준의 불안장애',
          description: `불안감이 극심하여 일상 수행에 큰 어려움을 겪고 있으며, 공황 발작, 회피 행동 등이 나타날 수 있습니다. 반드시 전문 기관의 개입이 필요합니다.`,
          categories: {
            '즉각적 상담 필요': [
              '정신건강 전문의 또는 센터 내원 권장',
              '인지 및 약물 치료 고려'
            ]
          }
        }
      ],
      '스트레스': [
        {
          range: [0, 4],
          title: '정상 수준의 스트레스',
          description: `스트레스에 잘 대처하고 있으며 정서적 회복력이 양호한 상태입니다.`,
          categories: {
            '유지 방안': [
              '충분한 휴식과 긍정적인 피드백 자주 사용하기'
            ]
          }
        },
        {
          range: [5, 9],
          title: '경미한 스트레스 상태',
          description: `가벼운 스트레스 반응이 있으며 주의 깊은 감정 관찰이 필요합니다. 스트레스 요인을 분석하고 일상생활 패턴을 조정할 수 있습니다.`,
          categories: {
            '생활 패턴 조정': [
              '잠, 식사, 운동의 규칙적인 루틴 만들기'
            ]
          }
        },
        {
          range: [10, 14],
          title: '중등도 수준의 스트레스 상태',
          description: `지속적인 스트레스로 인해 피로, 두통, 수면 문제, 짜증 등의 증상이 나타날 수 있습니다. 일상에서의 효율성과 만족도가 낮아지고, 작은 일에도 쉽게 반응하거나 감정 기복이 커질 수 있습니다.

스트레스가 누적되기 전, 본인의 스트레스 신호를 인식하고 이를 완화할 수 있는 방법을 실천하는 것이 중요합니다.`,
          categories: {
            '전문가 상담 고려하기': [
              '상담사를 통해 스트레스 반응에 대한 이해를 높이기',
              '스트레스 평가 후 필요 시 전문 개입 연계'
            ],
            '생활 리듬 조정': [
              '수면, 식사, 휴식 시간 일정하게 유지하기',
              '일과 중 중간 휴식시간 확보하여 긴장 해소하기'
            ],
            '신체 활동 및 취미': [
              '가벼운 유산소 운동 또는 몸을 움직이는 취미 찾기',
              '몰입 가능한 활동을 통해 스트레스 발산하기'
            ],
            '감정 조절 전략': [
              '호흡 조절, 자기 위로 대화 등 실천',
              '감정을 일지에 기록하며 객관적으로 바라보기'
            ]
          }
        },
        {
          range: [15, 60],
          title: '심각한 스트레스 상태',
          description: `신체적, 심리적 증상이 심각하게 나타나는 단계로 만성 피로, 수면장애, 잦은 감정 폭발 등이 포함될 수 있습니다. 스트레스와 관련된 신체 질환이 동반될 가능성도 있어 전문 개입이 시급합니다.`,
          categories: {
            '의학적 개입 필요': [
              '의사 상담 및 휴식 권고',
              '약물 치료 또는 정신과적 평가 고려'
            ]
          }
        }
      ]
    };

    const matchedList = results[type] || [];
    const matched = matchedList.find(({ range }) => score >= range[0] && score <= range[1]);

    if (!matched) {
      return {
        title: `${type} 검사 결과`,
        description: '해당 점수에 대한 검사 결과를 찾을 수 없습니다.',
        categories: {
          '알림': ['점수 범위를 다시 확인해주세요. 항목 수가 부족할 수 있습니다.']
        }
      };
    }

    return {
      title: matched.title || `${type} 검사 결과`,
      description: matched.description || '',
      categories: matched.categories || {}
    };
  };

  const handleSelfSubmit = () => {
    const scoreMap = {
      '거의 없다': 0,
      '가끔 있다': 1,
      '자주 있다': 2,
      '항상 있다': 3
    };

    const numericAnswers = selfAnswers.map(ans => scoreMap[ans] ?? 0);
    const totalScore = numericAnswers.reduce((sum, val) => sum + val, 0);

    console.log('선택한 항목:', selfAnswers);
    console.log('총점:', totalScore);

    const result = getDetailedResult(testType, totalScore);
    setResultText(result);
  };

  {
    resultText && resultText.categories && (
      <div className="result-card">
        <h2 className="result-title">검사 결과</h2>
        <h3 className="result-subtitle">{resultText.title}</h3>
        <p className="result-description">{resultText.description}</p>

        {Object.entries(resultText.categories).map(([category, items], idx) => (
          <div key={idx} className="result-category-block">
            <p className="result-category-title">✅ {category}</p>
            <ul className="recommendation-list">
              {items.map((item, index) => (
                <li key={index}>· {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    switch (tab) {
      case 'chat':
        return <Chat />;
        
      case 'summary':
        return (
          <div className="tab-content">
            <h3>AI 상담 기록 메일 요약</h3>
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
          </div>
        );
      case 'profile':
        return <div className="tab-content">회원 정보 영역입니다.</div>;
      default:
        return null;
    }
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
        <div className="floating-button1" onClick={() => alert('도움말')}>?</div>
        <div className="floating-button1" onClick={() => alert('챗봇 호출')}>봇</div>
        <div className="floating-button1" onClick={handleScrollToTop}>TOP</div>
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
        <section className="form-section2">
          <h2 className="form-title">
            <strong>성인 테스트</strong>
          </h2>

          <div className="test-type-selector">
            {['우울증', '불안장애', '스트레스'].map((type) => (
              <div
                key={type}
                onClick={() => setTestType(type)}
                className={`test-type-option ${testType === type ? 'active' : ''}`}
              >
                {type}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}></div>
          <h3 className="test-subtitle">한국인 {testType} 척도</h3>
          <p><strong>출처 :</strong> 보건복지부 국립정신건강센터(한국인정신건강척도)</p>
          <p>
            이 검사는 {testType} 정도를 알아보기 위한 것입니다. 최근 2주간 각 문항에 해당하는 증상을 얼마나 자주 경험하였는지 확인하고 해당하는 값을 선택해 주세요.<br />
            (가끔그렇다: 주2일 이상, 자주그렇다: 1주이상, 거의매일그렇다: 거의 2주)
          </p>

          <ul className="self-test-list">
            {testQuestions[testType].map((question, index) => (
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
            <button className="button" onClick={handleSelfSubmit}>제출</button>
            <button className="button" onClick={() => setSelfAnswers(Array(20).fill(''))}>다시하기</button>
          </div>

          {resultText && resultText.categories && (
            <div className="result-card">
              <h2 className="result-title">검사 결과</h2>
              <h3 className="result-subtitle">{resultText.title}</h3>
              <p className="result-description">{resultText.description}</p>
              {Object.entries(resultText.categories).map(([category, items], idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>✅ {category}</p>
                  <ul className="recommendation-list">
                    {items.map((item, index) => (
                      <li key={index}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}


      <>
        <div className="floating-button" onClick={() => setIsOpen(true)}>버튼</div>
        {isOpen && (
          <div className="modal-container">
            <div className="modal-header">
              <button onClick={() => setIsOpen(false)} className="close-btn">✖</button>
            </div>
            <div className="modal-tabs">
              <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'active' : ''}>AI 상담</button>
              <button onClick={() => setTab('summary')} className={tab === 'summary' ? 'active' : ''}>요약</button>
              <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'active' : ''}>회원 정보</button>
            </div>
            <div className="modal-body">{renderContent()}</div>
          </div>
        )}
      </>


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
        <strong>
          <h4>Contact</h4><br />
          <h2>02-1234-5678</h2>
          <h2>이메일 : help@mindbridge.ai</h2> <br /><br /><hr class="small-line" /><br />
          <h3>(주) 화재감지기</h3><br />
          <h5>주소 : 서울특별시 종로구 종로12길 15 코아빌딩 5층</h5><br /></strong>
      </footer>
    </div>
  );
};

const sectionLabels = {
  about: '소개',
  services: '병원 목록',
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
