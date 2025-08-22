import { useEffect, useRef, useState, useCallback } from "react";
import { questionOrder, fieldKeys, initialForm, buildSystemPrompt } from "../constants";
import { prefillFromUser } from "../utils/prefillFromUser";
import { requestCounselling } from "../services/openai";
import { saveCounselling } from "../services/counsellingApi";
import { toast } from "react-toastify";

export function useChatFlow({
    customUser,
    disableQuestionnaire = false,
    fieldsToAsk = [],
    introMessage,
    enforceGreeting = false,
    autoStartFromProfile = true,
    askProfileIfMissing = true,
} = {}) {
    const questionnaireMode = !disableQuestionnaire;
    const quickMode = !!disableQuestionnaire;

    const QUESTION_BY_KEY = {
        이름: "이름을 입력해주세요.",
        성별: "성별을 입력해주세요.",
        나이: "나이를 입력해주세요.",
        상태: "현재 상태를 간단히 적어주세요.",
        상담받고싶은내용: "상담받고 싶은 내용을 말씀해주세요.",
        이전상담경험: "이전에 상담 경험이 있었나요?",
    };
    const getQuestion = (key) => QUESTION_BY_KEY[key] || "내용을 입력해주세요.";

    const [step, setStep] = useState(quickMode ? 0 : questionnaireMode ? 0 : fieldKeys.length);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState(
        quickMode
            ? [{ sender: "ai", message: introMessage || "상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?" }]
            : questionnaireMode
                ? [{ sender: "ai", message: questionOrder[0] }]
                : []
    );
    const [form, setForm] = useState(initialForm);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(false);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // 모드 전환 감지: 로그인/로그아웃 등으로 disableQuestionnaire 변경 시 리셋
    const prevModeRef = useRef({ quickMode, questionnaireMode });
    useEffect(() => {
        const prev = prevModeRef.current;
        if (prev.quickMode !== quickMode || prev.questionnaireMode !== questionnaireMode) {
            // 모드가 바뀌면 상태 초기화
            setForm(initialForm);
            setIsChatEnded(false);
            setIsTyping(false);

            if (quickMode) {
                // 바로 상담 모드: 인트로만
                setStep(0);
                setChatHistory([
                    { sender: "ai", message: introMessage || "상담을 시작해볼까요? 어떤 것이 가장 고민되시나요?" },
                ]);
            } else if (questionnaireMode) {
                // 질문지 모드: 첫 질문부터
                setStep(0);
                setChatHistory([{ sender: "ai", message: questionOrder[0] }]);
            } else {
                setStep(fieldKeys.length);
                setChatHistory([]);
            }
            prevModeRef.current = { quickMode, questionnaireMode };
        }
    }, [quickMode, questionnaireMode, introMessage]);

    //자동 프리필 (질문지 모드에서만)
    useEffect(() => {
        if (!questionnaireMode) return;

        const { prefill, filledCount } = prefillFromUser(customUser);
        if (filledCount > 0) {
            setForm((prev) => ({ ...prev, ...prefill }));

            const firstUnansweredIndex = fieldKeys.findIndex((key) => !prefill[key]);
            const goTo = askProfileIfMissing
                ? firstUnansweredIndex >= 0
                    ? firstUnansweredIndex
                    : fieldKeys.length
                : fieldKeys.length;

            setStep(goTo);

            setChatHistory((prev) => {
                const intro =
                    goTo < fieldKeys.length
                        ? { sender: "ai", message: `로그인 정보를 확인했어요. ${questionOrder[goTo]}` }
                        : { sender: "ai", message: "기본 정보가 확인되어 상담을 바로 시작할 수 있어요." };
                if (prev.length === 1 && prev[0]?.sender === "ai") return [intro];
                return [...prev, intro];
            });

            // 자동 시작(필수 값이 충분하면)
            if (autoStartFromProfile && goTo >= fieldKeys.length) {
                const readyKeys = ["이름", "나이", "상태", "상담받고싶은내용"];
                const enough = readyKeys.every((k) => (prefill[k] ?? "").toString().trim().length > 0);
                if (enough) {
                    (async () => {
                        try {
                            setIsTyping(true);
                            const systemPrompt = buildSystemPrompt({ ...initialForm, ...prefill });
                            const result = await requestCounselling(systemPrompt);
                            const displayName =
                                customUser?.fullName || customUser?.nickname || customUser?.name || "고객";
                            const aiMsgRaw = result?.상담사_응답 || "상담 응답을 불러오지 못했습니다.";
                            const aiMsg = enforceGreeting ? ensureGreeting(aiMsgRaw, displayName) : aiMsgRaw;
                            setChatHistory((h) => [...h, { sender: "ai", message: aiMsg }]);
                            setIsChatEnded(!!result?.세션_종료);
                        } catch (e) {
                            console.error(e);
                            toast.error("자동 상담 시작 중 오류가 발생했습니다.");
                        } finally {
                            setIsTyping(false);
                        }
                    })();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customUser, questionnaireMode, autoStartFromProfile, askProfileIfMissing, enforceGreeting]);

    //스크롤 고정
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [chatHistory, isTyping]);

    //제출 처리
    const handleSubmit = useCallback(async () => {
        if (isTyping || isChatEnded) return;

        const input = chatInput.trim();
        if (!input) {
            inputRef.current?.focus();
            return;
        }

        // 화면에 사용자 메시지 먼저 반영
        setChatHistory((prev) => [...prev, { sender: "user", message: input }]);
        setChatInput("");

        //QUICK MODE: 최소 질문 수집(있는 경우에만)
        if (quickMode && fieldsToAsk.length > 0 && step < fieldsToAsk.length) {
            const key = fieldsToAsk[step];
            setForm((prev) => ({ ...prev, [key]: input }));

            const nextStep = step + 1;
            setStep(nextStep);

            if (nextStep < fieldsToAsk.length) {
                const nextKey = fieldsToAsk[nextStep];
                setChatHistory((prev) => [...prev, { sender: "ai", message: getQuestion(nextKey) }]);
                return; // 아직 수집 진행 중
            }
            // 최소 질문 수집 완료 → 상담 호출 진행
        }

        //질문지 모드: 전체 수집
        if (questionnaireMode && step < fieldKeys.length && askProfileIfMissing) {
            const currentKey = fieldKeys[step];
            setForm((prev) => ({ ...prev, [currentKey]: input }));

            const nextStep = step + 1;
            setStep(nextStep);

            if (nextStep < fieldKeys.length) {
                const nextQuestion = questionOrder[nextStep];
                setChatHistory((prev) => [...prev, { sender: "ai", message: nextQuestion }]);
                return;
            }
            // 전체 수집 완료 → 상담 호출 진행
        }

        //본격 상담 호출 (quick/질문지 공통)
        try {
            setIsTyping(true);

            // 로그인 정보 보강
            const nameFromLogin = customUser?.fullName || customUser?.nickname || customUser?.name || "";
            const finalForm = {
                ...form,
                이름: form["이름"] || nameFromLogin,
                성별: form["성별"] || customUser?.gender || form["성별"] || "",
                나이: form["나이"] || customUser?.age || form["나이"] || "",
                상태: form["상태"] || (quickMode ? input : form["상태"]) || "",
                상담받고싶은내용:
                    form["상담받고싶은내용"] || (quickMode ? input : form["상담받고싶은내용"]) || "",
            };

            const systemPrompt = buildSystemPrompt(finalForm);
            const result = await requestCounselling(systemPrompt);

            // 저장(실패해도 UX 영향 없도록)
            try {
                await saveCounselling({
                    token: localStorage.getItem("token"),
                    email: customUser?.email,
                    상태: finalForm["상태"],
                    상담받고싶은내용: finalForm["상담받고싶은내용"],
                });
            } catch (e) {
                console.warn("상담 저장 실패:", e);
            }

            const displayName = nameFromLogin || "고객";
            const aiMsgRaw = result?.상담사_응답 || "상담 응답을 불러오지 못했습니다.";
            const aiMsg = enforceGreeting ? ensureGreeting(aiMsgRaw, displayName) : aiMsgRaw;

            setChatHistory((prev) => [...prev, { sender: "ai", message: aiMsg }]);
            setIsChatEnded(!!result?.세션_종료);
        } catch (error) {
            console.error(error);
            toast.error("상담 중 오류가 발생했습니다.");
        } finally {
            setIsTyping(false);
        }
    }, [
        chatInput,
        isChatEnded,
        isTyping,
        step,
        quickMode,
        fieldsToAsk,
        questionnaireMode,
        askProfileIfMissing,
        form,
        customUser,
        enforceGreeting,
    ]);

    const handleEndChat = useCallback(() => {
        setIsChatEnded(true);
        setChatHistory((prev) => [
            ...prev,
            { sender: "ai", message: "상담을 종료했어요. 필요할 때 언제든 다시 찾아주세요 💜" },
        ]);
    }, []);

    const handleRestartChat = useCallback(() => {
        setIsChatEnded(false);
        setIsTyping(false);
        setForm(initialForm);

        if (quickMode) {
            setStep(0);
            setChatHistory([
                { sender: "ai", message: introMessage || "상담을 다시 시작해볼까요? 어떤 것이 가장 고민되시나요?" },
            ]);
        } else if (questionnaireMode) {
            setStep(0);
            setChatHistory([{ sender: "ai", message: questionOrder[0] }]);
        } else {
            setStep(fieldKeys.length);
            setChatHistory([]);
        }

        setChatInput("");
        inputRef.current?.focus();
    }, [quickMode, questionnaireMode, introMessage]);

    return {
        step,
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
    };
}

//유틸: 인사 강제(중복 방지)
function ensureGreeting(text, name) {
    const t = (text || "").trim();
    const hasHello = /^(안녕|안녕하세요|반갑|어서)/u.test(t);
    if (hasHello) return t;
    const safeName = (name || "").trim();
    const head = safeName ? `안녕하세요, ${safeName}님. ` : `안녕하세요. `;
    return head + t;
}
