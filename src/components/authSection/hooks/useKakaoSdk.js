import { useEffect } from "react";
import { KAKAO_REST_API_KEY } from "../services/env";

export function useKakaoSdk() {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://developers.kakao.com/sdk/js/kakao.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init(KAKAO_REST_API_KEY);
                // console.log("Kakao SDK initialized:", window.Kakao.isInitialized());
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);
}
