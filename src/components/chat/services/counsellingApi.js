import axios from "axios";

// 클라우드 서버 주소 (기본 8222번 포트)
const FASTAPI_URL = process.env.REACT_APP_FAST_URL;
// local테스트 용도

// === 상담 세션 생성 ===
export async function startNewSession(email, name) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/start`,
      { email, name }, // ✅ body 전달
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data?.data || null;
  } catch (err) {
    console.error("세션 생성 실패:", err);
    return null;
  }
}

// === 메시지 전송 ===
export async function sendMessage(sessionId, userMessage) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/message`,
      { sessionId, userMessage },
      { headers: { "Content-Type": "application/json" } }
    );

    const data = response.data;
    return {
      상담사_응답: data["상담사_응답"] || "응답 없음",
      감정: data["감정"] || "감정 분석 실패",
      세션_종료: data["세션_종료"] || false,
    };
  } catch (err) {
    console.error("메시지 전송 실패:", err);
    return null;
  }
}

// === 세션 종료 ===
export async function completeSession(sessionId) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/${sessionId}/complete`,
      null,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (err) {
    console.error("세션 종료 실패:", err);
    return null;
  }
}
