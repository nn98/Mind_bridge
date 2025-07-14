import React from 'react';

const FloatingSidebar = ({ mapVisible, setMapVisible, faqVisible, setFaqVisible }) => {
  const handleScrollToTop = () => {
    const root = document.getElementById('root');
    if (root) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMapClick = () => {
    setMapVisible(!mapVisible);
  };

  const handleFaqClick = () => {
    setFaqVisible(!faqVisible);
  };

  return (
    <>
      <div className="floating-sidebar">
        {/* ✅ Q 버튼 (FAQ 박스) */}
        <div className="floating-button1" onClick={handleFaqClick}>
          {faqVisible ? (
            <span style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>X</span>
          ) : (
            <img src="/qna.png" alt="자주묻는질문" style={{ width: '60px', height: '60px' }} />
          )}
        </div>

        {/* 🗺 지도 버튼 */}
        <div className="floating-button1" onClick={handleMapClick}>
          {mapVisible ? (
            <span style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>X</span>
          ) : (
            <img src="/map.png" alt="지도" style={{ width: '60px', height: '60px' }} />
          )}
        </div>

        {/* ⬆ 위로 버튼 */}
        <div className="floating-button2" onClick={handleScrollToTop}>
          <img src="/up.png" alt="맨 위" style={{ width: '60px', height: '60px' }} />
        </div>
      </div>
    </>
  );
};

export default FloatingSidebar;
