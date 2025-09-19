import axios from "axios";

const FASTAPI_URL = process.env.REACT_APP_FAST_URL;

// === 상담 세션 생성 ===
export async function startNewSession(email, name, age, counsel, gender, status, chatStyleOptions) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/session/start`,
      { email, name, age, counsel, gender, status, chat_style: chatStyleOptions },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,   // 쿠키 포함
      }
    );
    return response.data?.data || null;
  } catch (err) {
    console.error("세션 생성 실패:", err.response?.data || err);
    return null;
  }
}

// === 메시지 전송 ===
export async function sendMessage(sessionId, userMessage, chatStyleOptions) {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/chat/message`,
      { sessionId, userMessage, chat_style: chatStyleOptions },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,   // 쿠키 포함
      }
    );

    const data = response.data;
    const result = {
      상담사_응답: data["상담사_응답"] || "응답 없음",
      감정: data["감정"] || "감정 분석 실패",
      세션_종료: data["세션_종료"] || false,
    };

    
    if (result.세션_종료) {
      console.log("세션 종료 감지 → completeSession 실행");
      await completeSession(sessionId);
    }

    return result;
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
        withCredentials: true,   // 쿠키 포함
      }
    );
    return response.data;
  } catch (err) {
    console.error("세션 종료 실패:", err.response?.data || err);
    return null;
  }
}
