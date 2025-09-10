// src/components/chat/hooks/useChatFlow.js
import {useState, useRef, useCallback} from "react";
import {toast} from "react-toastify";
import {startNewSession, sendMessage, completeSession} from "../services/counsellingApi";

/** 게스트 질문 순서 (기존 유지) */
const guestQuestions = [
    "이름을 입력해주세요.",
    "성별을 입력해주세요.",
    "나이를 입력해주세요.",
    "현재 상태를 간단히 적어주세요.",
    "상담받고 싶은 내용을 말씀해주세요.",
    "이전에 상담 경험이 있었나요?",
];

/** 감정 파스텔 팔레트 (표준 키) */
export const EMOTION_PALETTE = {
    happiness: "#ffd6a5",
    sadness: "#cfe1ff",
    anger: "#ffc9c9",
    anxiety: "#e3d1ff",
    calmness: "#c9f2e8",
    neutral: "#eaeaea",
};

/** 한국어/영문 동의어 → 표준 키 */
const KOR_TO_STD = {
    // 긍정/안정
    "행복": "happiness", "기쁨": "happiness",
    "평온": "calmness", "안정": "calmness", "안도": "calmness",
    "중립": "neutral", "기타": "neutral",
    // 부정
    "슬픔": "sadness", "우울": "sadness", "무기력": "sadness", "피곤": "sadness",
    "분노": "anger", "화남": "anger", "화남/분노": "anger",
    "불안": "anxiety", "초조": "anxiety", "당황": "anxiety",
};

/** 문자열 리스트 "라벨: XX%" 등 포함 → 퍼센트 맵으로 */
function normalizeEmotionMix(raw) {
    const KEYS = ["happiness", "sadness", "anger", "anxiety", "calmness", "neutral"];
    if (raw == null) return null;

    let map = {};

    if (typeof raw === "object" && !Array.isArray(raw)) {
        for (const [k, v] of Object.entries(raw)) {
            const key = (KOR_TO_STD[k] || k || "").toString().toLowerCase();
            const num = Number(v);
            if (KEYS.includes(key) && Number.isFinite(num)) {
                map[key] = (map[key] || 0) + num;
            }
        }
    }

    if (Array.isArray(raw)) {
        for (const item of raw) {
            const label = item?.label ?? item?.emotion ?? item?.name;
            const key = (KOR_TO_STD[label] || label || "").toString().toLowerCase();
            const val = item?.value ?? item?.score ?? item?.percent;
            const num = Number(val);
            if (KEYS.includes(key) && Number.isFinite(num)) {
                map[key] = (map[key] || 0) + num;
            }
        }
    }

    if (typeof raw === "string") {
        const s = raw.trim();
        const parts = s.split(/[,\u3001/]+/);
        let found = false;

        for (const seg of parts) {
            const m = seg.match(/\s*([^:\s]+)\s*[:\s]\s*([0-9]+(?:\.[0-9]+)?)\s*%?\s*$/);
            if (m) {
                const label = m[1];
                const val = Number(m[2]);
                const key = (KOR_TO_STD[label] || label || "").toString().toLowerCase();
                if (KEYS.includes(key) && Number.isFinite(val)) {
                    map[key] = (map[key] || 0) + val;
                    found = true;
                }
            }
        }
        if (!found) {
            const key = (KOR_TO_STD[s] || s).toString().toLowerCase();
            if (KEYS.includes(key)) map[key] = 1;
        }
    }

    if (Object.keys(map).length === 0) return null;

    let sum = Object.values(map).reduce((a, b) => a + (Number(b) || 0), 0);
    if (sum <= 0) return null;

    const scaled = {};
    for (const k of Object.keys(map)) scaled[k] = (map[k] / sum) * 100;
    for (const k of KEYS) if (!(k in scaled)) scaled[k] = 0;

    return scaled;
}

/** 로그 포맷 (간단형) */
function debugLogEmotion(label, raw, mix) {
    console.log(`[Emotion] ${label} raw:`, raw);
    console.log(`[Emotion] ${label} normalized:`, mix ?? null);
}

/**
 * ✅ 안전 확장: 초기값 옵션만 추가 (기존 로직은 동일)
 *   - initialHistory, initialInput, initialStep, initialGuestForm, initialIsChatEnded
 *   - 모두 선택적이며, 미지정 시 기존 동작 100% 유지
 */
