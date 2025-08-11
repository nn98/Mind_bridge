
const ContactInfo = () => (
    <div className="contact-info">
        <h3>연락처 정보</h3>
        <div className="info-row"><span className="icon">📧</span><div className="info-text"><p className="bold-text">mindbridge2020@gmail.com</p><p className="sub-text">이메일로 문의하기</p></div></div>
        <div className="info-row"><span className="icon">☎️</span><div className="info-text"><p className="bold-text">02-123-4567</p><p className="sub-text">평일 9:00 - 18:00</p></div></div>
        <div className="info-row"><span className="icon">🏥</span><div className="info-text"><p className="bold-text">서울특별시 종로구 종로12길 15</p><p className="sub-text">코아빌딩 2층</p></div></div>
        <h4>소셜 미디어</h4>
        <div className="social-icons">
            <a href="https://open.kakao.com/o/s2eNHUGh" target="_blank" rel="noopener noreferrer"><img src="/img/mindcafe.png" alt="카카오채널" /></a>
            <a href="https://www.instagram.com/mindbridge2020/" target="_blank" rel="noopener noreferrer"><img src="/img/instagram.png" alt="인스타그램" /></a>
        </div>
    </div>
);
export default ContactInfo;