import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// 상담 저장
export async function saveCounselling({ email, chatHistory }) {
    try {
        const response = await axios.post(
            `${BACKEND_URL}/api/chat/session/save`,
            {
                userEmail: email || "",
                userChatSummary: JSON.stringify(chatHistory),
            },
            {
                withCredentials: true, // 쿠키 포함
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status !== 200) throw new Error("DB 저장 실패");
        return true;
    } catch (e) {
        console.error("상담 저장 중 오류:", e);
        return false;
    }
}

// 새 상담 세션 생성
export async function startNewSession(email) {
    try {
        const params = new URLSearchParams({ email });
        const response = await axios.post(
            `${BACKEND_URL}/api/chat/session/start?${params.toString()}`,
            null, // 바디 없음
            {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            }
        );

        const data = response.data;

        if (response.status === 200 && data.success) {
            const sessionId = data.data;
            console.log("새 세션 생성 완료, 세션ID:", sessionId);
            return sessionId;
        } else {
            console.error("세션 생성 실패:", data.message);
            return null;
        }
    } catch (error) {
        console.error("세션 생성 중 오류:", error);
        return null;
    }
}


// 상담 세션 종료
export async function completeSession(sessionId, summary = "", emotion = "", aiSummary = "", score = null) {
    if (!sessionId) return;
    try {
        await axios.post(`${BACKEND_URL}/api/chat/session/${sessionId}/complete`, null, {
            params: { summary, emotion, aiSummary, score },
            withCredentials: true,
        });
    } catch (e) {
        console.warn("세션 완료 처리 실패:", e);
    }
}