export function useChatFlow({
                                customUser,
                                initialHistory = [],
                                initialInput = "",
                                initialStep = null,
                                initialGuestForm = null,
                                initialIsChatEnded = null,
                            }) {
    const [sessionId, setSessionId] = useState(null);

    // 히스토리: 주어지면 그대로 사용, 아니면 기존 초기 메시지 로직
    const [chatHistory, setChatHistory] = useState(() =>
        (initialHistory && initialHistory.length > 0)
            ? initialHistory
            : (customUser?.email
                ? [
                    {
                        sender: "ai",
                        message: `안녕하세요 ${customUser.fullName || customUser.name || "고객"}님, 상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                    },
                ]
                : [
                    {sender: "ai", message: "안녕하세요 게스트님, 상담을 위해 몇 가지 정보를 입력해주세요."},
                    {sender: "ai", message: guestQuestions[0]},
                ])
    );

    const [chatInput, setChatInput] = useState(initialInput || "");
    const [isTyping, setIsTyping] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(
        typeof initialIsChatEnded === "boolean" ? initialIsChatEnded : false
    );

    const [step, setStep] = useState(() => {
        if (customUser?.email) return guestQuestions.length; // 로그인 사용자는 게스트 단계 생략
        if (typeof initialStep === "number") return initialStep;
        return 0;
    });
    const [guestForm, setGuestForm] = useState(() => initialGuestForm || {});

    // 🔥 실시간 감정 믹스(합=100) — 배경 그라데이션 트리거
    const [emotionMix, setEmotionMix] = useState(null);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // === 새 상담 시작 ===
    const handleRestartChat = useCallback(() => {
        setSessionId(null);
        setChatInput("");
        setIsChatEnded(false);
        setIsTyping(false);
        setGuestForm({});
        setEmotionMix(null); // 배경 초기화
        setStep(customUser?.email ? guestQuestions.length : 0);

        if (customUser?.email) {
            setChatHistory([
                {
                    sender: "ai",
                    message: `안녕하세요 ${customUser.fullName || customUser.name || "고객"}님, 상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                },
            ]);
        } else {
            setChatHistory([
                {sender: "ai", message: "안녕하세요 게스트님, 상담을 위해 몇 가지 정보를 입력해주세요."},
                {sender: "ai", message: guestQuestions[0]},
            ]);
        }
    }, [customUser]);

    // === 메시지 전송 ===
    const handleSubmit = useCallback(async () => {
        if (!chatInput.trim() || isTyping || isChatEnded) return;

        const input = chatInput.trim();
        setChatHistory((prev) => [...prev, {sender: "user", message: input}]);
        setChatInput("");

        // 게스트 정보 수집 단계
        if (!customUser?.email && step < guestQuestions.length) {
            const keys = ["이름", "성별", "나이", "상태", "상담내용", "이전상담경험"];
            setGuestForm((prev) => ({...prev, [keys[step]]: input}));

            const nextStep = step + 1;
            setStep(nextStep);

            if (nextStep < guestQuestions.length) {
                setChatHistory((prev) => [...prev, {sender: "ai", message: guestQuestions[nextStep]}]);
                return;
            }

            setChatHistory((prev) => [
                ...prev,
                {
                    sender: "ai",
                    message: `감사합니다, ${guestForm["이름"] || input}님. 이제 상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                },
            ]);
            return;
        }

        // === 상담 단계 ===
        try {
            setIsTyping(true);

            let currentSessionId = sessionId;
            if (!currentSessionId) {
                const email = customUser?.email || "guest@example.com";
                const name = customUser?.fullName || customUser?.name || guestForm["이름"] || "게스트";
                currentSessionId = await startNewSession(email, name);
                if (!currentSessionId) {
                    toast.error("세션 생성 실패");
                    return;
                }
                setSessionId(currentSessionId);
            }

            const result = await sendMessage(currentSessionId, input);

            if (result) {
                setChatHistory((prev) => [
                    ...prev,
                    {sender: "ai", message: result["상담사_응답"] || "응답 오류"},
                ]);

                // 감정 믹스 반영 + 간단 로그
                if (result["감정"] !== undefined) {
                    const mix = normalizeEmotionMix(result["감정"]);
                    debugLogEmotion("received", result["감정"], mix);
                    setEmotionMix(mix || null);
                }

                if (result["세션_종료"]) setIsChatEnded(true);
            }
        } catch (err) {
            console.error("상담 오류:", err);
            toast.error("상담 중 오류 발생");
        } finally {
            setIsTyping(false);
        }
    }, [chatInput, sessionId, isTyping, isChatEnded, step, guestForm, customUser]);

    // === 세션 종료 ===
    const handleEndChat = useCallback(async () => {
        if (!sessionId) {
            setIsChatEnded(true);
            setChatHistory((prev) => [
                ...prev,
                {sender: "ai", message: "상담을 종료했어요. 필요할 때 언제든 다시 찾아주세요 💜"},
            ]);
            return;
        }

        try {
            const result = await completeSession(sessionId);
            console.log("📌 세션 종료 분석 결과:", result);
            setIsChatEnded(true);
            setChatHistory((prev) => [
                ...prev,
                {sender: "ai", message: "상담을 종료했어요. 필요할 때 언제든 다시 찾아주세요 💜"},
            ]);
        } catch (err) {
            console.error("세션 종료 실패:", err);
        }
    }, [sessionId]);

    return {
        chatInput,
        setChatInput,
        chatHistory,
        isTyping,
        isChatEnded,
        chatEndRef,
        inputRef,
        handleSubmit,
        handleEndChat,
        handleRestartChat,

        // 🔥 배경 그라데이션용 상태/팔레트
        emotionMix,
        EMOTION_PALETTE,

        // ✅ 복원용 내부 상태(컴포넌트에서 저장하기 위함)
        //  - 기존 외부 API에는 영향 없음
        __internal: {
            step, setStep,
            guestForm, setGuestForm,
            setChatHistory,
            setIsChatEnded,
        },
    };
}

export default useChatFlow;
