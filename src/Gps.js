// 현재 위치 기반 찾기 좌표값으로
// 정확도 낮음

import React, { useEffect } from 'react';

const Gps = () => {
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation 지원 안됨');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log('📍 현재 위치 좌표');
        console.log('위도:', lat);
        console.log('경도:', lon);

        fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lon }),
        })
          .then(() => console.log('위치 전송 완료'))
          .catch((err) => console.error('전송 오류:', err));
      },
      (err) => {
        console.error('위치 오류:', err.message);
      },
      { enableHighAccuracy: true }
    );
  }, []);
    

  return null; // UI 표시 없음
};

export default Gps;
