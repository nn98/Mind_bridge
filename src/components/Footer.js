import '../css/header.css';

const Footer = () => {
  return (
    <footer className="footer">
      <strong>
        <h4>Contact</h4><br />
        <h2>02-1234-5678</h2>
        <h2>이메일 : help@mindbridge.ai</h2> <br /><br /><hr className="line" /><br />
        <h3>(주) 화재감지기</h3><br />
        <h5>주소 : 서울특별시 종로구 종로12길 15 코아빌딩 5층</h5><br />
        <div className="footer-icons">
          <a href="https://open.kakao.com/o/s2eNHUGh" target="_blank" rel="noopener">
            <img src="./mindcafe.png" alt="카카오채널" />
          </a>
          <a href="https://www.instagram.com/mindbridge2020/" target="_blank" rel="noopener">
            <img src="./instagram.png" alt="인스타그램" />
          </a>
        </div>
      </strong>
    </footer>
  );
};

export default Footer;