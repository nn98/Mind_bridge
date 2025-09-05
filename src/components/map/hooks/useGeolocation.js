// src/hooks/useGeolocation.js
import {useEffect, useState} from "react";

export default function useGeolocation(enabled) {
    const [userLoc, setUserLoc] = useState(undefined); // undefined: 로딩, null: 실패, {lat,lon}: 성공

    useEffect(() => {
        if (!enabled) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLoc({lat: pos.coords.latitude, lon: pos.coords.longitude}),
            () => setUserLoc(null),
            {enableHighAccuracy: true}
        );
    }, [enabled]);

    return userLoc;
}
