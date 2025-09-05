// src/components/map/Map.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import Papa from "papaparse";
import {ToastContainer, toast} from "react-toastify";

import useKakaoMap from "./hooks/useKakaoMap";
import useGeolocation from "./hooks/useGeolocation";
import useHospitals from "./hooks/useHospitals";
import {fetchFootRoute} from "./services/directions";
import HospitalInfoPanel from "./HospitalInfoPanel";
import {haversineDistance} from "./utils/geo";

import "react-toastify/dist/ReactToastify.css";

const apiKey = process.env.REACT_APP_MAP_KEY;
const REST_API_KEY = process.env.REACT_APP_REST_API_KEY;

export default function Map() {
    const routePolylineRef = useRef(null);
    const {mapRef, map, mapInstanceRef, ready} = useKakaoMap(apiKey);
    const userLoc = useGeolocation(ready);

    // 목록/필터/정렬 (HospitalRegionPage 로직 이식)
    const [hospitals, setHospitals] = useState([]);
    const [regionList, setRegionList] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState("전체");

    useEffect(() => {
        Papa.parse("/HospitalInfoWithPhone.csv", {
            download: true,
            header: true,
            complete: (res) => {
                const parsed = res.data
                    .map((row) => ({
                        name: row["병원명"],
                        address: row["주소"],
                        region: row["지역"],
                        phone: row["전화번호"],
                        lat: parseFloat(row["위도"]),
                        lon: parseFloat(row["경도"]),
                    }))
                    .filter(
                        (item) =>
                            item.name && item.address && !isNaN(item.lat) && !isNaN(item.lon)
                    );

                setHospitals(parsed);

                const regions = new Set(parsed.map((h) => (h.region || "").split(" ")[0]));
                setRegionList(["전체", ...Array.from(regions)]);
            },
        });
    }, []);

    const filtered = useMemo(() => {
        if (selectedRegion === "전체") return hospitals;
        return hospitals.filter((h) => h.address.startsWith(selectedRegion));
    }, [hospitals, selectedRegion]);

    const sortedHospitals = useMemo(() => {
        return filtered
            .map((h) => {
                if (!userLoc) return h;
                const distance = haversineDistance(userLoc.lat, userLoc.lon, h.lat, h.lon);
                const drivingTime = Math.round((distance / 40) * 60);
                return {
                    ...h,
                    distance: distance.toFixed(2),
                    drivingTime,
                };
            })
            .sort((a, b) => {
                if (a.distance && b.distance) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                }
                return 0;
            });
    }, [filtered, userLoc]);

    // 마커/선택 훅 (clearSelection 추가 사용)
    const {selected, setSelected, clearSelection} = useHospitals(mapInstanceRef, userLoc);

    // 마커 클릭 선택 → 패널 동기화
    const [selectedHospital, setSelectedHospital] = useState(null);
    if (selectedHospital !== selected) {
        // 렌더 루프 방지용 조건부 동기화
        // eslint-disable-next-line no-void
        void setSelectedHospital(selected);
    }

    // “목록으로” 버튼/동작
    const handleBackToList = () => {
        setSelectedHospital(null); // 패널 닫기 → 목록 보임
        clearSelection();          // 인포윈도우/선택 상태 클리어
    };

    // 경로 그리기
    const drawRoute = async (startLatLng, endLatLng) => {
        try {
            const {coords, durationMin} = await fetchFootRoute(
                REST_API_KEY,
                startLatLng,
                endLatLng
            );

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

    // 인포윈도우 '길찾기' 버튼 바인딩
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

    // 목록 클릭 → 지도 이동 + 패널 열기
    const handleListClick = (h) => {
        setSelectedHospital({
            name: h.name,
            address: h.address,
            phone: h.phone,
            distance: h.distance,
        });

        if (ready && mapInstanceRef.current && window.kakao) {
            const pos = new window.kakao.maps.LatLng(h.lat, h.lon);
            mapInstanceRef.current.panTo(pos);
        }
    };

    return (
        <>
            {/* 지도 */}
            <div ref={mapRef} className="map-box"/>

            {/* 지역 선택 */}
            <div className="region-select" style={{margin: "12px 0"}}>
                <label htmlFor="region">지역 선택: </label>
                <select
                    id="region"
                    value={selectedRegion}
                    onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        handleBackToList(); // 지역 바꾸면 항상 목록 모드로
                    }}
                >
                    {regionList.map((region) => (
                        <option key={region} value={region}>
                            {region}
                        </option>
                    ))}
                </select>
            </div>

            {/* 상세 패널(선택 시) / 목록(선택 전) */}
            {selectedHospital ? (
                <HospitalInfoPanel hospital={selectedHospital} onClose={handleBackToList}/>
            ) : sortedHospitals.length > 0 ? (
                <div className="hospital-list">
                    {sortedHospitals.map((h, idx) => (
                        <button
                            key={`${h.name}-${idx}`}
                            className="hospital-card"
                            onClick={() => handleListClick(h)}
                            style={{
                                textAlign: "left",
                                border: "1px solid #ccc",
                                padding: "1rem",
                                marginBottom: "1rem",
                                borderRadius: "8px",
                                backgroundColor: "#f9f9f9",
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            <h3 style={{margin: 0}}>{h.name}</h3>
                            <p style={{margin: "6px 0"}}><strong>주소:</strong> {h.address}</p>
                            <p style={{margin: "6px 0"}}><strong>전화번호:</strong> {h.phone}</p>
                            {userLoc && (
                                <>
                                    <p style={{margin: "6px 0"}}>
                                        <strong>거리:</strong> {h.distance} km
                                    </p>
                                    <p style={{margin: "6px 0"}}>
                                        <strong>차량 예상 시간:</strong> 약 {h.drivingTime}분
                                    </p>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <p>해당 지역에 병원 정보가 없습니다.</p>
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
}
