import '../../../css/AboutSection.css';
import AboutCards from './AboutCards';
import ServicesGrid from './ServicesGrid';
import HowItWorks from './HowItWorks';
import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';
import MonthlyLineChart from '../charts/MonthlyLineChart';
import useSmoothScroll from '../hooks/useSmoothScroll';
import HeroBanner from '../../banner/HeroBanner/HeroBanner';

const AboutSection = ({ refs, scrollTarget, setScrollTarget, setIsEmotionModalOpen }) => {
  const { introRef, servicesRef, infoRef } = refs;
  useSmoothScroll({
    scrollTarget,
    setScrollTarget,
    refMap: {
      intro: refs.introRef,
      location: refs.locationRef,
      services: refs.servicesRef,
      info: refs.infoRef,
    },
  });

  return (
    <>
      <HeroBanner />
      <section ref={introRef} className="section about-section">
        <h1 className="about-title">회사 소개</h1>
        <AboutCards />
      </section>
      <section className="section mental-health-chart-section">
        <h2 className="section-title">연령대별 정신적 스트레스 비율</h2>
        <MonthlyLineChart />
        <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'right', marginTop: '0.5rem', fontStyle: 'italic' }}>
          ※ 출처: 보건복지부 「2023~2025년 모의 집계 」
        </p>
      </section>
      <section ref={servicesRef} className="service-grid-section">
        <h2 className="section-title">Mind Bridge의 핵심 기능</h2>
        <ServicesGrid setIsEmotionModalOpen={setIsEmotionModalOpen} />
      </section>
      <section className="howitworks-section">
        <h2 className="howitworks-title">MindBridge 이용 방법</h2>
        <HowItWorks />
      </section>
      <section ref={infoRef} className="section-help">
        <h2 className="section-title">문의 하기</h2>
        <div className="grid-container">
          <div className="card2">
            <ContactForm />
          </div>
          <div className="card2">
            <ContactInfo />
          </div>
        </div>
      </section>
    </>
  );
};
export default AboutSection;