// 백엔드 API 주소로 변경 (OpenAI API 대신 자체 백엔드 API)
const backendApiAddress = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:8080";

export async function requestCounselling(systemPrompt) {
    const res = await fetch(`${backendApiAddress}/api/chat/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Authorization 헤더 제거 (백엔드에서 OpenAI API 키 관리)
        },
        credentials: 'include', // 쿠키 포함 (인증이 필요한 경우)
        body: JSON.stringify({
            systemPrompt: systemPrompt // 백엔드 DTO에 맞춰 필드명 변경
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        const err = new Error("백엔드 API 응답 오류");
        err.payload = data;
        throw err;
    }

    // 백엔드에서 이미 파싱된 응답을 바로 반환
    // (백엔드에서 ChatMessageResponseDto 형태로 반환하므로 추가 파싱 불필요)
    return {
        감정: data.감정 || "분석 실패",
        상담사_응답: data.상담사_응답 || "응답 오류",
        요약: data.요약 || "요약 오류",
        세션_종료: data.세션_종료 || false,
    };
}
