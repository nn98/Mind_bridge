import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

// 거리 계산 함수 (haversine 공식)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // 지구 반지름 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const HospitalRegionPage = () => {
    const [hospitals, setHospitals] = useState([]);
    const [regionList, setRegionList] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('전체');
    const [userLoc, setUserLoc] = useState(null);

    // 병원 데이터 파싱
    useEffect(() => {
        Papa.parse('/HospitalInfoWithPhone.csv', {
            download: true,
            header: true,
            complete: (res) => {
                const parsed = res.data
                    .map((row) => ({
                        name: row['병원명'],
                        address: row['주소'],
                        region: row['지역'],
                        phone: row['전화번호'],
                        lat: parseFloat(row['위도']),
                        lon: parseFloat(row['경도']),
                    }))
                    .filter((item) => item.name && item.address && !isNaN(item.lat) && !isNaN(item.lon));

                setHospitals(parsed);

                const regions = new Set(parsed.map((h) => h.region.split(' ')[0]));
                setRegionList(['전체', ...Array.from(regions)]);
            },
        });
    }, []);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setUserLoc({ lat, lon });
            },
            () => {
                console.warn('사용자 위치 정보를 가져올 수 없습니다.');
                setUserLoc(null);
            }
        );
    }, []);

    const filtered = selectedRegion === '전체'
        ? hospitals
        : hospitals.filter((h) => h.address.startsWith(selectedRegion));

    const sortedHospitals = filtered
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

    return (
        <div className="region-page" style={{ padding: '1rem' }}>
            <h2>지역별 병원 조회</h2>

            <div className="region-select" style={{ marginBottom: '1rem' }}>
                <label htmlFor="region">지역 선택: </label>
                <select
                    id="region"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    {regionList.map((region) => (
                        <option key={region} value={region}>
                            {region}
                        </option>
                    ))}
                </select>
            </div>

            <div className="hospital-list">
                {sortedHospitals.length > 0 ? (
                    sortedHospitals.map((h, idx) => (
                        <div
                            key={idx}
                            className="hospital-card"
                            style={{
                                border: '1px solid #ccc',
                                padding: '1rem',
                                marginBottom: '1rem',
                                borderRadius: '8px',
                                backgroundColor: '#f9f9f9',
                            }}
                        >
                            <h3>{h.name}</h3>
                            <p><strong>주소:</strong> {h.address}</p>
                            <p><strong>전화번호:</strong> {h.phone}</p>
                            {userLoc && (
                                <>
                                    <p><strong>거리:</strong> {h.distance} km</p>
                                    <p><strong>차량 예상 시간:</strong> 약 {h.drivingTime}분</p>
                                    <p><h5>예상 시간은 평균 시속 40km 기준입니다.</h5></p>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p>해당 지역에 병원 정보가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default HospitalRegionPage;