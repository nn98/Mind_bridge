import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';

const apiKey = process.env.REACT_APP_API_MAP_KEY;

const DEFAULT_CENTER = {
  lat: 37.5665,
  lon: 126.9780,
};

// 거리 계산 함수 (Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
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
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const markersRef = useRef([]);

  // 1. 카카오맵 SDK 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        });
        mapInstanceRef.current = map;
        setGpsReady(true);
      });
    };
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  // 2. GPS 수집
  useEffect(() => {
    if (!gpsReady) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc({ lat, lon });
      },
      (err) => {
        alert('GPS 사용 불가: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  }, [gpsReady]);

  // 3. 내 위치 마커 + 병원 표시
  useEffect(() => {
    if (!userLoc || !window.kakao?.maps || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const userLatLng = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon);
    map.setCenter(userLatLng);

    // 내 위치 마커
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new window.kakao.maps.Marker({
      position: userLatLng,
      map,
      title: '내 위치',
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new window.kakao.maps.Size(24, 35)
      ),
    });

    // 병원 CSV 로드
    Papa.parse('/Hospital_Range.csv', {
      download: true,
      header: true,
      complete: (res) => {
        const hospitals = res.data
          .map((item) => ({
            name: item['병원명'],
            address: item['주소'],
            lat: parseFloat(item['위도']),
            lon: parseFloat(item['경도']),
          }))
          .filter((h) => !isNaN(h.lat) && !isNaN(h.lon));

        const withDistance = hospitals.map((h) => ({
          ...h,
          distance: haversineDistance(userLoc.lat, userLoc.lon, h.lat, h.lon),
        }));

        withDistance.sort((a, b) => a.distance - b.distance);
        const topHospitals = withDistance.slice(0, 20);

        // 기존 마커 제거
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        topHospitals.forEach((h) => {
          const pos = new window.kakao.maps.LatLng(h.lat, h.lon);
          const marker = new window.kakao.maps.Marker({
            position: pos,
            map,
            title: h.name,
          });

          const content = `
            <div style="padding:8px; font-size:13px;">
              <strong>${h.name}</strong><br/>
              거리: ${h.distance.toFixed(2)} km<br/>
              주소: ${h.address}
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
      },
    });
  }, [userLoc]);

  return (
    <div>
      <h2>📍 내 주변 병원 지도</h2>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '10px',
          border: '1px solid #ccc',
          marginTop: '10px',
        }}
      />
    </div>
  );
};

export default Map;
