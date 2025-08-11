const HeroBannerButtons = ({ count, currentIndex, onClick }) => (
    <div className="button-container">
        {[...Array(count)].map((_, idx) => (
            <div
                key={idx}
                className={`banner-button ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => onClick(idx)}
            />
        ))}
    </div>
);

export default HeroBannerButtons;
