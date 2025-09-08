import axios from "axios";

const FASTAPI_URL = process.env.REACT_APP_FASTAPI_API_URL || "http://localhost:8222";

// === 상담 세션 생성 ===
export async function startNewSession(email) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/start?email=${email}`,
      null,
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
  console.log("🚀 sendMessage body:", { sessionId, userMessage }); // ✅ 디버깅용
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/message`,
      { sessionId, userMessage },   // ✅ 수정 (text → userMessage)
      { headers: { "Content-Type": "application/json" } }
    );

    const data = response.data;

    // ✅ FastAPI는 그대로 한국어 키 반환
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

    // ✅ 세션 종료 후 분석 결과 콘솔에 찍기
    console.log("세션 종료 분석 결과:", response.data);

    return response.data;
  } catch (err) {
    console.error("세션 종료 실패:", err);
    return null;
  }
}
