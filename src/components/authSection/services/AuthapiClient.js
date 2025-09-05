import axios from "axios";

// .env의 REACT_APP_BACKEND_URL 사용, 없으면 기본 localhost
const BASE_URL = (process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL).replace(/\/$/, "");

const AuthapiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});


export default AuthapiClient;