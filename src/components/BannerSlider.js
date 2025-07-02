import React, { useRef, useState, useEffect } from 'react';

const BannerSlider = () => {
  const slidesRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideRef = useRef(null);
  const slideCount = 4;

  const updateSlide = (index) => {
    if (slidesRef.current) {
      slidesRef.current.style.transform = `translateX(-${index * 100}%)`;
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 3000);
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
  };

  useEffect(() => {
    updateSlide(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const handleButtonClick = (index) => {
    stopAutoSlide();
    setCurrentIndex(index);
    startAutoSlide();
  };

  return (
    <div className="banner-container">
      <div className="banner-slides" ref={slidesRef}>
        <a href="https://mind-bridge-zeta.vercel.app">
          <img src="/main.png" alt="마인드브릿지 설명 배너" />
        </a>
        <a href="https://mind-bridge-zeta.vercel.app/self">
          <img src="/main2.png" alt="자가진단" />
        </a>
        <a href="*">
          <img src="/main3.png" alt="병원위치 안내문" />
        </a>
        <a href="http://www.hellosmile.kr/bbs/board.php?bo_table=26" target="_blank" rel="noopener noreferrer">
          <img src="http://hellosmile.kr/main/slideshow/main_banner04.png" alt="상담고객 리얼후기" />
        </a>
      </div>
      <div className="button-container">
        {[...Array(slideCount)].map((_, idx) => (
          <div
            key={idx}
            className={`banner-button ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => handleButtonClick(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
