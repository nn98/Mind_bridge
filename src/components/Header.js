import React from 'react';
import { Link } from 'react-router-dom';
import { sectionLabels } from '../constants/sectionLabels';

const Header = ({
  hoveredMenu,
  handleMouseEnter,
  handleMouseLeaveAll,
  setSubMenuVisible,
  subMenuVisible,
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
          <Link to="/">
            <img
              src="/로고2.png"
              alt="Mind Bridge 로고"
              className="logo"
              style={{ cursor: 'pointer' }}
            />
          </Link>
        </div>

        <div
          className="nav-center"
          onMouseLeave={(e) => {
            const related = e.relatedTarget;
            const nav = document.querySelector('.nav');

            if (!(nav instanceof Node) || !(related instanceof Node) || !nav.contains(related)) {
              handleMouseLeaveAll();
            }
          }}
        >
          {['about', 'services', 'board', 'self'].map((sec) => (
            <div
              key={sec}
              className="nav-item-wrapper"
              onMouseEnter={() =>
                ['services', 'about'].includes(sec) && handleMouseEnter(sec)
              }
            >
              {/* 메뉴 클릭 시 Link or scroll 처리 */}
              {['board', 'self'].includes(sec) ? (
                <Link
                  to={`/${sec}`}
                  className="nav-link"
                >
                  {sectionLabels[sec]}
                </Link>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="nav-link"
                >
                  {sectionLabels[sec]}
                </a>
              )}

              {/* 드롭다운 메뉴 - about */}
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

              {/* 드롭다운 메뉴 - services */}
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
                                  <Link to="/img" className="dropdown-item">이미지</Link>
                                  <Link to="/email" className="dropdown-item">메일</Link>
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
            </div>
          ))}
        </div>

        <div className="nav-right">
          <Link to="/login" className="auth-button">로그인</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
