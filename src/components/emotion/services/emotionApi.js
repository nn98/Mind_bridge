// src/services/emotionApi.js
import axios from "axios";

const REST_API = process.env.REACT_APP_BACKEND_URL;

export async function requestEmotionAnalysis(email, text, options = {}) {
  try {
    const response = await axios.post(
      `${REST_API}/api/emotion/analyze`,
      { email, text },
      {
        ...options,
        withCredentials: true, 
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("감정 분석 요청 실패:", err.response?.data || err.message);
    return null;
  }
}
