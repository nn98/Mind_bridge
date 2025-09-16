import axios from "axios";

const FASTAPI_URL = "http://localhost:8222";

// === 상담 세션 생성 ===
export async function startNewSession(email, name, age, counsel, gender, status, chatStyle) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/start`,
      { email, name, age, counsel, gender, status, chat_style: chatStyle },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,   // ✅ 쿠키 포함
      }
    );
    return response.data?.data || null;
  } catch (err) {
    console.error("세션 생성 실패:", err.response?.data || err);
    return null;
  }
}

export async function sendMessage(sessionId, userMessage, chatStyle) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/message`,
      { sessionId, userMessage, chat_style: chatStyle },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,   // ✅ 쿠키 포함
      }
    );

    const data = response.data;
    return {
      상담사_응답: data["상담사_응답"] || "응답 없음",
      감정: data["감정"] || "감정 분석 실패",
      세션_종료: data["세션_종료"] || false,
    };
  } catch (err) {
    console.error("메시지 전송 실패:", err.response?.data || err);
    return null;
  }
}

// === 세션 종료 ===
export async function completeSession(sessionId) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/${sessionId}/complete`,
      null,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,   // ✅ 쿠키 포함
      }
    );
    return response.data;
  } catch (err) {
    console.error("세션 종료 실패:", err.response?.data || err);
    return null;
  }
}
