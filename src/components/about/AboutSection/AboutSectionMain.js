// src/components/about/AboutSection/AboutSectionMain.jsx
import '../../../css/AboutSection.css';
import AboutCards from './AboutCards';
import ServicesGrid from './ServicesGrid';
import HowItWorks from './HowItWorks';
import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';
import MonthlyLineChart from '../charts/MonthlyLineChart';
import useSmoothScroll from '../hooks/useSmoothScroll';

export default function AboutSection({
  refs = {},                       // ✅ 기본값
  scrollTarget,
  setScrollTarget,
  setIsEmotionModalOpen,
  visibleSections,
  layout = 'page',
}) {
  // refs 안전 접근
  const introRef = refs?.introRef ?? null;
  const servicesRef = refs?.servicesRef ?? null;
  const infoRef = refs?.infoRef ?? null;

  // 어떤 섹션을 노출할지
  const showAll = !visibleSections || visibleSections.length === 0;
  const has = (k) => showAll || visibleSections.includes(k);
  const show = {
    hero: has('hero'),
    intro: has('intro'),
    stress: has('stress'),
    services: has('services'),
    how: has('how'),
    contact: has('contact'),
  };

  // 훅은 항상 호출, 내부에서 enabled로 동작 제어
  useSmoothScroll({
    scrollTarget,
    setScrollTarget,
    refMap: {
      intro: introRef,
      location: refs?.locationRef ?? null,
      services: servicesRef,
      info: infoRef,
    },
    enabled: layout === 'page',     // ✅ embed일 땐 동작 안 함
  });

  const wrapClass = layout === 'embed' ? 'about-embed' : 'about-page';

  return (
    <>

      <div className={wrapClass}>
        {show.intro && (
          <section ref={introRef} className="section about-section">
            <h1 className="about-title">회사 소개</h1>
            <AboutCards />
          </section>
        )}

        {show.stress && (
          <section className="section mental-health-chart-section">
            <h2 className="section-title">연령대별 정신적 스트레스 비율</h2>
            <MonthlyLineChart />
            <p
              style={{
                fontSize: '0.85rem',
                color: '#666',
                textAlign: 'right',
                marginTop: '0.5rem',
                fontStyle: 'italic',
              }}
            >
              ※ 출처: 보건복지부 「2023~2025년 모의 집계」
            </p>
          </section>
        )}

        {layout === 'page' && show.services && (
          <section ref={servicesRef} className="service-grid-section">
            <h2 className="section-title">Mind Bridge의 핵심 기능</h2>
            <ServicesGrid setIsEmotionModalOpen={setIsEmotionModalOpen} />
          </section>
        )}

        {layout === 'page' && show.how && (
          <section className="howitworks-section">
            <h2 className="howitworks-title">MindBridge 이용 방법</h2>
            <HowItWorks />
          </section>
        )}

        {layout === 'page' && show.contact && (
          <section ref={infoRef} className="section-help">
            <h2 className="section-title">문의 하기</h2>
            <div className="grid-container">
              <div className="card2"><ContactForm /></div>
              <div className="card2"><ContactInfo /></div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
