import AboutSection from '../about/AboutSection/AboutSectionMain';

export default function DashboardHome() {
    return (
        <div className="card" style={{ padding: 0 }}>
            <div className="card-head">
                <h3>소개 / 정신적 스트레스 비율</h3>
                <span className="sub">회사 소개와 주요 지표</span>
            </div>
            <div className="card-body">
                <AboutSection
                    layout="embed"
                    visibleSections={['intro', 'stress']}
                    refs={{}}
                    scrollTarget={null}
                    setScrollTarget={() => { }}
                    setIsEmotionModalOpen={() => { }}
                />
            </div>
        </div>
    );
}
