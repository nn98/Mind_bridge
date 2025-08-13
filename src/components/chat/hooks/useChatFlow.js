import { useEffect, useRef, useState } from "react";
import { questionOrder, fieldKeys, initialForm, buildSystemPrompt } from "../constants";
import { prefillFromUser } from "../utils/prefillFromUser";
import { requestCounselling } from "../services/openai";
import { saveCounselling } from "../services/counsellingApi";
import { toast } from "react-toastify";

export function useChatFlow({ customUser, onClose }) {
    const [step, setStep] = useState(0);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { sender: "ai", message: questionOrder[0] },
    ]);
    const [form, setForm] = useState(initialForm);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(false);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // customUser 프리필
    useEffect(() => {
        const { prefill, filledCount } = prefillFromUser(customUser);
        if (filledCount === 0) return;

        setForm((prev) => ({ ...prev, ...prefill }));
        setStep(filledCount);
        setChatHistory([{ sender: "ai", message: questionOrder[filledCount] }]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        customUser?.email,
        customUser?.fullName,
        customUser?.nickname,
        customUser?.gender,
        customUser?.age,
        customUser?.mentalState,
        customUser?.status,
    ]);

    // 자동 스크롤
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isTyping]);

    const handleSubmit = async () => {
        if (!chatInput.trim() || isTyping || isChatEnded) return;

        const currentKey = fieldKeys[step];
        const updatedValue = currentKey === "나이" ? parseInt(chatInput, 10) : chatInput;

        setChatHistory((prev) => [...prev, { sender: "user", message: chatInput }]);
        setForm((prev) => ({ ...prev, [currentKey]: updatedValue }));
        setChatInput("");
        inputRef.current?.focus();
        setIsTyping(true);

        if (step < fieldKeys.length - 1) {
            // 다음 질문
            setTimeout(() => {
                setChatHistory((prev) => [
                    ...prev,
                    { sender: "ai", message: questionOrder[step + 1] },
                ]);
                setStep((prev) => prev + 1);
                setIsTyping(false);
            }, 700);
        } else {
            // 마지막 → OpenAI 호출
            setChatHistory((prev) => [
                ...prev,
                { sender: "ai", message: "상담 내용을 분석 중입니다..." },
            ]);

            try {
                const finalForm = { ...form, [currentKey]: updatedValue };
                const systemPrompt = buildSystemPrompt(finalForm);
                const result = await requestCounselling(systemPrompt);

                const botMessages = [result.상담사_응답];
                if (result.세션_종료) botMessages.push("상담이 종료되었습니다. 감사합니다.");

                setChatHistory((prev) => [
                    ...prev.filter((m) => m.message !== "상담 내용을 분석 중입니다..."),
                    ...botMessages.map((m) => ({ sender: "ai", message: m })),
                ]);
            } catch (err) {
                console.error("OpenAI 오류:", err);
                setChatHistory((prev) => [
                    ...prev.filter((m) => m.message !== "상담 내용을 분석 중입니다..."),
                    { sender: "ai", message: "AI 응답 오류가 발생했습니다." },
                ]);
                toast.error("AI 응답 처리 중 문제가 발생했습니다.", { position: "top-center", closeButton: false, icon: false });
            } finally {
                setIsTyping(false);
            }
        }
    };

    const handleEndChat = async () => {
        if (isChatEnded) return;

        try {
            const token = localStorage.getItem("token");
            await saveCounselling({
                token,
                email: customUser?.email,
                상태: form.상태,
                상담받고싶은내용: form.상담받고싶은내용,
            });
            toast.success("상담 내용이 저장되었습니다.", { position: "top-center", closeButton: false, icon: false });
        } catch (err) {
            if (err.message === "NO_TOKEN") {
                toast.error("로그인이 필요합니다.", { position: "top-center", closeButton: false, icon: false });
            } else {
                console.error("❌ DB 저장 중 오류:", err);
                toast.error("저장 중 오류가 발생했습니다.", { position: "top-center", closeButton: false, icon: false });
            }
        }

        setChatHistory((prev) => [
            ...prev,
            { sender: "ai", message: "상담이 종료되었습니다. 이용해 주셔서 감사합니다." },
        ]);
        setIsChatEnded(true);

        setTimeout(() => {
            onClose?.();
        }, 1500);
    };

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
    };
}
