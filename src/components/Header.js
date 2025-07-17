import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sectionLabels } from '../constants/sectionLabels';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Header = ({ introRef, servicesRef, infoRef, setScrollTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollOrNavigate = (ref, target) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (location.pathname !== '/') {
        navigate('/');
      }
      setScrollTarget?.(target); // fallback when not on home page
    }
  };

  const handleScrollToIntro = () => scrollOrNavigate(introRef, 'intro');
  const handleScrollToServices = () => scrollOrNavigate(servicesRef, 'services');
  const handleScrollToInfo = () => scrollOrNavigate(infoRef, 'info');

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
            <div className="nav-link" style={{ cursor: 'pointer' }} onClick={handleScrollToInfo}>
              {sectionLabels['info']}
            </div>
          </div>

          <div className="nav-item-wrapper">
            <div className="nav-link" style={{ cursor: 'pointer' }} onClick={() => (window.location.href = 'https://mind-bridge-zeta.vercel.app/board')}>
              {sectionLabels['board']}
            </div>
          </div>
        </div>

        <div className="nav-right">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <button className="custom-blue-btn" onClick={() => navigate('/login')}>로그인</button>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
};

export default Header;
