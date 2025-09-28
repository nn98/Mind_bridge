// src/hooks/useHospitals.js
import {useEffect, useRef, useState} from "react";
import Papa from "papaparse";
import {haversineDistance} from "../utils/geo";

export default function useHospitals(mapInstanceRef, userLoc) {
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const [selected, setSelected] = useState(null);

    // ✅ 선택 해제(목록으로 복귀) 헬퍼
    const clearSelection = () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindowRef.current = null;
        setSelected(null);
    };

    useEffect(() => {
        if (typeof userLoc === "undefined" || !window.kakao?.maps || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // 사용자 마커
        let userMarker;
        if (userLoc) {
            const ll = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lon);
            map.setCenter(ll);
            userMarker = new window.kakao.maps.Marker({
                position: ll,
                map,
                title: "내 위치",
                image: new window.kakao.maps.MarkerImage(
                    "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                    new window.kakao.maps.Size(24, 35)
                ),
            });
        }

        // 병원 로딩 + 마커 생성
        Papa.parse("/HospitalInfoWithPhone.csv", {
            download: true,
            header: true,
            complete: (res) => {
                const hospitals = res.data
                    .map((item) => ({
                        name: item["병원명"],
                        address: item["주소"],
                        lat: parseFloat(item["위도"]),
                        lon: parseFloat(item["경도"]),
                        phone: item["전화번호"],
                    }))
                    .filter((h) => !isNaN(h.lat) && !isNaN(h.lon));

                // ✅ 위치 상태별로 병원 수 제한
                let hospitalsToShow = hospitals;

                if (userLoc !== undefined) {
                    if (userLoc) {
                        // 위치 성공 → 거리 가까운 순 20개
                        const withDist = hospitals.map((h) => ({
                            ...h,
                            distance: haversineDistance(userLoc.lat, userLoc.lon, h.lat, h.lon),
                        }));
                        withDist.sort((a, b) => a.distance - b.distance);
                        hospitalsToShow = withDist.slice(0, 20);
                    } else {
                        // 위치 실패 → 그냥 20개
                        hospitalsToShow = hospitals.slice(0, 20);
                    }
                }

                // 기존 마커 제거
                markersRef.current.forEach((m) => m.setMap(null));
                markersRef.current = [];

                hospitalsToShow.forEach((h) => {
                    const pos = new window.kakao.maps.LatLng(h.lat, h.lon);
                    const marker = new window.kakao.maps.Marker({position: pos, map, title: h.name});

                    marker.addListener("click", () => {
                        // 기존 인포윈도우 닫기
                        if (infoWindowRef.current) infoWindowRef.current.close();

                        const infoContent = `
                            <div style="position:relative;width:240px;min-height:140px;padding:8px;font-size:12px;line-height:1.6;word-break:break-word;">
                                <div id="info-close" title="닫기" style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:14px;">✖️</div>
                                <div style="font-weight:bold;font-size:13px;">${h.name}</div>
                                ${h.distance ? `<div>거리: ${h.distance.toFixed(2)} km</div>` : ""}
                                <div style="margin-top:4px;">주소: ${h.address}</div>
                                <div style="margin-top:2px;word-break:break-all;">전화번호: ${h.phone}</div>
                                ${userLoc ? '<div id="timeBox" style="margin-top:6px;color:green;"></div>' : ""}
                                ${userLoc ? '<button id="routeBtn" style="margin-top:6px;padding:4px 8px;font-size:12px;">길찾기</button>' : ""}
                            </div>
                        `;
                        const iw = new window.kakao.maps.InfoWindow({content: infoContent, maxWidth: 260});
                        iw.open(map, marker);
                        infoWindowRef.current = iw;

                        // 닫기 버튼 + 길찾기 버튼 연결
                        setTimeout(() => {
                            // 닫기 버튼
                            const close = document.getElementById("info-close");
                            if (close) close.onclick = () => {
                                iw.close();
                                setSelected(null);
                            };

                            // 길찾기 버튼
                            const routeBtn = document.getElementById("routeBtn");
                            if (routeBtn) {
                                routeBtn.onclick = () => {
                                    setSelected({
                                        name: h.name,
                                        address: h.address,
                                        phone: h.phone,
                                        distance: h.distance?.toFixed(2),
                                        position: pos,
                                        lat: h.lat,
                                        lon: h.lon,
                                    });
                                };
                            }
                        }, 0);
                    });

                    markersRef.current.push(marker);
                });

                // ✅ 디버깅용 로그
                console.log("총 병원 수:", hospitals.length, "표시된 병원 수:", hospitalsToShow.length);
            },
        });

        return () => {
            if (userMarker) userMarker.setMap(null);
            markersRef.current.forEach((m) => m.setMap(null));
            if (infoWindowRef.current) infoWindowRef.current.close();
        };
    }, [userLoc, mapInstanceRef]);

    return {selected, setSelected, markersRef, infoWindowRef, clearSelection};
}
