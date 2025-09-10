// src/components/dashboard/ChatConsult.jsx
import {useEffect, useMemo, useRef, useState, useLayoutEffect} from "react";
import {useChatFlow} from "../chat/hooks/useChatFlow";
import {useAuth} from "../../AuthContext";

/* ========= 기존 유틸/로직 (수정 없음) ========= */
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

const EMOTION_DESCRIPTIONS = {
    happiness: "밝고 긍정적인 기분이에요.",
    sadness: "마음이 가라앉은 상태예요.",
    anger: "화가 나는 감정이 드는 상태예요.",
    anxiety: "불안하거나 긴장된 상태예요.",
    calmness: "평온하고 차분한 상태예요.",
    neutral: "특별한 감정 없이 안정적인 상태예요.",
};
/* ====================================== */

const EMOJI = {
    happiness: "😊",
    sadness: "😢",
    anger: "😡",
    anxiety: "😟",
    calmness: "😌",
    neutral: "🙂",
};

function ChatConsultInner({profile}) {
    const {
        chatInput, setChatInput, chatHistory, isTyping, isChatEnded,
        chatEndRef, inputRef, handleSubmit, handleEndChat, handleRestartChat,
        emotionMix, EMOTION_PALETTE,
    } = useChatFlow({customUser: profile});

    const [isEnding, setIsEnding] = useState(false);
    const [activeLayer, setActiveLayer] = useState(0);
    const [bgLayer, setBgLayer] = useState(["", ""]);

    // 🔗 좌상단 앵커 버튼 & 팝오버
    const [openInfo, setOpenInfo] = useState(false);
    const anchorRef = useRef(null);
    const [popPos, setPopPos] = useState({top: 0, left: 0});

    const nextBackground = useMemo(
        () => buildCompositeBackground(emotionMix, EMOTION_PALETTE),
        [emotionMix, EMOTION_PALETTE]
    );

    useEffect(() => {
        if (!nextBackground) return;
        const inactive = activeLayer ^ 1;
        setBgLayer((prev) => {
            const next = [...prev];
            next[inactive] = nextBackground;
            return next;
        });
        const t = requestAnimationFrame(() => setActiveLayer(inactive));
        return () => cancelAnimationFrame(t);
    }, [nextBackground]);

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

    // 현재 지배 감정 & 퍼센트
    const dominantEmotion = useMemo(() => {
        if (!emotionMix) return null;
        return Object.entries(emotionMix).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    }, [emotionMix]);

    const dominantPct = useMemo(() => {
        if (!emotionMix || !dominantEmotion) return null;
        const v = Number(emotionMix[dominantEmotion] || 0);
        return Math.max(0, Math.min(100, v));
    }, [emotionMix, dominantEmotion]);

    // 팝오버 위치
    const recalcPopover = () => {
        const el = anchorRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setPopPos({
            top: r.bottom + 10 + window.scrollY,
            left: r.left + r.width / 2 + window.scrollX,
        });
    };
    useLayoutEffect(() => {
        if (!openInfo) return;
        recalcPopover();
        const onWin = () => recalcPopover();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, {passive: true});
        return () => {
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin);
        };
    }, [openInfo]);

    // 감정 레전드 아이템 JSX
    const LegendItem = ({k}) => {
        const color = EMOTION_PALETTE?.[k] || "#ccc";
        const pct = emotionMix && typeof emotionMix[k] === "number"
            ? Math.round(Math.max(0, Math.min(100, emotionMix[k])))
            : 0;
        return (
            <div className="legend-item" key={k} title={`${k} ${pct}%`}>
                <span className="legend-swatch" style={{backgroundColor: color}}/>
                <span className="legend-label">
          {EMOJI[k]} {k}
        </span>
                <span className="legend-pct">{pct}%</span>
                <div className="legend-desc">{EMOTION_DESCRIPTIONS[k]}</div>
            </div>
        );
    };

    return (
        <div className="consult-wrap">
            {/* 배경 레이어 */}
            <div className={`emotion-bg layerA ${activeLayer === 0 ? "active" : ""}`}
                 style={bgLayer[0] ? {backgroundImage: bgLayer[0]} : undefined} aria-hidden/>
            <div className={`emotion-bg layerB ${activeLayer === 1 ? "active" : ""}`}
                 style={bgLayer[1] ? {backgroundImage: bgLayer[1]} : undefined} aria-hidden/>

            {/* 헤더 (그대로) */}
            <div className="consult-header">
                <div className="consult-logo">MindBridge</div>
                <h1 className="consult-title">{lastUserQuery || "무엇이든 물어보세요"}</h1>
            </div>

            <button
                ref={anchorRef}
                className="emotion-emoji-btn emotion-info-anchor"
                onClick={() => setOpenInfo(v => !v)}
                title="감정 안내 보기"
                aria-label="감정 안내 열기"
                aria-expanded={openInfo}
            >
                {/* 단순 알파벳 i 아이콘 */}
                <svg className="icon-info" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 7a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 7zm-1 3h2v9h-2v-9z" fill="currentColor"/>
                </svg>
            </button>

            {/* 팝오버 */}
            {openInfo && (
                <div
                    className="emotion-popover"
                    style={{
                        position: "fixed",
                        top: `${popPos.top}px`,
                        left: `${popPos.left}px`,
                        transform: "translate(-50%,0)"
                    }}
                    role="dialog" aria-modal="true"
                >
                    <div className="emotion-popover-inner">
                        <div className="popover-header-row">
                            <strong>감정 색상 안내</strong>
                            <button className="close" onClick={() => setOpenInfo(false)} aria-label="닫기">×</button>
                        </div>

                        {/* 레전드 그리드 */}
                        <div className="legend-grid">
                            {["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"].map(k => (
                                <LegendItem k={k} key={k}/>
                            ))}
                        </div>

                        {/* 현재 상태 라인 */}
                        <div className="current-line">
                            {dominantEmotion ? (
                                <>
                                    <span className="dot" style={{background: EMOTION_PALETTE[dominantEmotion]}}/>
                                    <span className="state">
                    지금은 <b>{EMOJI[dominantEmotion]} {dominantEmotion}</b> 상태예요
                                        {typeof dominantPct === "number" ? ` (${Math.round(dominantPct)}%)` : ""}.
                  </span>
                                </>
                            ) : (
                                <span className="state">아직 분석된 감정이 없습니다.</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 메시지 영역 */}
            <div className="consult-stream" role="log" aria-live="polite">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`consult-bubble ${msg.sender}`}>{msg.message}</div>
                ))}
                {isTyping && <div className="consult-bubble ai typing">AI 응답 생성 중</div>}
                <div ref={chatEndRef}/>
            </div>

            {/* 입력 바 */}
            <form className="consult-inputbar" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
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
                            <button type="submit" className="consult-send"
                                    disabled={isTyping || !chatInput.trim() || isEnding}>보내기
                            </button>
                            <button type="button" className="consult-end" onClick={async () => {
                                setIsEnding(true);
                                try {
                                    await handleEndChat();
                                } finally {
                                    setIsEnding(false);
                                }
                            }} disabled={isTyping || isEnding}>종료
                            </button>
                        </>
                    ) : (
                        <button type="button" className="consult-send"
                                onClick={() => {
                                    handleRestartChat();
                                    inputRef.current?.focus();
                                }}>
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
    return <ChatConsultInner key={modeKey} profile={profile}/>;
}
