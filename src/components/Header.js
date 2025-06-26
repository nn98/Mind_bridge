import React from 'react';
import { sectionLabels } from '../constants/sectionLabels';

const Header = ({
  activeSection,
  showSection,
  hoveredMenu,
  handleMouseEnter,
  handleMouseLeaveAll,
  setSubMenuVisible,
  subMenuVisible,
  handleBoardSelect,
  introRef,
  noticeRef,
  locationRef
}) => {
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div id="google_translate_element" className="translate"></div>
      <nav className="nav">
        <div className="nav-left">
          <img
            src="/로고2.png"
            alt="Mind Bridge 로고"
            className="logo"
            onClick={() => showSection('about')}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        <div
          className="nav-center"
          onMouseLeave={(e) => {
            const related = e.relatedTarget;
            const nav = document.querySelector('.nav');
            if (!nav || !related || !nav.contains(related)) {
              handleMouseLeaveAll();
            }
          }}
        >
          {['about', 'services', 'board', 'self'].map((sec) => (
            <div
              key={sec}
              className="nav-item-wrapper"
              onMouseEnter={() =>
                ['services', 'board', 'about'].includes(sec) && handleMouseEnter(sec)
              }
            >
              <a
                href="#"
                onClick={() =>
                  !['services', 'board', 'about'].includes(sec) && showSection(sec)
                }
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
                            <div
                              className="dropdown-submenu"
                              onMouseEnter={(e) => e.stopPropagation()}
                            >
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
    </header>
  );
};

export default Header;
