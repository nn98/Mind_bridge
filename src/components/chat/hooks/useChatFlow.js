// src/components/chat/hooks/useChatFlow.js
import {useState, useRef, useCallback, useEffect} from "react";
import {toast} from "react-toastify";
import {startNewSession, sendMessage, completeSession} from "../services/counsellingApi";

/** 게스트 질문 순서 */
const guestQuestions = [
    "이름을 입력해주세요.",
    "성별을 입력해주세요.",
    "나이를 입력해주세요.",
    "현재 상태를 간단히 적어주세요.",
    "채팅받고 싶은 내용을 말씀해주세요.",
    "이전에 채팅 경험이 있었나요?",
];

/** 감정 팔레트 (파스텔 톤) */
export const EMOTION_PALETTE = {
    happiness: "#ffd6a5",  // 파스텔 오렌지
    sadness: "#cfe1ff",    // 파스텔 블루
    anger: "#ffc9c9",      // 파스텔 레드
    anxiety: "#e3d1ff",    // 파스텔 퍼플
    calmness: "#c9f2e8",   // 파스텔 민트
    neutral: "#eaeaea",    // 파스텔 그레이
};

/** 한국어/영문 동의어 → 표준 키 */
const KOR_TO_STD = {
    "행복": "happiness", "기쁨": "happiness",
    "평온": "calmness", "안정": "calmness", "안도": "calmness",
    "중립": "neutral", "기타": "neutral",
    "슬픔": "sadness", "우울": "sadness", "무기력": "sadness", "피곤": "sadness",
    "분노": "anger", "화남": "anger", "화남/분노": "anger",
    "불안": "anxiety", "초조": "anxiety", "당황": "anxiety",
};

