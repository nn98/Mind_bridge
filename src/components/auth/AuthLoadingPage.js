// src/components/AuthLoadingPage.jsx
import { useAuthLoading } from "./useAuthLoading";

const AuthLoadingPage = ({ setCustomUser, setIsCustomLoggedIn }) => {
  useAuthLoading({ setCustomUser, setIsCustomLoggedIn, waitMs: 1500 });

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>로그인 상태 확인 중...</h2>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
};

export default AuthLoadingPage;
