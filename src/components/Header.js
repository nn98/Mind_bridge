// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sectionLabels } from '../constants/sectionLabels';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Header = ({ introRef, servicesRef }) => {
  const navigate = useNavigate();

  // 소개로 스크롤
  const handleScrollToIntro = () => {
    if (introRef?.current) {
      introRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 서비스로 스크롤
  const handleScrollToServices = () => {
    if (servicesRef?.current) {
      servicesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div id="google_translate_element" className="translate"></div>
      <nav className="nav">
        <div className="nav-left">
          <Link to="/">
            <img src="/로고2.png" alt="Mind Bridge 로고" className="logo" />
          </Link>
        </div>

        <div className="nav-center">
          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: 'pointer' }} onClick={handleScrollToIntro}>
              {sectionLabels['about']}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: 'pointer' }} onClick={handleScrollToServices}>
              {sectionLabels['services']}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <Link to="/info" className="nav-link">
              {sectionLabels['info']}
            </Link>
          </div>
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

