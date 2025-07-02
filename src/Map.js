import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

const apiKey = process.env.REACT_APP_API_MAP_KEY;  // ✅ 변수 이름 수정 확인

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
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const infoWindowRef = useRef(null);

  const DEFAULT_CENTER = { lat: 37.5665, lon: 126.9780 }; // 서울시청

  // 1. Kakao Maps SDK 동적 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setMapLoaded(true);  // ✅ 지도 로드 완료 후 실행
      });
    };
    document.head.appendChild(script);
  }, []);

  // 2. 사용자 위치 수집
  useEffect(() => {
    if (!mapLoaded) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          console.warn('위치 정보를 가져올 수 없어 기본 위치를 사용합니다.');
          setUserLocation(null);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.warn('Geolocation을 지원하지 않습니다.');
    }
  }, [mapLoaded]);

  // 3. 병원 CSV 로딩
  useEffect(() => {
    if (!mapLoaded || !userLocation) return;

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
    });
  }, [userLocation, mapLoaded]);

  // 4. 지도 생성 및 마커 표시
  useEffect(() => {
    if (!mapLoaded) return;

    const center = userLocation || DEFAULT_CENTER;
    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lon),
      level: 5,
    };

    const map = new window.kakao.maps.Map(container, options);
    mapInstance.current = map;

    if (userLocation) {
      new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lon),
        map,
        title: '내 위치',
        image: new window.kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new window.kakao.maps.Size(24, 35)
        ),
      });
    }

    // 병원 마커 표시
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
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        const infowindow = new window.kakao.maps.InfoWindow({ content });
        infowindow.open(map, marker);
        infoWindowRef.current = infowindow;
      });
    });
  }, [nearbyHospitals, mapLoaded]);

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
      {!nearbyHospitals.length && (
        <p>위치 정보를 불러오거나 주변 병원 데이터를 로딩 중입니다...</p>
      )}
    </div>
  );
};

export default Map;
