// src/components/dashboard/ChatConsult.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import {useChatFlow} from "../chat/hooks/useChatFlow";
import {useAuth} from "../../AuthContext";

/* =========================
   Color/Math Utilities
========================= */
function hexToRgba(hex, alpha = 0.55) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function gammaSmooth(mix, gamma = 0.8) {
    const keys = Object.keys(mix ?? {});
    const powVals = keys.map((k) => Math.pow((mix[k] ?? 0) / 100, gamma));
    const sumPow = powVals.reduce((a, b) => a + b, 0) || 1;
    const out = {};
    keys.forEach((k, i) => (out[k] = (powVals[i] / sumPow) * 100));
    return out;
}

function clampAndRedistribute(mix, {min = 6, max = 65}) {
    const keys = Object.keys(mix ?? {});
    const src = {...mix};
    const nonZero = keys.filter((k) => (src[k] ?? 0) > 0);

    nonZero.forEach((k) => {
        if (src[k] < min) src[k] = min;
        if (src[k] > max) src[k] = max;
    });

    let total = keys.reduce((a, k) => a + (src[k] ?? 0), 0);
    for (let i = 0; i < 2; i++) {
        if (total > 100) {
            let extra = total - 100;
            const donors = nonZero.filter((k) => src[k] > min);
            const donorSum = donors.reduce((a, k) => a + (src[k] - min), 0) || 1;
            donors.forEach((k) => {
                const room = src[k] - min;
                const give = Math.min(room, (room / donorSum) * extra);
                src[k] -= give;
            });
        } else if (total < 100) {
            let deficit = 100 - total;
            const receivers = nonZero.filter((k) => src[k] < max);
            const roomSum = receivers.reduce((a, k) => a + (max - src[k]), 0) || 1;
            receivers.forEach((k) => {
                const room = max - src[k];
                const take = Math.min(room, (room / roomSum) * deficit);
                src[k] += take;
            });
        }
        total = keys.reduce((a, k) => a + (src[k] ?? 0), 0);
    }

    const err = 100 - total;
    if (Math.abs(err) > 0.01) {
        const k = nonZero[0] || keys[0];
        if (k) src[k] += err;
    }
    return src;
}

function alphaForPct(pct) {
    if (pct >= 60) return 0.38;
    if (pct >= 30) return 0.48;
    return 0.6;
}

function buildCompositeBackground(mix, palette) {
    if (!mix) return null;
    const order = ["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"];
    const smooth = gammaSmooth(mix, 0.8);
    const adjusted = clampAndRedistribute(smooth, {min: 6, max: 65});

    let acc = 0;
    const conicStops = [];
    for (const key of order) {
        const pct = Math.max(0, Math.min(100, adjusted[key] || 0));
        if (!pct) continue;
        const alpha = alphaForPct(pct);
        const col = hexToRgba(palette[key] || "#ffffff", alpha);
        const from = acc;
        const to = acc + pct;
        conicStops.push(`${col} ${from.toFixed(2)}% ${to.toFixed(2)}%`);
        acc = to;
    }

    const radialA = `radial-gradient(60% 60% at 20% 10%, rgba(255,255,255,.06), rgba(255,255,255,0) 60%)`;
    const radialB = `radial-gradient(50% 50% at 85% 0%, rgba(255,255,255,.05), rgba(255,255,255,0) 50%)`;
    const conic = `conic-gradient(at 72% 28%, ${conicStops.join(", ")})`;

    return `${radialA}, ${radialB}, ${conic}`;
}

/* =========================
   Component
========================= */

