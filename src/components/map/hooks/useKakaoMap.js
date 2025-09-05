// src/hooks/useKakaoMap.js
import {useEffect, useRef, useState} from "react";

const DEFAULT_CENTER = {lat: 37.5665, lon: 126.9780};

export default function useKakaoMap(apiKey) {
    const mapRef = useRef(null);            // div ref를 외부에 노출
    const mapInstanceRef = useRef(null);    // kakao.maps.Map
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                const center = new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon);
                const map = new window.kakao.maps.Map(mapRef.current, {center, level: 4});
                mapInstanceRef.current = map;
                setReady(true);
            });
        };
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, [apiKey]);

    return {mapRef, map: mapInstanceRef.current, mapInstanceRef, ready};
}
