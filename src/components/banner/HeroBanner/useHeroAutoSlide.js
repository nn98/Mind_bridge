import { useRef, useEffect } from 'react';

const useHeroAutoSlide = (setCurrentIndex, slideCount, interval = 3000) => {
    const slidesRef = useRef(null);
    const autoSlideRef = useRef(null);

    const startAutoSlide = () => {
        stopAutoSlide();
        autoSlideRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slideCount);
        }, interval);
    };

    const stopAutoSlide = () => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };

    useEffect(() => {
        startAutoSlide();
        return () => stopAutoSlide();
    }, []);

    return { slidesRef, startAutoSlide, stopAutoSlide };
};

export default useHeroAutoSlide;
