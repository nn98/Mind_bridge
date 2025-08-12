import axios from "axios";

// .env의 REACT_APP_BACKEND_URL 사용, 없으면 기본 localhost
const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// 모든 요청에 토큰 자동 주입
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default apiClient;