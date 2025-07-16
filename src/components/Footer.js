import '../css/header.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h4>ⓘ MindBridge</h4>
          <p>마음을 연결하고 치유하는 AI 테라피 솔루션</p>
        </div>

        <div className="footer-column">
          <h4>서비스</h4>
          <ul>
            <li>AI 상담</li>
            <li>감정 분석</li>
            <li>이미지 테라피</li>
            <li>맞춤형 조언</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>회사</h4>
          <ul>
            <li>소개</li>
            <li>팀</li>
            <li>채용</li>
            <li>블로그</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>법적 정보</h4>
          <ul>
            <li>이용약관</li>
            <li>개인정보처리방침</li>
            <li>쿠키 정책</li>
          </ul>
        </div>
      </div>

      <hr />

      <div className="footer-bottom">
        <p>© 2025 MindBridge. All rights reserved.</p>
        <p>서울특별시 종로구 종로12길 15 코아빌딩 5층 | 사업자등록번호: 123-45-67890</p>
      </div>
    </footer>
  );
};

export default Footer;