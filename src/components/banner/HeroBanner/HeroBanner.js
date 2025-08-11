import { useState } from 'react';
import HeroBannerSlides from './HeroBannerSlides';
import HeroBannerButtons from './HeroBannerButtons';
import useHeroAutoSlide from './useHeroAutoSlide';
import slides from './heroBannerData';
import '../../../css/banner.css';
import '../../../css/header.css';

const HeroBanner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { slidesRef, startAutoSlide, stopAutoSlide } = useHeroAutoSlide(setCurrentIndex, slides.length);

    const handleButtonClick = (index) => {
        stopAutoSlide();
        setCurrentIndex(index);
        startAutoSlide();
    };

    return (
        <div className="banner-container">
            <HeroBannerSlides slides={slides} slidesRef={slidesRef} currentIndex={currentIndex} />
            <HeroBannerButtons
                count={slides.length}
                currentIndex={currentIndex}
                onClick={handleButtonClick}
            />
        </div>
    );
};

export default HeroBanner;
