const BACKEND_URL = "http://localhost:8080";

export async function saveCounselling({ email, 상태, 상담받고싶은내용 }) {
    const response = await fetch(`${BACKEND_URL}/api/chat/session/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Authorization 헤더 제거
        },
        credentials: 'include', // 쿠키 자동 전송
        body: JSON.stringify({
            email: email || "",
            userCounsellingSummation: 상태 || "",
            userCounsellingEmotion: 상담받고싶은내용 || "",
            counselorSummation: "",
        }),
    });

    if (!response.ok) throw new Error("DB 저장 실패");
    return true;
}