function ChatConsultInner({profile, isLoggedIn}) {
    const {
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
        emotionMix,
        EMOTION_PALETTE,
    } = useChatFlow({customUser: profile});

    const [isEnding, setIsEnding] = useState(false);

    // 교차 페이드용 2 레이어 상태
    const [activeLayer, setActiveLayer] = useState(0); // 0 또는 1
    const [bgLayer, setBgLayer] = useState(["", ""]);  // 각 레이어의 backgroundImage 값

    // 새 배경이 오면 비활성 레이어에 먼저 세팅 → active 토글로 페이드
    const nextBackground = useMemo(
        () => buildCompositeBackground(emotionMix, EMOTION_PALETTE),
        [emotionMix, EMOTION_PALETTE]
    );

    useEffect(() => {
        if (!nextBackground) return;
        const inactive = activeLayer ^ 1; // 0->1, 1->0
        setBgLayer((prev) => {
            const next = [...prev];
            next[inactive] = nextBackground;
            return next;
        });
        // 다음 animation frame에 활성 토글해 opacity 전환
        const t = requestAnimationFrame(() => setActiveLayer(inactive));
        return () => cancelAnimationFrame(t);
    }, [nextBackground]); // eslint-disable-line react-hooks/exhaustive-deps

    const lastUserQuery = useMemo(() => {
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            if (chatHistory[i].sender === "user") return chatHistory[i].message;
        }
        return "";
    }, [chatHistory]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
        const parent = chatEndRef.current?.parentNode;
        if (parent && typeof parent.scrollTop === "number") parent.scrollTop = parent.scrollHeight;
    }, [chatHistory, isTyping, chatEndRef]);

    useEffect(() => {
        if (!isTyping) inputRef.current?.focus();
    }, [isTyping]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const onEndChat = async () => {
        setIsEnding(true);
        try {
            await handleEndChat();
        } finally {
            setIsEnding(false);
        }
    };

    useEffect(() => {
        if (!emotionMix) {
            console.log("[Emotion] no mix yet (using base background)");
            return;
        }
        const entries = Object.entries(emotionMix)
            .map(([k, v]) => `${k}:${Number(v).toFixed(2)}%`)
            .join(" | ");
        console.log(`[Emotion] active mix → ${entries}`);
    }, [emotionMix]);

    return (
        <div className="consult-wrap">
            {/* 🔥 감정 물결 배경 — 화면 전체 고정, 2중 레이어 교차 페이드 */}
            <div
                className={`emotion-bg layerA ${activeLayer === 0 ? "active" : ""}`}
                style={bgLayer[0] ? {backgroundImage: bgLayer[0]} : undefined}
                aria-hidden
            />
            <div
                className={`emotion-bg layerB ${activeLayer === 1 ? "active" : ""}`}
                style={bgLayer[1] ? {backgroundImage: bgLayer[1]} : undefined}
                aria-hidden
            />

            {/* 상단 헤더 */}
            <div className="consult-header">
                <div className="consult-logo">MindBridge</div>
                <h1 className="consult-title">{lastUserQuery || "무엇이든 물어보세요"}</h1>
            </div>

            {/* 메시지 영역 */}
            <div className="consult-stream" role="log" aria-live="polite">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`consult-bubble ${msg.sender}`}>
                        {msg.message}
                    </div>
                ))}
                {isTyping && <div className="consult-bubble ai typing">AI 응답 생성 중</div>}
                <div ref={chatEndRef}/>
            </div>

            {/* 하단 입력창 */}
            <form
                className="consult-inputbar"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                {isEnding && <div className="system-message">상담을 종료 중입니다</div>}

                <textarea
                    ref={inputRef}
                    className="consult-input"
                    placeholder="질문을 입력하고 Enter를 누르세요. (Shift+Enter 줄바꿈)"
                    value={chatInput}
                    onChange={(e) => {
                        setChatInput(e.target.value);
                        const el = e.target;
                        el.style.height = "0px";
                        el.style.height = Math.min(el.scrollHeight, 200) + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    readOnly={isTyping || isChatEnded || isEnding}
                    rows={1}
                />

                <div className="consult-actions">
                    {!isChatEnded ? (
                        <>
                            <button
                                type="submit"
                                className="consult-send"
                                disabled={isTyping || !chatInput.trim() || isEnding}
                            >
                                보내기
                            </button>
                            <button
                                type="button"
                                className="consult-end"
                                onClick={onEndChat}
                                disabled={isTyping || isEnding}
                            >
                                종료
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="consult-send"
                            onClick={() => {
                                handleRestartChat();
                                inputRef.current?.focus();
                            }}
                        >
                            새 상담 시작
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default function ChatConsult() {
    const {profile} = useAuth();
    const isLoggedIn = !!profile;
    const modeKey = isLoggedIn ? "logged-in" : "logged-out";
    return <ChatConsultInner key={modeKey} profile={profile} isLoggedIn={isLoggedIn}/>;
}
