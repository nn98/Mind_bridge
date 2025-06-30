import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sectionLabels } from '../constants/sectionLabels';

const Header = ({
  hoveredMenu,
  handleMouseEnter,
  handleMouseLeaveAll,
  introRef,
  noticeRef,
  locationRef
}) => {
  // 어떤 서브메뉴 아이템에 마우스가 올라가 있는지 추적하는 상태
  const [hoveredSubMenuItem, setHoveredSubMenuItem] = useState(null);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 서비스 드롭다운의 서브메뉴 데이터 정의 (기존 항목들을 사용)
  const serviceSubMenus = {
    '상담': [ // 기존 '상담' 항목
      { label: '이미지', path: '/img' },
      { label: '메일', path: '/email' },
    ],
    '고객 서비스': [ // 기존 '고객 서비스' 항목
      { label: '서비스 준비 중', path: '#' }, // 첫 번째 '서비스 준비 중'
      { label: '서비스 준비 중', path: '#' }, // 두 번째 '서비스 준비 중'
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
              setHoveredSubMenuItem(null); // 메뉴 전체를 떠날 때 서브메뉴 상태 초기화
            }
          }}
        >
          {['about', 'services', 'board', 'self'].map((sec) => (
            <div
              key={sec}
              className="nav-item-wrapper"
              onMouseEnter={() => {
                ['services', 'about'].includes(sec) && handleMouseEnter(sec);
                // 메인 메뉴 진입 시 서브메뉴 상태 초기화
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
                <a
                  href="https://mind-bridge-zeta.vercel.app"
                  onClick={(e) => {
                    if (['about', 'services'].includes(sec)) {
                        e.preventDefault();
                    }
                  }}
                  className="nav-link"
                >
                  {sectionLabels[sec]}
                </a>
              )}

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

              {/* services 드롭다운 부분 - 기존 항목들을 서브메뉴로 변경 */}
              {sec === 'services' && hoveredMenu === 'services' && (
                <div className="dropdown-wrapper">
                  <div className="dropdown">
                    {/* 단일 컬럼: 상담, 고객 서비스 (각각 서브메뉴 가짐) */}
                    <div className="dropdown-column">
                      {/* '상담' 항목 */}
                      <div
                        className={`dropdown-item ${hoveredSubMenuItem === '상담' ? 'highlight' : ''}`}
                        onMouseEnter={() => setHoveredSubMenuItem('상담')}
                        onMouseLeave={() => setHoveredSubMenuItem(null)}
                      >
                        상담
                        {/* '상담'에 마우스 올리면 나타나는 서브메뉴 */}
                        {hoveredSubMenuItem === '상담' && serviceSubMenus['상담'] && (
                          <div className="dropdown-submenu">
                            {serviceSubMenus['상담'].map((subItem) => (
                              <Link key={subItem.label} to={subItem.path} className="dropdown-item">
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* '고객 서비스' 항목 */}
                      <div
                        className={`dropdown-item ${hoveredSubMenuItem === '고객 서비스' ? 'highlight' : ''}`}
                        onMouseEnter={() => setHoveredSubMenuItem('고객 서비스')}
                        onMouseLeave={() => setHoveredSubMenuItem(null)}
                      >
                        고객 서비스
                        {/* '고객 서비스'에 마우스 올리면 나타나는 서브메뉴 */}
                        {hoveredSubMenuItem === '고객 서비스' && serviceSubMenus['고객 서비스'] && (
                          <div className="dropdown-submenu">
                            {serviceSubMenus['고객 서비스'].map((subItem, index) => (
                              // '서비스 준비 중'은 Link가 아닐 수 있으므로 div로 처리
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
          <Link to="/login" className="auth-button">로그인</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;