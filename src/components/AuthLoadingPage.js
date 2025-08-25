// src/components/AuthLoadingPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthLoadingPage = ({ setCustomUser, setIsCustomLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      try {
        // 1~2초 인위적 대기
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // /api/auth/me 호출 (withCredentials: 쿠키 전송)
        const res = await axios.get("http://localhost:8080/api/auth/me", { withCredentials: true });

        // 유저 정보 React 상태 및 로컬스토리지에 저장
        if (setCustomUser) setCustomUser(res.data);
        if (setIsCustomLoggedIn) setIsCustomLoggedIn(true);
        localStorage.setItem("customUser", JSON.stringify(res.data));

        // 리다이렉트
        navigate("/", { replace: true });
      } catch (error) {
        // 인증 실패 시 상태 초기화 및 로컬스토리지 제거, 로그인 페이지 이동
        if (setCustomUser) setCustomUser(null);
        if (setIsCustomLoggedIn) setIsCustomLoggedIn(false);
        localStorage.removeItem("customUser");
        navigate("/login", { replace: true });
      }
    };

    fetchUserAndRedirect();
  }, [navigate, setCustomUser, setIsCustomLoggedIn]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>로그인 상태 확인 중...</h2>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
};

export default AuthLoadingPage;
