// src/services/directions.js
export async function fetchFootRoute(REST_API_KEY, startLatLng, endLatLng) {
    const origin = `${startLatLng.getLng()},${startLatLng.getLat()}`;
    const destination = `${endLatLng.getLng()},${endLatLng.getLat()}`;
    const profile = "foot";

    const res = await fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&profile=${profile}`,
        { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
    );
    if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);
    const data = await res.json();

    const section = data.data?.routes?.[0]?.sections?.[0];
    if (!section?.roads) throw new Error("경로 데이터가 없습니다.");

    const coords = section.roads.flatMap((road) =>
        road.vertexes.reduce((arr, val, idx) => {
            if (idx % 2 === 0) arr.push(new window.kakao.maps.LatLng(road.vertexes[idx + 1], val));
            return arr;
        }, [])
    );

    const durationMin = Math.round(section.duration / 60);
    return { coords, durationMin };
}
