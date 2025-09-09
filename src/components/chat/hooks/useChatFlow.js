// src/components/chat/hooks/useChatFlow.js
import {useState, useRef, useCallback} from "react";
import {toast} from "react-toastify";
import {
    startNewSession,
    sendMessage,
    completeSession,
} from "../services/counsellingApi";

// 게스트 질문 순서
const guestQuestions = [
    "이름을 입력해주세요.",
    "성별을 입력해주세요.",
    "나이를 입력해주세요.",
    "현재 상태를 간단히 적어주세요.",
    "상담받고 싶은 내용을 말씀해주세요.",
    "이전에 상담 경험이 있었나요?",
];

export function useChatFlow({customUser}) {
    const [sessionId, setSessionId] = useState(null);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState(() =>
        customUser?.email
            ? [
                {
                    sender: "ai",
                    message: `안녕하세요 ${
                        customUser.fullName || customUser.name || "고객"
                    }님, 상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                },
            ]
            : [
                {
                    sender: "ai",
                    message: "안녕하세요 게스트님, 상담을 위해 몇 가지 정보를 입력해주세요.",
                },
                {sender: "ai", message: guestQuestions[0]},
            ]
    );
    const [isTyping, setIsTyping] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(false);

    // 게스트 입력 진행 상태
    const [step, setStep] = useState(customUser?.email ? guestQuestions.length : 0);
    const [guestForm, setGuestForm] = useState({});

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // === 새 상담 시작 ===
    const handleRestartChat = useCallback(() => {
        setSessionId(null);
        setChatInput("");
        setIsChatEnded(false);
        setIsTyping(false);
        setGuestForm({});
        setStep(customUser?.email ? guestQuestions.length : 0);

        if (customUser?.email) {
            setChatHistory([
                {
                    sender: "ai",
                    message: `안녕하세요 ${
                        customUser.fullName || customUser.name || "고객"
                    }님, 상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?`,
                },
            ]);
        } else {
            setChatHistory([
                {
                    sender: "ai",
                    message: "안녕하세요 게스트님, 상담을 위해 몇 가지 정보를 입력해주세요.",
                },
                {sender: "ai", message: guestQuestions[0]},
            ]);
        }
    }, [customUser]);

    // === 메시지 전송 ===
    const handleSubmit = useCallback(
        async () => {
            if (!chatInput.trim() || isTyping || isChatEnded) return;

            const input = chatInput.trim();
            setChatHistory((prev) => [...prev, {sender: "user", message: input}]);
            setChatInput("");

            // 게스트 정보 입력 단계
            if (!customUser?.email && step < guestQuestions.length) {
                const keys = ["이름", "성별", "나이", "상태", "상담내용", "이전상담경험"];
                setGuestForm((prev) => ({...prev, [keys[step]]: input}));

                const nextStep = step + 1;
                setStep(nextStep);

                if (nextStep < guestQuestions.length) {
                    setChatHistory((prev) => [
                        ...prev,
                        {sender: "ai", message: guestQuestions[nextStep]},
                    ]);
                    return;
                }

                // 모든 정보 입력 완료 → 상담 시작 안내
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

                    if (result["감정"]) {
                        console.log("🧾 감정 분석:", result["감정"]);
                    }

                    if (result["세션_종료"]) {
                        setIsChatEnded(true);
                    }
                }
            } catch (err) {
                console.error("상담 오류:", err);
                toast.error("상담 중 오류 발생");
            } finally {
                setIsTyping(false);
            }
        },
        [chatInput, sessionId, isTyping, isChatEnded, step, guestForm, customUser]
    );

    // === 세션 종료 ===
    const handleEndChat = useCallback(
        async () => {
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
        },
        [sessionId]
    );

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
        handleRestartChat, // ✅ 새 상담 시작 가능
    };
}
