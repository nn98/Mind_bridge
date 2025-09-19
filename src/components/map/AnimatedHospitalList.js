import {useRef, useState, useEffect} from 'react';
import {motion, useInView} from 'motion/react';

const AnimatedHospitalItem = ({children, delay = 0, index, onMouseEnter, onClick, isSelected}) => {
    const ref = useRef(null);
    const inView = useInView(ref, {amount: 0.3, triggerOnce: false});

    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            initial={{scale: 0.95, opacity: 0, y: 20}}
            animate={inView ? {scale: 1, opacity: 1, y: 0} : {scale: 0.95, opacity: 0, y: 20}}
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            transition={{duration: 0.3, delay, ease: "easeOut"}}
            className={`hospital-card animated ${isSelected ? 'active' : ''}`}
        >
            {children}
        </motion.div>
    );
};

const AnimatedHospitalList = ({
                                  hospitals = [],
                                  onHospitalSelect,
                                  showGradients = true,
                                  enableArrowNavigation = true,
                                  className = '',
                                  currentPage = 1,
                                  userLoc = null,
                                  selectedHospitalIndex = -1
                              }) => {
    const listRef = useRef(null);
    const [selectedIndex, setSelectedIndex] = useState(selectedHospitalIndex);
    const [keyboardNav, setKeyboardNav] = useState(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

    const handleScroll = (e) => {
        const {scrollTop, scrollHeight, clientHeight} = e.target;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(
            scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
        );
    };

    useEffect(() => {
        if (!enableArrowNavigation) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.min(prev + 1, hospitals.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < hospitals.length) {
                    e.preventDefault();
                    if (onHospitalSelect) {
                        onHospitalSelect(hospitals[selectedIndex], selectedIndex);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hospitals, selectedIndex, onHospitalSelect, enableArrowNavigation]);

    useEffect(() => {
        if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;

        const container = listRef.current;
        const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);

        if (selectedItem) {
            const extraMargin = 50;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;

            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({top: itemTop - extraMargin, behavior: 'smooth'});
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({
                    top: itemBottom - containerHeight + extraMargin,
                    behavior: 'smooth'
                });
            }
        }
        setKeyboardNav(false);
    }, [selectedIndex, keyboardNav]);

    // 페이지 변경 시 선택 초기화
    useEffect(() => {
        setSelectedIndex(-1);
    }, [currentPage]);

    return (
        <div className={`hospital-list-container ${className}`}>
            <div
                ref={listRef}
                className="hospital-list animated-scroll"
                onScroll={handleScroll}
            >
                {hospitals.map((hospital, idx) => (
                    <AnimatedHospitalItem
                        key={`${hospital.name}-${idx}-${currentPage}`}
                        delay={idx * 0.05} // 순차적 애니메이션
                        index={idx}
                        isSelected={selectedIndex === idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                            setSelectedIndex(idx);
                            if (onHospitalSelect) {
                                onHospitalSelect(hospital, idx);
                            }
                        }}
                    >
                        <div className="hospital-number">
                            {((currentPage - 1) * 10) + idx + 1}
                        </div>
                        <h3>{hospital.name}</h3>
                        <p><strong>📍 주소:</strong> {hospital.address}</p>
                        <p><strong>📞 전화번호:</strong> {hospital.phone || "정보 없음"}</p>
                        {userLoc && hospital.distance && (
                            <div className="hospital-distance">
                <span className="distance-badge">
                  🚗 {hospital.distance} km
                </span>
                                <span className="time-badge">
                  ⏱️ 약 {hospital.drivingTime}분
                </span>
                            </div>
                        )}
                    </AnimatedHospitalItem>
                ))}
            </div>

            {showGradients && (
                <>
                    <div
                        className="scroll-gradient-top"
                        style={{opacity: topGradientOpacity}}
                    />
                    <div
                        className="scroll-gradient-bottom"
                        style={{opacity: bottomGradientOpacity}}
                    />
                </>
            )}
        </div>
    );
};

export default AnimatedHospitalList;