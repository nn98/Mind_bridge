import axios from "axios";

// FastAPI 주소
const backendApiAddress =
  process.env.REACT_APP_BACKEND_API_URL;

// 상담 요청 (systemPrompt 제거)
export async function requestCounselling(sessionId, userMessage) {
  if (!sessionId) {
    throw new Error("세션 ID가 존재하지 않습니다. 세션 생성 후 다시 시도해주세요.");
  }

  console.log("requestCounselling 호출 직전 세션ID:", sessionId);

  try {
    const response = await axios.post(
      `${backendApiAddress}/api/chat/message`,
      {
        sessionId,
        text: userMessage, // FastAPI는 text 필드만 받음
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data;

    // FastAPI 응답 구조: { result: "JSON string" }
    let parsed = {};
    try {
      parsed = JSON.parse(data.result);
    } catch {
      console.warn("AI 응답 JSON 파싱 실패, 원본:", data.result);
    }

    return {
      감정: parsed["감정"] || "분석 실패",
      상담사_응답: parsed["상담사_응답"] || "응답 오류",
      요약: parsed["요약"] || "요약 없음",
      세션_종료: parsed["세션_종료"] || false,
    };
  } catch (error) {
    console.error("requestCounselling 오류:", error);
    throw new Error(error.response?.data?.message || "백엔드 API 요청 실패");
  }
}
