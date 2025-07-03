import React from 'react';
import BannerSlider from './BannerSlider';
import NoticeBoard from '../components/NoticeBoard';
import '../css/AboutSection.css';

const AboutSection = ({ refs }) => {
  const { introRef, noticeRef, locationRef } = refs;

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

        <div className="about-box">
          <h2>핵심 기능</h2>
          <table className="about-table">
            <thead>
              <tr>
                <th>기능명</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AI 감정 분석</td>
                <td>실시간 텍스트 분석을 통한 정서 상태 파악</td>
              </tr>
              <tr>
                <td>챗봇 상담</td>
                <td>개인화된 익명 대화형 정서 상담</td>
              </tr>
              <tr>
                <td>상담 기록 저장</td>
                <td>상담 이력을 저장하고 마이페이지에서 확인 가능</td>
              </tr>
              <tr>
                <td>자가진단 테스트</td>
                <td>우울, 불안, 스트레스 등 주요 항목 자가 체크</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="about-box">
          <h2>Mind_bridge가 지향하는 가치</h2>
          <ul className="about-list">
            <li>누구나 쉽게 이용할 수 있는 정서 케어</li>
            <li>안전한 데이터 보호와 익명성 보장</li>
            <li>데이터 기반 맞춤형 피드백 제공</li>
            <li>지속 가능한 마음 건강 지원</li>
          </ul>
        </div>
      </section>

      <section ref={noticeRef} className="section">
        <center><h1>공지 사항</h1></center>
        <NoticeBoard />
      </section>

      <section ref={locationRef} className="section">
        <center><h1>회사 위치</h1></center>
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
