const BACKEND_URL = "http://localhost:8080";

export async function saveCounselling({ token, email, 상태, 상담받고싶은내용 }) {
    if (!token) throw new Error("NO_TOKEN");

    const response = await fetch(`${BACKEND_URL}/api/counselling/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
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