/** 문자열 리스트 → 퍼센트 맵 */
function normalizeEmotionMix(raw) {
    const KEYS = ["happiness", "sadness", "anger", "anxiety", "calmness", "neutral"];
    if (raw == null) return null;
    let map = {};

    // object {감정: 수치}
    if (typeof raw === "object" && !Array.isArray(raw)) {
        for (const [k, v] of Object.entries(raw)) {
            const key = (KOR_TO_STD[k] || k || "").toString().toLowerCase();
            const num = Number(v);
            if (KEYS.includes(key) && Number.isFinite(num)) {
                map[key] = (map[key] || 0) + num;
            }
        }
    }

    // array [{label, value}, ...]
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

    // string "행복:40, 슬픔:60"
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

/** 메인 훅 */
export function useChatFlow({
                                customUser,
                                chatStyle,
                                initialHistory = [],
                                initialInput = "",
                                initialStep = null,
                                initialGuestForm = null,
                                initialIsChatEnded = null,
                            }) {
    const isLoggedIn = !!customUser?.email;

    const [chatHistory, setChatHistory] = useState(() =>
        (initialHistory && initialHistory.length > 0)
            ? initialHistory
            : (isLoggedIn
                ? [{
                    sender: "ai",
                    message: `안녕하세요 ${customUser?.fullName || customUser?.name || "고객"}님, 채팅을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                    isNew: true,
                }]
                : [
                    {sender: "ai", message: "안녕하세요 게스트님, 채팅을 위해 몇 가지 정보를 입력해주세요.", isNew: true},
                    {sender: "ai", message: guestQuestions[0], isNew: true},
                ])
    );

    const [chatInput, setChatInput] = useState(initialInput || "");
    const [isTyping, setIsTyping] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(
        typeof initialIsChatEnded === "boolean" ? initialIsChatEnded : false
    );
    const [step, setStep] = useState(() => {
        if (isLoggedIn) return guestQuestions.length;
        if (typeof initialStep === "number") return initialStep;
        return 0;
    });
    const [guestForm, setGuestForm] = useState(() => initialGuestForm || {});
    const [emotionMix, setEmotionMix] = useState(null);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);

    /** 로그인 이후 게스트 질문 보정 */
    useEffect(() => {
        if (isLoggedIn && chatHistory.length > 0 && chatHistory[0]?.message?.includes("게스트님")) {
            setChatHistory([{
                sender: "ai",
                message: `안녕하세요 ${customUser?.fullName || customUser?.name || "고객"}님, 채팅을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                isNew: true,
            }]);
            setStep(guestQuestions.length);
        }
    }, [isLoggedIn, customUser, chatHistory]);

    // === 새 채팅 시작 ===
    const handleRestartChat = useCallback(() => {
        setChatHistory(
            isLoggedIn
                ? [{
                    sender: "ai",
                    message: `안녕하세요 ${customUser?.fullName || customUser?.name || "고객"}님, 채팅을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                    isNew: true,
                }]
                : [
                    {sender: "ai", message: "안녕하세요 게스트님, 채팅을 위해 몇 가지 정보를 입력해주세요.", isNew: true},
                    {sender: "ai", message: guestQuestions[0], isNew: true},
                ]
        );
        setSessionId(null);
        setChatInput("");
        setIsChatEnded(false);
        setIsTyping(false);
        setGuestForm({});
        setEmotionMix(null);
        setStep(isLoggedIn ? guestQuestions.length : 0);
    }, [customUser, isLoggedIn]);

    // === 메시지 전송 ===
    const handleSubmit = useCallback(async () => {
        if (!chatInput.trim() || isTyping || isChatEnded) return;
        const input = chatInput.trim();

        // ✅ chatStyle prop → guestForm → customUser 순으로 우선 적용
        const effectiveChatStyle =
            chatStyle || guestForm["chatStyle"] || customUser?.chatStyle || "심플한";

        setChatHistory((prev) => [...prev, {sender: "user", message: input}]);
        setChatInput("");

        // 게스트 정보 수집 단계
        if (!isLoggedIn && step < guestQuestions.length) {
            const keys = ["이름", "성별", "나이", "상태", "채팅내용", "이전채팅경험"];
            setGuestForm((prev) => ({...prev, [keys[step]]: input}));
            const nextStep = step + 1;
            setStep(nextStep);
            if (nextStep < guestQuestions.length) {
                setChatHistory((prev) => [
                    ...prev,
                    {sender: "ai", message: guestQuestions[nextStep], isNew: true}
                ]);
                return;
            }
            setChatHistory((prev) => [
                ...prev,
                {
                    sender: "ai",
                    message: `감사합니다, ${guestForm["이름"] || input}님. 이제 채팅을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                    isNew: true,
                }
            ]);
            return;
        }

        try {
            setIsTyping(true);
            let currentSessionId = sessionId;

            // 🔹 세션 생성 (처음 메시지 보낼 때)
            if (!currentSessionId) {
                const email = customUser?.email || "guest@example.com";
                const name =
                    customUser?.fullName ||
                    customUser?.name ||
                    guestForm["이름"] ||
                    "게스트";

                currentSessionId = await startNewSession(
                    email,
                    name,
                    guestForm["나이"] || "0",
                    guestForm["채팅내용"] || "",
                    guestForm["성별"] || "미상",
                    guestForm["상태"] || "",
                    effectiveChatStyle
                );

                if (!currentSessionId) {
                    toast.error("세션 생성 실패");
                    return;
                }
                setSessionId(currentSessionId);
            }

            // ✅ 메시지 전송할 때도 동일한 chatStyle 전달
            const result = await sendMessage(currentSessionId, input, effectiveChatStyle);

            if (result) {
                setChatHistory(prev => {
                    // ✅ 이전 AI 메시지들의 커서 제거
                    const updated = prev.map(m =>
                        m.sender === "ai" ? {...m, isNew: false} : m
                    );

                    // ✅ 새 메시지만 커서 보이도록 isNew: true
                    return [
                        ...updated,
                        {
                            id: Date.now(),
                            sender: "ai",
                            message: result["채팅사_응답"] || "응답 오류",
                            isNew: true
                        }
                    ];
                });

                if (result["감정"] !== undefined) {
                    const mix = normalizeEmotionMix(result["감정"]);
                    setEmotionMix(mix || null);
                }
                if (result["세션_종료"]) setIsChatEnded(true);
            }
        } catch (err) {
            console.error("채팅 오류:", err);
            toast.error("채팅 중 오류 발생");
        } finally {
            setIsTyping(false);
        }
    }, [chatInput, sessionId, isTyping, isChatEnded, step, guestForm, customUser, isLoggedIn, chatStyle]);

    // === 세션 종료 ===
    const handleEndChat = useCallback(async () => {
        if (!sessionId) {
            setIsChatEnded(true);
            setChatHistory((prev) => [
                ...prev,
                {sender: "ai", message: "채팅을 종료했어요. 필요할 때 언제든 다시 찾아주세요 💜", isNew: true}
            ]);
            return;
        }
        try {
            const result = await completeSession(sessionId);
            console.log("📌 세션 종료 분석 결과:", result);
            setIsChatEnded(true);
            setChatHistory((prev) => [
                ...prev,
                {sender: "ai", message: "채팅을 종료했어요. 필요할 때 언제든 다시 찾아주세요 💜", isNew: true}
            ]);
        } catch (err) {
            console.error("세션 종료 실패:", err);
        }
    }, [sessionId]);

    return {
        chatInput, setChatInput,
        chatHistory,
        isTyping, isChatEnded,
        chatEndRef, inputRef,
        handleSubmit, handleEndChat, handleRestartChat,
        emotionMix, EMOTION_PALETTE,
        __internal: {step, setStep, guestForm, setGuestForm, setChatHistory, setIsChatEnded},
    };
}

// ✅ named export + default export 둘 다 제공
export default useChatFlow;
