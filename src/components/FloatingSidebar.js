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
        {/* ⬆ 위로 버튼 */}
        <div className="floating-button2" onClick={handleScrollToTop}>
          <img src="/img/up.png" alt="맨 위" style={{ width: '60px', height: '60px' }} />
        </div>
      </div>
    </>
  );
};

export default FloatingSidebar;
