import React, { useEffect, useRef } from 'react';

const KakaoMapView = () => {
  const mapRef = useRef(null);
  

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=키값 위치&autoload=false';
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);
        const markerPosition = new window.kakao.maps.LatLng(37.5665, 126.978);
        const marker = new window.kakao.maps.Marker({ position: markerPosition });
        marker.setMap(map);
      });
    };

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (옵션)
      document.head.removeChild(script);
      
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📍 카카오 지도 테스트</h2>
      <div ref={mapRef} style={{ width: '50vh', height: '50vh' }} />
    </div>
  );
};

export default KakaoMapView;
