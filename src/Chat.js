import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';

const apiKey = process.env.REACT_APP_API_MAP_KEY;
const DEFAULT_CENTER = { lat: 37.5665, lon: 126.9780 }; // 서울시청 기본 좌표

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Map = () => {
  const mapRef = useRef(null);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // 1. 카카오맵 스크립트 동적 로드
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setKakaoLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services`;
    script.async = true;
    script.onload = () => setKakaoLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 2. GPS 위치 요청 (컴포넌트가 마운트 될 때 한 번)
  useEffect(() => {
    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      setUserLocation(DEFAULT_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        alert('위치 정보를 가져올 수 없습니다. 기본 위치를 표시합니다.');
        setUserLocation(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // 3. userLocation이 설정되면 CSV 불러와서 병원 거리 계산
  useEffect(() => {
    if (!userLocation) return;

    Papa.parse('/Hospital_Range.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const hospitals = results.data
          .map((item) => ({
            name: item['병원명'],
            address: item['주소'],
            lat: parseFloat(item['위도']),
            lon: parseFloat(item['경도']),
          }))
          .filter((h) => !isNaN(h.lat) && !isNaN(h.lon));

        const withDistance = hospitals.map((h) => ({
          ...h,
          distance: haversineDistance(userLocation.lat, userLocation.lon, h.lat, h.lon),
        }));

        withDistance.sort((a, b) => a.distance - b.distance);
        setNearbyHospitals(withDistance.slice(0, 20));
      },
      error: (err) => {
        console.error('CSV 파싱 오류:', err);
      },
    });
  }, [userLocation]);

  // 4. 카카오맵 렌더링 및 마커 표시
  useEffect(() => {
    if (!kakaoLoaded) return;
    if (!mapRef.current) return;

    const center = userLocation || DEFAULT_CENTER;

    if (!mapInstanceRef.current) {
      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lon),
        level: 5,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
    } else {
      mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lon));
    }

    const map = mapInstanceRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 기존 인포윈도우 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // 사용자 위치 마커
    if (userLocation) {
      const userMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lon),
        map,
        title: '내 위치',
        image: new window.kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new window.kakao.maps.Size(24, 35)
        ),
      });
      markersRef.current.push(userMarker);
    }

    // 병원 마커 생성 및 InfoWindow 연결
    nearbyHospitals.forEach((hospital) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(hospital.lat, hospital.lon),
        map,
        title: hospital.name,
      });

      const content = `
        <div style="padding:8px; font-size:14px;">
          <strong>${hospital.name}</strong><br/>
          거리: ${hospital.distance.toFixed(2)} km<br/>
          주소: ${hospital.address}
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();

        const infowindow = new window.kakao.maps.InfoWindow({ content });
        infowindow.open(map, marker);
        infoWindowRef.current = infowindow;
      });

      markersRef.current.push(marker);
    });
  }, [kakaoLoaded, userLocation, nearbyHospitals]);

  return (
    <div>
      <h2>내 주변 병원 지도</h2>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #ccc',
        }}
      />
      {!nearbyHospitals.length && <p>위치 정보를 불러오거나 병원 데이터를 로딩 중입니다...</p>}
    </div>
  );
};

export default Map;
