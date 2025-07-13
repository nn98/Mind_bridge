import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sectionLabels } from '../constants/sectionLabels';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Header = ({
  hoveredMenu,
  handleMouseEnter,
  handleMouseLeaveAll,
  showSection,
  setScrollTarget,
}) => {
  const [hoveredSubMenuItem, setHoveredSubMenuItem] = useState(null);
  const navigate = useNavigate();

  const serviceSubMenus = {
    '상담': [
      { label: '이미지', path: '/img' },
      { label: '?', path: '' },
    ],
    '고객 서비스': [
      { label: '서비스 준비 중', path: '#' },
      { label: '서비스 준비 중', path: '#' },
    ],
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
              setHoveredSubMenuItem(null);
            }
          }}
        >
          {['about', 'services', 'board', 'self'].map((sec) => (
            <div
              key={sec}
              className="nav-item-wrapper"
              onMouseEnter={() => {
                ['services', 'about'].includes(sec) && handleMouseEnter(sec);
                if (sec === 'services') {
                  setHoveredSubMenuItem(null);
                }
              }}
            >
              {['board', 'self'].includes(sec) ? (
                <Link to={`/${sec}`} className="nav-link">
                  {sectionLabels[sec]}
                </Link>
              ) : (
                <div
                  onClick={() => showSection(sec)}
                  className="nav-link"
                  style={{ cursor: 'pointer' }}
                >
                  {sectionLabels[sec]}
                </div>
              )}

              {sec === 'about' && hoveredMenu === 'about' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    <div className="dropdown-column">
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          setScrollTarget('intro');
                          showSection('about');
                        }}
                      >
                        회사 소개
                      </div>
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          setScrollTarget('notice');
                          showSection('about');
                        }}
                      >
                        회사 공지
                      </div>
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          setScrollTarget('location');
                          showSection('about');
                        }}
                      >
                        회사 위치
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sec === 'services' && hoveredMenu === 'services' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    <div className="dropdown-column">
                      <div
                        className={`dropdown-item ${hoveredSubMenuItem === '상담' ? 'highlight' : ''}`}
                        onMouseEnter={() => setHoveredSubMenuItem('상담')}
                        onMouseLeave={() => setHoveredSubMenuItem(null)}
                      >
                        상담
                        {hoveredSubMenuItem === '상담' && (
                          <div className="dropdown-submenu">
                            {serviceSubMenus['상담'].map((subItem) => (
                              <Link key={subItem.label} to={subItem.path} className="dropdown-item">
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`dropdown-item ${hoveredSubMenuItem === '고객 서비스' ? 'highlight' : ''}`}
                        onMouseEnter={() => setHoveredSubMenuItem('고객 서비스')}
                        onMouseLeave={() => setHoveredSubMenuItem(null)}
                      >
                        고객 서비스
                        {hoveredSubMenuItem === '고객 서비스' && (
                          <div className="dropdown-submenu">
                            {serviceSubMenus['고객 서비스'].map((subItem, index) => (
                              <div key={index} className="dropdown-item">
                                {subItem.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="nav-right">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <button className="custom-blue-btn" onClick={() => navigate('/signup')}>회원가입</button>
            <button className="custom-blue-btn" onClick={() => navigate('/login')}>로그인</button>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
};

export default Header;
