import { useEffect } from 'react';

const HeroBannerSlides = ({ slides, slidesRef, currentIndex }) => {
    useEffect(() => {
        if (slidesRef.current) {
            slidesRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }, [currentIndex, slidesRef]);

    return (
        <div className="banner-slides" ref={slidesRef}>
            {slides.map((slide, idx) => (
                <a key={idx} href={slide.href}>
                    <img src={slide.src} alt={slide.alt} />
                </a>
            ))}
        </div>
    );
};

export default HeroBannerSlides;
