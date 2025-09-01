// src/components/map/Map.jsx
import { useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import useKakaoMap from "./hooks/useKakaoMap";
import useGeolocation from "./hooks/useGeolocation";
import useHospitals from "./hooks/useHospitals";
import { fetchFootRoute } from "./services/directions";
import HospitalInfoPanel from "./HospitalInfoPanel";
import "react-toastify/dist/ReactToastify.css";

const apiKey = process.env.REACT_APP_MAP_KEY;
const REST_API_KEY = process.env.REACT_APP_REST_API_KEY;

export default function Map() {
    const routePolylineRef = useRef(null);
    const { mapRef, map, mapInstanceRef, ready } = useKakaoMap(apiKey);
    const userLoc = useGeolocation(ready);
    const [selectedHospital, setSelectedHospital] = useState(null);

    const { selected, setSelected, infoWindowRef } = useHospitals(mapInstanceRef, userLoc);

    // 병원 선택 상태를 패널과 동기화
    if (selectedHospital !== selected) {
        // 간단 동기화 (렌더 루프 방지 위해 조건부)
        // eslint-disable-next-line no-void
        void setSelectedHospital(selected);
    }

    const drawRoute = async (startLatLng, endLatLng) => {
        try {
            const { coords, durationMin } = await fetchFootRoute(REST_API_KEY, startLatLng, endLatLng);

            if (routePolylineRef.current) routePolylineRef.current.setMap(null);
            routePolylineRef.current = new window.kakao.maps.Polyline({
                path: coords,
                strokeWeight: 5,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeStyle: "solid",
            });
            routePolylineRef.current.setMap(mapInstanceRef.current);
            mapInstanceRef.current.setCenter(coords[0]);

            const timeBox = document.getElementById("timeBox");
            if (timeBox) timeBox.innerText = `소요 시간: 약 ${durationMin}분`;
        } catch (err) {
            toast.error("길찾기 실패: " + err.message);
            console.error(err);
        }
    };

    // 인포윈도우의 '길찾기' 버튼 바인딩: 선택이 바뀔 때 연결
    if (ready && map && selected?.position && userLoc) {
        setTimeout(() => {
            const btn = document.getElementById("routeBtn");
            if (btn) {
                btn.onclick = () => {
                    const start = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon);
                    drawRoute(start, selected.position);
                };
            }
        }, 0);
    }

    return (
        <>
            <div ref={mapRef} className="map-box" />
            <HospitalInfoPanel hospital={selectedHospital} />

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
}
