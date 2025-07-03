
import NoticeBoard from './NoticeBoard';
import BannerSlider from './BannerSlider';

const AboutSection = ({ refs }) => {
  const { introRef, noticeRef, locationRef } = refs;

  return (
    <>
      <BannerSlider />

      <section ref={introRef} className="section">
        <h2>회사 소개</h2>
        <p>Mind Bridge는 인공지능 기반 정서 분석 및 상담 서비스를 제공합니다.</p>
      </section>

      <section ref={noticeRef} className="section">
        <h2>공지 사항</h2>
        <NoticeBoard/>
      </section>

      <section ref={locationRef} className="section">
        <h2>회사 위치</h2>
        <div className="map-container">
          <iframe
            src="https://map.naver.com/p/search/%EC%86%94%EB%8D%B0%EC%8A%A4%ED%81%AC?c=15.00,0,0,0,dh"
            allowFullScreen
            className="map-iframe"
            title="회사 위치"
          />
          <p className="map-caption">📍 서울특별시 종로구 종로12길 15 코아빌딩 2층, 5층, 8층, 9층, 10층</p>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
