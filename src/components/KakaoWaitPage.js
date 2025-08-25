import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_API_URL = "http://localhost:8080/api/auth/social/kakao";

function KakaoWaitPage({ setCustomUser, setIsCustomLoggedIn }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('카카오 인증 처리 중...');

  // useRef로 중복 실행 제어용 플래그
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setLoading(false);
      setMessage('인가 코드가 없습니다. 다시 로그인하세요.');
      return;
    }

    // 중복 실행 방지 체크
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const loginProcess = async () => {
      try {
        const res = await axios.get(`${BACKEND_API_URL}?code=${code}`, {
          withCredentials: true,  // 쿠키 포함 요청
        });
        setLoading(false);

        const data = res.data;
        console.log("서버 응답 데이터:", data);

        if (data.success) {
          setMessage('로그인 성공! 환영합니다.');

          if (data.user) {
            console.log('user:', data.user);
            localStorage.setItem("token", "LOGIN");
            if (setCustomUser) setCustomUser(data.user);
            if (setIsCustomLoggedIn) setIsCustomLoggedIn(true);
          }

          setTimeout(() => navigate('/'), 1000);
        } else {
          setMessage('로그인 실패: 응답에 success=false');
        }
      } catch (err) {
        setLoading(false);
        setMessage('서버 에러: ' + (err.response?.data?.message || err.message));
      }
    };

    loginProcess();

    // Cleanup 함수 필요 없으므로 생략
  }, [searchParams, navigate, setCustomUser, setIsCustomLoggedIn]);

  return (
    <div>
      <h2>카카오 로그인 처리 중</h2>
      {loading ? <p>잠시만 기다려주세요...</p> : <p>{message}</p>}
    </div>
  );
}

export default KakaoWaitPage;
