// src/components/auth/getMe.js
import axios from "axios";

export async function getMe() {
    const res = await axios.get("http://localhost:8080/api/auth/me", {
        withCredentials: true,
    });
    return res.data; // 사용자 객체
}
