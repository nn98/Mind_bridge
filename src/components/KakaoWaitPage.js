import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BACKEND_API_URL = process.env.REACT_APP_KAKAO_BACKEND_API_URL; // 실제 API 엔드포인트

function KakaoWaitPage() {
  // 쿼리스트링에서 code 추출
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('카카오 인증 처리 중...');
  const navigate = useNavigate();

  useEffect(() => {
    // 인가 코드가 있을 때 백엔드로 요청
    if (code) {
      fetch(`${BACKEND_API_URL}?code=${code}`)
        .then(res => res.json())
        .then(data => {
          setLoading(false);
          if (data.token) {
            setMessage('로그인 성공! 환영합니다.');
            // token 저장 (예시)
            localStorage.setItem('token', data.token);
            setTimeout(() => navigate('/'), 1000); // 메인으로 이동
          } else {
            setMessage('로그인 실패: ' + JSON.stringify(data));
          }
        })
        .catch(err => {
          setLoading(false);
          setMessage('서버 에러: ' + err.message);
        });
    } else {
      setLoading(false);
      setMessage('인가 코드가 없습니다. 다시 로그인하세요.');
    }
  }, [code, navigate]);

  return (
    <div>
      <h2>카카오 로그인 처리 중</h2>
      {loading ? <p>잠시만 기다려주세요...</p> : <p>{message}</p>}
    </div>
  );
}

export default KakaoWaitPage;
