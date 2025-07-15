import React, { useEffect } from 'react';
import BannerSlider from './BannerSlider';
import '../css/AboutSection.css';
import '../css/ServiceGrid.css';
import { Link } from 'react-router-dom';

const AboutSection = ({ refs, scrollTarget, setScrollTarget }) => {
  const { introRef, locationRef, servicesRef } = refs;

  useEffect(() => {
    if (scrollTarget) {
      const refMap = {
        intro: introRef,
        location: locationRef,
        services: servicesRef, // ✅ 추가
      };

      const targetRef = refMap[scrollTarget];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth' });
        setScrollTarget(null);
      }
    }
  }, [scrollTarget]);

  const services = [
    {
      icon: '🤖',
      title: 'AI 감성 요약 · 분석 · 채팅',
      description: '사용자 인터렉티브 기반으로 감정을 분석하고 요약하여 자신의 감정 상태를 객관적으로 이해할 수 있도록 도와드립니다.',
    },
    {
      icon: '🖼️',
      title: 'AI 이미지 생성',
      description: '감정과 상태를 시각화하는 AI 이미지를 생성합니다.',
      path: '/img',
    },
    {
      icon: '📧',
      title: '웹 메일 호스팅',
      description: '유관 기관 연결 및 번역을 지원하는 웹 메일 호스팅으로 도움을 요청하고 받을 수 있습니다.',
    },
    {
      icon: '🏥',
      title: '병원 목록',
      description: '전국 심리상담센터 위치를 목록을 통해 알 수 있습니다.',
    },
    {
      icon: '📝',
      title: '게시판',
      description: '게시판을 통해 여러 사람들과 자신의 상황과 상담 결과를 공유 할 수 있습니다.',
      path: '/board',
    },
    {
      icon: '📋',
      title: '자가진단',
      description: '자신의 상태를 간단한 자가진단을 통해 유추해 볼 수 있습니다.',
      path: '/self',
    },
  ];

  return (
    <>
      <BannerSlider />

      <section ref={introRef} className="section about-section">
        <h1 className="about-title">회사 소개</h1>
        <div className="about-box">
          <p>
            Mind Bridge는 인공지능을 기반으로 정서 분석 및 상담 기능을 제공하는 정서 케어 플랫폼입니다.
            사용자의 감정 상태를 실시간으로 분석하고, 챗봇과 자가진단 도구를 통해 맞춤형 피드백을 제공합니다.
          </p>
          <p>
            정서적 건강을 위한 첫걸음, Mind Bridge는 익명성과 보안을 고려하여 누구나 부담 없이 감정을 나눌 수 있는 공간을 지향합니다.
            누구나 쉽게 접근할 수 있도록 설계된 AI 기반 케어 서비스를 통해 사용자 일상 속에서 감정적 안정감을 지원합니다.
          </p>
        </div>
      </section>

      {/* ✅ Mind Bridge의 핵심 기능 */}
      <section ref={servicesRef} className="service-grid-section">
        <h2 className="section-title">Mind Bridge의 핵심 기능</h2>
        <div className="grid-container">
          {services.map((service, index) => (
            <div className="card" key={index}>
              <div className="icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              {service.path && (
                <Link to={service.path} className="learn-more">
                  페이지로 이동 &gt;
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className='section-help'>
        <h2 className='section-title'>문의 하기</h2>
        <div className="grid-container">
          <div className="card2">
            <form className="contact-form" onSubmit={(e) => {
              e.preventDefault();
              alert('메시지가 전송되었습니다!');
            }}>
              <div className="row-two">
                <div className="form-group">
                  <label>이름</label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input type="email" name="email" required />
                </div>
              </div>

              <div className="form-group">
                <label>제목</label>
                <input type="text" name="title" required />
              </div>

              <div className="form-group">
                <label>메시지</label>
                <textarea name="message" rows={5} required />
              </div>

              <button type="submit">보내기</button>
            </form>
          </div>
          <div className="card2">
            <div className="contact-info">
              <h3>연락처 정보</h3>

              <div className="info-row">
                <span className="icon">📧</span>
                <div className="info-text">
                  <p className="bold-text">info@mindbridge.co.kr</p>
                  <p className="sub-text">이메일로 문의하기</p>
                </div>
              </div>

              <div className="info-row">
                <span className="icon">☎️</span>
                <div className="info-text">
                  <p className="bold-text">02-123-4567</p>
                  <p className="sub-text">평일 9:00 - 18:00</p>
                </div>
              </div>

              <div className="info-row">
                <span className="icon">🏥</span>
                <div className="info-text">
                  <p className="bold-text">서울특별시 강남구 테헤란로 123</p>
                  <p className="sub-text">마인드브릿지 빌딩 8층</p>
                </div>
              </div>

              <h4>소셜 미디어</h4>
              <div className="social-icons">
                <a href="https://open.kakao.com/o/s2eNHUGh" target="_blank" rel="noopener">
                  <img src="./mindcafe.png" alt="카카오채널" />
                </a>
                <a href="https://www.instagram.com/mindbridge2020/" target="_blank" rel="noopener">
                  <img src="./instagram.png" alt="인스타그램" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
