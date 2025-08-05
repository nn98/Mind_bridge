import React, { useEffect } from 'react';
import BannerSlider from './BannerSlider';
import '../css/AboutSection.css';
import '../css/ServiceGrid.css';
import { Link } from 'react-router-dom';
import emailjs from 'emailjs-com';

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

    const drawChart = () => {
      const data = window.google.visualization.arrayToDataTable([
        ['월', '의뢰 건수'],
        ['2023-01', 108], ['2023-02', 112], ['2023-03', 125], ['2023-04', 134], ['2023-05', 141], ['2023-06', 137],
        ['2023-07', 145], ['2023-08', 152], ['2023-09', 147], ['2023-10', 138], ['2023-11', 130], ['2023-12', 135],
        ['2024-01', 138], ['2024-02', 131], ['2024-03', 144], ['2024-04', 152], ['2024-05', 160], ['2024-06', 158],
        ['2024-07', 167], ['2024-08', 173], ['2024-09', 165], ['2024-10', 162], ['2024-11', 158], ['2024-12', 161],
        ['2025-01', 160], ['2025-02', 155], ['2025-03', 168], ['2025-04', 178], ['2025-05', 190], ['2025-06', 185],
        ['2025-07', 192],
      ]);

      const options = {
        title: '2023 ~ 2025 월간 의뢰 현황',
        chartArea: { width: '90%', height: '65%' },
        fontName: 'Pretendard',
        curveType: 'function',
        legend: { position: 'none' },
        lineWidth: 4,
        pointSize: 6,
        hAxis: {
          slantedText: true,
          slantedTextAngle: 45,
          textStyle: { fontSize: 11 }
        },
        vAxis: {
          title: '건수',
          gridlines: { count: 6 },
        },
        series: {
          0: {
            color: '#6c63ff',
          },
        },
        animation: {
          startup: true,
          duration: 900,
          easing: 'out',
        },
      };

      const chart = new window.google.visualization.LineChart(document.getElementById('monthly_chart'));
      chart.draw(data, options);
    };

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart'] });
      window.google.charts.setOnLoadCallback(drawChart);
    };
    document.body.appendChild(script);
  }, []);

  const services = [
    {
      icon: '📖',
      title: '자료실',
      description: '사용자의 현재 상태에 대한 모르는 부분을 볼 수 있는 자료실 입니다.',
      path: '/library'
    },
    {
      icon: '🤖',
      title: 'AI 감성 요약 · 분석 · 채팅',
      description: '사용자 인터렉티브 기반으로 감정을 분석하고 요약하여 자신의 감정 상태를 객관적으로 이해할 수 있도록 도와드립니다.',
      path: '/emotion-analysis'
    },
    {
      icon: '🏥',
      title: '병원 목록',
      description: '전국 심리상담센터 위치를 목록을 통해 알 수 있습니다.',
      path: '/hospital-region',
    },
    {
      icon: '🖼️',
      title: '이미지 테라피',
      description: '사용자가 작성한 감정상태 및 상담내용 바탕으로 이미지 생성 및 관리자 메일에 전송을 가능하게 합니다.',
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
        <div id="monthly_chart" style={{ width: '100%', height: '500px' }}></div>
        <p style={{
          fontSize: '0.85rem',
          color: '#666',
          textAlign: 'right',
          marginTop: '0.5rem',
          fontStyle: 'italic'
        }}>
          ※ 출처: 보건복지부 「2023~2025년 모의 집계 」
        </p>
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
              emailjs.sendForm(
                process.env.REACT_APP_EMAILJS_SERVICE_ID,
                process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                e.target,
                process.env.REACT_APP_EMAILJS_PUBLIC_KEY
              ).then(() => {
                alert('메시지가 전송되었습니다!');
                e.target.reset();
              }).catch((error) => {
                alert('전송 실패: ' + error.text);
              });
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
                  <p className="sub-text">코아빌딩 2층</p>
                </div>
              </div>
              <h4>소셜 미디어</h4>
              <div className="social-icons">
                <a href="https://open.kakao.com/o/s2eNHUGh" target="_blank" rel="noopener noreferrer">
                  <img src="/img/mindcafe.png" alt="카카오채널" />
                </a>
                <a href="https://www.instagram.com/mindbridge2020/" target="_blank" rel="noopener noreferrer">
                  <img src="/img/instagram.png" alt="인스타그램" />
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