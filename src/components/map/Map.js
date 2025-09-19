// src/components/map/Map.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import Papa from "papaparse";
import {ToastContainer, toast} from "react-toastify";

import useKakaoMap from "./hooks/useKakaoMap";
import useGeolocation from "./hooks/useGeolocation";
import useHospitals from "./hooks/useHospitals";
import {fetchFootRoute} from "./services/directions";
import HospitalInfoPanel from "./HospitalInfoPanel";
import AnimatedHospitalList from "./AnimatedHospitalList"; // 새로운 애니메이션 컴포넌트
import {haversineDistance} from "./utils/geo";

import "react-toastify/dist/ReactToastify.css";
import "../../css/map.css";

const apiKey = process.env.REACT_APP_MAP_KEY;
const REST_API_KEY = process.env.REACT_APP_REST_API_KEY;

export default function Map() {
    const routePolylineRef = useRef(null);
    const markersRef = useRef([]);
    const {mapRef, mapInstanceRef, ready} = useKakaoMap(apiKey);
    const userLoc = useGeolocation(ready);

    const [hospitals, setHospitals] = useState([]);
    const [regionList, setRegionList] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState("전체");
    const [selectedHospital, setSelectedHospital] = useState(null);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // CSV 데이터 로드
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

                const regions = new Set(parsed.map((h) => (h.region || h.address || "").split(" ")[0]));
                setRegionList(["전체", ...Array.from(regions).filter(Boolean)]);
            },
            error: (error) => {
                console.error("CSV 로드 실패:", error);
                toast.error("병원 데이터를 불러오는데 실패했습니다.");
            }
        });
    }, []);

    // 지역 필터링
    const filtered = useMemo(() => {
        if (selectedRegion === "전체") return hospitals;
        return hospitals.filter((h) =>
            h.address && h.address.startsWith(selectedRegion)
        );
    }, [hospitals, selectedRegion]);

    // 거리순 정렬
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

    // 페이지네이션 계산
    const totalPages = Math.ceil(sortedHospitals.length / itemsPerPage);
    const paginatedHospitals = sortedHospitals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 마커 관리 훅
    const {setSelected, clearSelection, createInfoWindow} = useHospitals(mapInstanceRef, userLoc);

    // 마커 생성 및 업데이트
    useEffect(() => {
        if (!ready || !mapInstanceRef.current || !window.kakao) return;

        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        sortedHospitals.forEach((hospital) => {
            const position = new window.kakao.maps.LatLng(hospital.lat, hospital.lon);

            const marker = new window.kakao.maps.Marker({
                position,
                map: mapInstanceRef.current,
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
                const infoWindow = createInfoWindow(hospital, () => drawRoute(hospital));
                infoWindow.open(mapInstanceRef.current, marker);

                setSelected({
                    ...hospital,
                    position,
                    marker
                });
            });

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
        };
    }, [ready, sortedHospitals, mapInstanceRef, userLoc]);

    // 경로 그리기
    const drawRoute = async (hospital) => {
        if (!userLoc) {
            toast.warn("현재 위치를 찾을 수 없습니다.");
            return;
        }

        try {
            const startLatLng = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon);
            const endLatLng = new window.kakao.maps.LatLng(hospital.lat, hospital.lon);

            const {coords, durationMin} = await fetchFootRoute(
                REST_API_KEY,
                startLatLng,
                endLatLng
            );

            if (routePolylineRef.current) {
                routePolylineRef.current.setMap(null);
            }

            routePolylineRef.current = new window.kakao.maps.Polyline({
                path: coords,
                strokeWeight: 5,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeStyle: "solid",
            });

            routePolylineRef.current.setMap(mapInstanceRef.current);

            const bounds = new window.kakao.maps.LatLngBounds();
            coords.forEach(coord => bounds.extend(coord));
            mapInstanceRef.current.setBounds(bounds);

            toast.success(`길찾기 완료! 소요시간: 약 ${durationMin}분`);
        } catch (err) {
            toast.error("길찾기 실패: " + err.message);
            console.error(err);
        }
    };

    // 목록 초기화
    const handleBackToList = () => {
        setSelectedHospital(null);
        clearSelection();
        if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
            routePolylineRef.current = null;
        }
    };

    // 목록 클릭 → 상세 패널 열기
    const handleListClick = (hospital) => {
        setSelectedHospital({
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone,
            distance: hospital.distance,
            drivingTime: hospital.drivingTime,
            lat: hospital.lat,
            lon: hospital.lon,
        });

        if (ready && mapInstanceRef.current && window.kakao) {
            const pos = new window.kakao.maps.LatLng(hospital.lat, hospital.lon);
            mapInstanceRef.current.panTo(pos);
            mapInstanceRef.current.setLevel(4);
        }
    };

    const handleRegionChange = (region) => {
        setSelectedRegion(region);
        setCurrentPage(1); // ✅ 지역 변경 시 첫 페이지로
        handleBackToList();
    };

    return (
        <div className="map-container">
            {/* 헤더 섹션 */}
            <div className="map-header">
                <h2>🏥 병원 찾기</h2>
                <div className="region-select">
                    <label htmlFor="region">지역 선택: </label>
                    <select
                        id="region"
                        value={selectedRegion}
                        onChange={(e) => handleRegionChange(e.target.value)}
                    >
                        {regionList.map((region) => (
                            <option key={region} value={region}>
                                {region}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="map-content">
                <div className="map-section">
                    <div ref={mapRef} className="map-box"/>
                    {!ready && (
                        <div className="map-loading">
                            <div className="loading-spinner"></div>
                            <p>지도를 불러오는 중...</p>
                        </div>
                    )}
                </div>

                {/* 병원 목록/상세 */}
                <div className="hospital-section">
                    {selectedHospital ? (
                        <HospitalInfoPanel
                            hospital={selectedHospital}
                            onClose={handleBackToList}
                        />
                    ) : sortedHospitals.length > 0 ? (
                        <>
                            <div className="hospital-header">
                                <h3>병원 목록 ({sortedHospitals.length}개)</h3>
                                {userLoc && <span className="sort-info">거리순 정렬</span>}
                            </div>

                            {/* 애니메이션 병원 목록 컴포넌트 */}
                            <AnimatedHospitalList
                                hospitals={paginatedHospitals}
                                onHospitalSelect={handleListClick}
                                showGradients={true}
                                enableArrowNavigation={true}
                                currentPage={currentPage}
                                userLoc={userLoc}
                            />

                            {/* 페이지네이션 */}
                            <div className="hospital-pagination">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    ◀ 이전
                                </button>
                                <span>{currentPage} / {totalPages}</span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    다음 ▶
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🏥</div>
                            <p>해당 지역에 병원 정보가 없습니다.</p>
                            <p className="empty-sub">다른 지역을 선택해 보세요.</p>
                        </div>
                    )}
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={3000} limit={3}/>
        </div>
    );
}