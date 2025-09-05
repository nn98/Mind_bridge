import axios from "axios";

// 백엔드 API 주소로 변경 (OpenAI API 대신 자체 백엔드 API)
const backendApiAddress = process.env.REACT_APP_BACKEND_API_URL;

export async function requestCounselling(systemPrompt, sessionId, userMessage) {

    if (!sessionId) {
        throw new Error("세션 ID가 존재하지 않습니다. 세션 생성 후 다시 시도해주세요.");
    }

    // 디버깅용 세션 ID 출력
    console.log("requestCounselling 호출 직전 세션ID:", sessionId);

    try {
        const response = await axios.post(
            `${backendApiAddress}/api/chat/message`,
            {
                systemPrompt,
                sessionId,
                userMessage,
            },
            {
                withCredentials: true, // 쿠키 포함
                headers: { "Content-Type": "application/json" },
            }
        );

        const data = response.data;

        return {
            감정: data.data?.감정 || "분석 실패",
            상담사_응답: data.data?.상담사_응답 || "응답 오류",
            요약: data.data?.요약 || "요약 오류",
            세션_종료: data.data?.세션_종료 || false,
        };
    } catch (error) {
        console.error("requestCounselling 오류:", error);
        throw new Error(error.response?.data?.message || "백엔드 API 요청 실패");
    }
}
