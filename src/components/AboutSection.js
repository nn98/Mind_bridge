/* eslint-disable no-undef */
import React, { useEffect } from 'react';
import BannerSlider from './BannerSlider';
import '../css/AboutSection.css';
import '../css/ServiceGrid.css';
import { Link } from 'react-router-dom';

const AboutSection = ({ refs, scrollTarget, setScrollTarget }) => {
  const { introRef, locationRef, servicesRef, infoRef } = refs;

  useEffect(() => {
    if (scrollTarget) {
      const refMap = {
        intro: introRef,
        location: locationRef,
        services: servicesRef,
        info: infoRef,
      };

      const targetRef = refMap[scrollTarget];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth' });
        setScrollTarget(null);
      }
    }
  }, [scrollTarget]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      if (window.google) {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(drawChart);
      }

      function drawChart() {
        const data = window.google.visualization.arrayToDataTable([
          ['연령대', '스트레스 경험 비율 (%)', { role: 'style' }, { role: 'annotation' }],
          ['10대', 23, '#6c63ff', '23%'],
          ['20대', 36, '#6c63ff', '36%'],
          ['30대', 29, '#6c63ff', '29%'],
          ['40대 이상', 12, '#6c63ff', '12%'],
        ]);

        const options = {
          chartArea: { width: '85%', height: '70%' },
          fontName: 'Pretendard',
          vAxis: {
            title: '',
            gridlines: { count: 5 },
            textStyle: { color: '#666' },
          },
          bar: { groupWidth: '55%' },
          legend: { position: 'none' },
          annotations: {
            alwaysOutside: true,
            textStyle: {
              fontSize: 13,
              bold: true,
              color: '#6c63ff',
            },
          },
          animation: {
            startup: true,
            duration: 800,
            easing: 'out',
          },
        };

        const chart = new window.google.visualization.ColumnChart(document.getElementById('chart_div'));
        chart.draw(data, options);
      }
    };
    document.body.appendChild(script);
  }, []);

  const services = [
    {
      icon: '🤖',
      title: 'AI 감성 요약 · 분석 · 채팅',
      description: '사용자 인터렉티브 기반으로 감정을 분석하고 요약하여 자신의 감정 상태를 객관적으로 이해할 수 있도록 도와드립니다.',
    },
    {
      icon: '🏥',
      title: '병원 목록',
      description: '전국 심리상담센터 위치를 목록을 통해 알 수 있습니다.',
    },
    {
      icon: '📧',
      title: '웹 메일 호스팅',
      description: '유관 기관 연결 및 번역을 지원하는 웹 메일 호스팅으로 도움을 요청하고 받을 수 있습니다.',
    },
    {
      icon: '🖼️',
      title: 'AI 이미지 생성',
      description: '사용자가 작성한 감정과 상태를 분석하여 시각화하는 AI 이미지를 생성합니다.',
      path: '/img',
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


  const steps = [
    {
      number: '1',
      title: '회원가입 및 프로필 설정',
      description: '간단한 정보 입력으로 회원가입을 완료하고, 자신에게 맞는 프로필을 설정합니다.',
      icon: '👤',
    },
    {
      number: '2',
      title: 'AI 상담사와 대화',
      description: 'AI 상담사와 자유롭게 대화하며 자신의 감정과 고민을 털어놓습니다.',
      icon: '💬',
    },
    {
      number: '3',
      title: '맞춤형 치유 경험',
      description: 'AI가 분석한 결과를 바탕으로 개인화된 치유 방법과 조언을 받습니다.',
      icon: '💜',
    },
  ];

  return (
    <>
      <BannerSlider />

      <section ref={introRef} className="section about-section">
        <h1 className="about-title">회사 소개</h1>
        <div className="about-cards">
          <div className="about-card">
            <h2>AI 정서 분석의 선두주자, MindBridge</h2>
            <p>
              MindBridge는 첨단 인공지능 기술을 바탕으로 사용자의 감정과 심리 상태를 분석하고,
              개인화된 상담과 치유 경험을 제공합니다. 단순한 감정 파악을 넘어, 내면의 목소리를 듣고
              위로하는 새로운 방법을 제시합니다.
            </p>
            <p>
              우리의 목표는 기술이 사람을 이해하고 치유할 수 있는 미래를 여는 것입니다.
              누구나 쉽고 빠르게 정서적 도움을 받을 수 있는 사회를 만들어 갑니다.
            </p>
          </div>

          <div className="about-card">
            <h2>개인의 사생활 보호와 심리적 안정감 보장</h2>
            <p>
              익명성과 정보 보호는 MindBridge의 핵심 가치 중 하나입니다.
              사용자의 대화와 정보는 모두 암호화되어 안전하게 보호되며,
              심리상담에 대한 부담 없이 자유롭게 자신의 이야기를 털어놓을 수 있도록 설계되어 있습니다.
            </p>
            <p>
              우리는 사용자의 마음에 진심으로 다가가는 파트너가 되기를 희망합니다.
            </p>
          </div>

          <div className="about-card">
            <h2>일상 속 정서 케어, 모두를 위한 마음 건강</h2>
            <p>
              MindBridge는 누구나 일상에서 정서적 케어를 받을 수 있도록,
              직관적이고 접근성 높은 서비스를 제공합니다. 자가진단, AI 상담, 이미지 생성,
              병원 찾기 등 다양한 기능을 통합하여 통합적인 정신 건강 플랫폼을 지향합니다.
            </p>
            <p>
              이제 마음이 힘들 땐, 혼자 고민하지 마세요. MindBridge가 함께합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ 추가된 정신 건강 그래프 섹션 */}
      <section className="section mental-health-chart-section">
        <h2 className="section-title">연령대별 정신적 스트레스 비율</h2>
        <div id="chart_div" style={{ width: '100%', height: '400px' }}></div>
      </section>

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

      <section className="howitworks-section">
        <h2 className="howitworks-title">MindBridge 이용 방법</h2>
        <p className="howitworks-subtitle">간단한 단계로 시작하는 마음 치유의 여정</p>
        <div className="howitworks-grid">
          {steps.map((step, index) => (
            <div key={index} className="howitworks-card">
              <div className="step-circle">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <div className="icon">{step.icon}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={infoRef} className="section-help">
        <h2 className="section-title">문의 하기</h2>
        <div className="grid-container">
          <div className="card2">
            <form className="contact-form" onSubmit={(e) => {
              e.preventDefault();
              alert('메시지가 전송되었습니다!');
            }}>
              <div className="row-two">
                <div className="form-group">
                  <label htmlFor="name">이름</label>
                  <input id="name" type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">이메일</label>
                  <input id="email" type="email" name="email" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title">제목</label>
                <input id="title" type="text" name="title" required />
              </div>

              <div className="form-group">
                <label htmlFor="message">메시지</label>
                <textarea id="message" name="message" rows={5} required />
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
                  <p className="bold-text">mindbridge2020@gmail.com</p>
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
                  <p className="bold-text">서울특별시 종로구 종로12길 15</p>
                  <p className="sub-text">코아빌딩 5층</p>
                </div>
              </div>

              <h4>소셜 미디어</h4>
              <div className="social-icons">
                <a href="https://open.kakao.com/o/s2eNHUGh" target="_blank" rel="noopener noreferrer">
                  <img src="/mindcafe.png" alt="카카오채널" />
                </a>
                <a href="https://www.instagram.com/mindbridge2020/" target="_blank" rel="noopener noreferrer">
                  <img src="/instagram.png" alt="인스타그램" />
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
