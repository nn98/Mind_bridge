import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Papa from 'papaparse';

const apiKey = process.env.REACT_APP_MAP_KEY;
const REST_API_KEY = process.env.REACT_APP_REST_API_KEY;

const DEFAULT_CENTER = {
  lat: 37.5665,
  lon: 126.9780,
};

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
  const routePolylineRef = useRef(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [userLoc, setUserLoc] = useState(undefined);
  const markersRef = useRef([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

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

  useEffect(() => {
    if (!gpsReady) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc({ lat, lon });
      },
      () => setUserLoc(null),
      { enableHighAccuracy: true }
    );
  }, [gpsReady]);

  useEffect(() => {
    if (typeof userLoc === 'undefined' || !window.kakao?.maps || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (userLoc) {
      const userLatLng = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon);
      map.setCenter(userLatLng);
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
    }

    Papa.parse('/HospitalInfoWithPhone.csv', {
      download: true,
      header: true,
      complete: (res) => {
        const hospitals = res.data
          .map((item) => ({
            name: item['병원명'],
            address: item['주소'],
            lat: parseFloat(item['위도']),
            lon: parseFloat(item['경도']),
            phone: item['전화번호'],
          }))
          .filter((h) => !isNaN(h.lat) && !isNaN(h.lon));

        let hospitalsToShow = [];
        if (userLoc) {
          const withDistance = hospitals.map((h) => ({
            ...h,
            distance: haversineDistance(userLoc.lat, userLoc.lon, h.lat, h.lon),
          }));
          withDistance.sort((a, b) => a.distance - b.distance);
          hospitalsToShow = withDistance.slice(0, 20);
        } else {
          hospitalsToShow = hospitals;
        }

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        hospitalsToShow.forEach((h) => {
          const pos = new window.kakao.maps.LatLng(h.lat, h.lon);
          const marker = new window.kakao.maps.Marker({
            position: pos,
            map,
            title: h.name,
          });

          const infoContent = `
  <div style="
    width: 240px;
    min-height: 140px;
    padding: 8px;
    font-size: 12px;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    box-sizing: border-box;
  ">
    <div style="font-weight: bold; font-size: 13px;">
      ${h.name}
    </div>
    ${userLoc ? `<div>거리: ${h.distance.toFixed(2)} km</div>` : ''}
    <div style="margin-top: 4px;">주소: ${h.address}</div>
    <div style="margin-top: 2px; word-break: break-all;">전화번호: ${h.phone}</div>
    ${userLoc ? '<div id="timeBox" style="margin-top:6px; color:green;"></div>' : ''}
    ${userLoc ? '<button id="routeBtn" style="margin-top:6px; padding:4px 8px; font-size:12px;">길찾기</button>' : ''}
  </div>
`;

          marker.addListener('click', () => {
            if (infoWindowRef.current) infoWindowRef.current.close();
            const infowindow = new window.kakao.maps.InfoWindow({
              content: infoContent,
              maxWidth: 260,
            });
            infowindow.open(map, marker);
            infoWindowRef.current = infowindow;

            if (userLoc) {
              setTimeout(() => {
                const btn = document.getElementById('routeBtn');
                if (btn) {
                  btn.onclick = () => {
                    drawRoute(
                      new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon),
                      pos
                    );
                  };
                }
              }, 100);
            }
            setSelectedHospital({
              name: h.name,
              address: h.address,
              phone: h.phone,
              distance: h.distance?.toFixed(2),
            });
          });

          markersRef.current.push(marker);
        });
      },
    });
  }, [userLoc]);

  const drawRoute = (startLatLng, endLatLng) => {
    const origin = `${startLatLng.getLng()},${startLatLng.getLat()}`;
    const destination = `${endLatLng.getLng()},${endLatLng.getLat()}`;
    const profile = 'foot';

    fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&profile=${profile}`,
      {
        headers: {
          Authorization: `KakaoAK ${REST_API_KEY}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const section = data.routes?.[0]?.sections?.[0];
        if (!section?.roads) throw new Error('경로 데이터가 없습니다.');

        const coords = section.roads.flatMap((road) =>
          road.vertexes.reduce((arr, val, idx) => {
            if (idx % 2 === 0) {
              arr.push(new window.kakao.maps.LatLng(road.vertexes[idx + 1], val));
            }
            return arr;
          }, [])
        );

        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }

        routePolylineRef.current = new window.kakao.maps.Polyline({
          path: coords,
          strokeWeight: 5,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeStyle: 'solid',
        });
        routePolylineRef.current.setMap(mapInstanceRef.current);
        mapInstanceRef.current.setCenter(coords[0]);

        const durationMin = Math.round(section.duration / 60);
        const timeBox = document.getElementById('timeBox');
        if (timeBox) timeBox.innerText = `소요 시간: 약 ${durationMin}분`;
      })
      .catch((err) => {
        toast.error('길찾기 실패: ' + err.message);
        console.error(err);
      });
  };

  return (
    <>
      <div
        ref={mapRef}
        style={{
          width: '40vw',
          height: 'calc(50vh - 60px)',
          borderRadius: '10px',
          border: '1px solid #ccc',
          margin: '10px',
          marginBottom: '20px',
        }}
      />

      {selectedHospital && (
        <div
          style={{
            margin: '0 10px 15px',
            padding: '16px',
            background: '#f7f7f7',
            borderRadius: '10px',
            border: '1px solid #ccc',
            maxWidth: '40vw',
            fontSize: '18px',
            lineHeight: '1.6',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            {selectedHospital.name}
          </h3>
          <p><strong>주소:</strong> {selectedHospital.address}</p>
          <p><strong>전화번호:</strong> {selectedHospital.phone}</p>
          {selectedHospital.distance && (
            <p><strong>거리:</strong> {selectedHospital.distance} km</p>
          )}
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        limit={2}
      />
    </>
  );
};

export default Map;
