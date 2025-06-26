// components/FloatingSidebar.js
import React from 'react';

const handleScrollToTop = () => {
  const root = document.getElementById('root');
  if (root) {
    root.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};


const FloatingSidebar = () => {
  return (
    <div className="floating-sidebar">
      <div className="floating-button1" onClick={() => alert('안내 섹션으로 이동 예정')}>안내</div>
      <div className="floating-button1" onClick={() => alert('챗봇 호출')}>봇</div>
      <div className="floating-button1" onClick={handleScrollToTop}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-chevron-bar-up"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M3.646 11.854a.5.5 0 0 0 .708 0L8 8.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708M2.4 5.2c0 .22.18.4.4.4h10.4a.4.4 0 0 0 0-.8H2.8a.4.4 0 0 0-.4.4"
          />
        </svg>
      </div>
    </div>
  );
};

export default FloatingSidebar;
