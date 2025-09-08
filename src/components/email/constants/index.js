// src/constants/index.js

// 백엔드 베이스 URL (빌드/로컬에서 모두 동작)
export const BACKEND_URL =
    (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

// EmailJS 환경변수 (비어있어도 앱이 죽지 않도록 기본값 유지)
export const EMAILJS = {
    SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID",
    TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID",
    PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
};

// 이미지 생성 API 설정
export const IMAGE_API = {
    KEY: process.env.REACT_APP_KEY,
    ADDRESS:
        (process.env.REACT_APP_PICTURE_ADDRESS || "https://api.openai.com/v1/images/generations")
            .trim(),
    MODEL: (process.env.REACT_APP_IMAGE_MODEL || "dall-e-3").trim(),
};

// 선택적으로 쓸 수 있는 안전 플래그(다른 파일에서 필요 시 사용)
export const FEATURE_FLAGS = {
    IMAGE_ENABLED: !!process.env.REACT_APP_KEY,
    EMAILJS_ENABLED:
        !!process.env.REACT_APP_EMAILJS_SERVICE_ID &&
        !!process.env.REACT_APP_EMAILJS_TEMPLATE_ID &&
        !!process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
};
