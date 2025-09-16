// src/components/dashboard/ChatConsult.jsx
import {useEffect, useMemo, useRef, useState, useLayoutEffect} from "react";
import {useChatFlow} from "../chat/hooks/useChatFlow";
import {useAuth} from "../../AuthContext";

/* ========= 기존 유틸 ========= */
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

/* ========= 배경 빌드 ========= */
function buildCompositeBackground(mix, palette) {
    if (!mix) return null;
    const order = ["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"];
    const smooth = gammaSmooth(mix, 0.8);
    const adjusted = clampAndRedistribute(smooth, {min: 6, max: 65});

    let acc = 0;
    const conicStops = [];
    for (const key of order) {
        const pct = Math.max(0, Math.min(100, adjusted[key] || 0));
        if (pct < 1) continue;
        const alpha = alphaForPct(pct);
        const col = hexToRgba(palette[key] || "#ffffff", alpha);
        const from = acc;
        const to = acc + pct;
        conicStops.push(`${col} ${Math.max(0, from - 1)}% ${Math.min(100, to + 1)}%`);
        acc = to;
    }

    const radialA = `radial-gradient(60% 60% at 20% 20%, rgba(255,255,255,.08), transparent 70%)`;
    const radialB = `radial-gradient(50% 50% at 80% 10%, rgba(255,255,255,.05), transparent 60%)`;
    const conic = `conic-gradient(from 180deg at 50% 50%, ${conicStops.join(", ")})`;

    return `${radialA}, ${radialB}, ${conic}`;
}

/* ========= 감정 텍스트 ========= */
const EMOTION_DESCRIPTIONS = {
    happiness: "밝고 긍정적인 기분이에요.",
    sadness: "마음이 가라앉은 상태예요.",
    anger: "화가 나는 감정이 드는 상태예요.",
    anxiety: "불안하거나 긴장된 상태예요.",
    calmness: "평온하고 차분한 상태예요.",
    neutral: "중립적이고 안정적인 상태예요.",
};
const EMOJI = {
    happiness: "😊",
    sadness: "😢",
    anger: "😡",
    anxiety: "😟",
    calmness: "😌",
    neutral: "🙂",
};

/* ========= 세션 저장 키 & 타임아웃 ========= */
const LS_KEY = "mindbridge.chat.session.v1";
const TWO_MIN = 2 * 60 * 1000;
const ONE_MIN = 60 * 1000;

/* ========= 로컬스토리지 유틸 ========= */
function persistSession(payload) {
    try {
        const toSave = {...payload, savedAt: Date.now(), expiresAt: Date.now() + TWO_MIN};
        localStorage.setItem(LS_KEY, JSON.stringify(toSave));
        window.dispatchEvent(new CustomEvent("mb:chat:persisted", {detail: toSave}));
    } catch (_) {
    }
}

function readSession() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data?.expiresAt || Date.now() > data.expiresAt) return null;
        return data;
    } catch (_) {
        return null;
    }
}

export function clearSession() {
    try {
        localStorage.removeItem(LS_KEY);
    } catch (_) {
    }
}

/* ========= 메인 컴포넌트 ========= */
function ChatConsultInner({profile}) {
    const saved = readSession();
    const {
        chatInput, setChatInput,
        chatHistory,
        isTyping, isChatEnded,
        chatEndRef, inputRef,
        handleSubmit, handleEndChat, handleRestartChat,
        emotionMix, EMOTION_PALETTE,
        __internal,
    } = useChatFlow({
        customUser: profile,
        initialHistory: saved?.chatHistory || [],
        initialInput: saved?.chatInput || "",
        initialStep: typeof saved?.step === "number" ? saved.step : null,
        initialGuestForm: saved?.guestForm || null,
        initialIsChatEnded: typeof saved?.isChatEnded === "boolean" ? saved.isChatEnded : null,
    });

    const [isEnding, setIsEnding] = useState(false);
    const [activeLayer, setActiveLayer] = useState(0);
    const [bgLayer, setBgLayer] = useState(["", ""]);

    const [openInfo, setOpenInfo] = useState(false);
    const anchorRef = useRef(null);
    const [popPos, setPopPos] = useState({top: 0, left: 0});

    const [showIdleToast, setShowIdleToast] = useState(false);
    const [idleCountdown, setIdleCountdown] = useState(60);
    const idleTimerRef = useRef(null);
    const countdownRef = useRef(null);
    const autoEndRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    /* === 스타일 선택 (요청 반영) === */
    const styleOptions = ["따뜻한", "차가운", "쾌활한", "진중한", "심플한", "전문적"];
    const savedSession = useMemo(() => readSession(), []); // 한 번만 읽음

    const [formData, setFormData] = useState(() => ({
        chatStyle: savedSession?.chatStyle || profile?.chatStyle || "심플한",
    }));

    useEffect(() => {
        const newStyle = savedSession?.chatStyle || profile?.chatStyle || "심플한"; //값이 없다면 심플한

        // 값이 실제로 바뀌었을 때만 setFormData 호출
        setFormData(prev => {
            if (prev.chatStyle === newStyle) return prev;
            return { ...prev, chatStyle: newStyle };
        });
    }, [profile, savedSession]);

    const handleStyleSelect = (_e, newStyle) => {
        if (newStyle !== null && newStyle !== formData.chatStyle) {
            setFormData(prev => ({ ...prev, chatStyle: newStyle }));
        }
    };
    // 전역 data-속성으로도 노출 (CSS에서 조건부 스타일 가능)
    useEffect(() => {
        document.documentElement.setAttribute("data-mb-chat-style", formData.chatStyle);
        window.dispatchEvent(new CustomEvent("mb:chat:style", { detail: formData.chatStyle }));
    }, [formData.chatStyle]);

    /* === 배경 === */
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

    /* === 스크롤 유지 === */
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

    /* === 팝오버 위치 === */
    const recalcPopover = () => {
        const el = anchorRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setPopPos({top: r.bottom + 10 + window.scrollY, left: r.left + r.width / 2 + window.scrollX});
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

    /* === 세션 저장 === */
    useEffect(() => {
        if (isEnding) return;
        persistSession({
            chatHistory, chatInput,
            step: __internal?.step ?? null,
            guestForm: __internal?.guestForm ?? null,
            isChatEnded,
            chatStyle: formData.chatStyle,           // ← 저장
        });
    }, [chatHistory, chatInput, isChatEnded, isEnding, __internal?.step, __internal?.guestForm, formData.chatStyle]);

    /* === 종료 === */
    const onEndChat = async () => {
        stopIdleWatchers();
        setIsEnding(true);
        try {
            await handleEndChat();
            clearSession();
        } finally {
            setIsEnding(false);
        }
    };

    /* === 무활동 감시 === */
    function stopIdleWatchers() {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (autoEndRef.current) {
            clearTimeout(autoEndRef.current);
            autoEndRef.current = null;
        }
        setShowIdleToast(false);
    }

    function startIdleWatchers() {
        if (isChatEnded || isEnding) return;
        stopIdleWatchers();
        lastActivityRef.current = Date.now();
        idleTimerRef.current = setTimeout(() => {
            setShowIdleToast(true);
            setIdleCountdown(60);
            countdownRef.current = setInterval(() => {
                setIdleCountdown((prev) => prev > 0 ? prev - 1 : 0);
            }, 1000);
            autoEndRef.current = setTimeout(async () => {
                stopIdleWatchers();
                if (!isEnding && !isChatEnded) {
                    setIsEnding(true);
                    try {
                        await handleEndChat();
                        clearSession();
                    } finally {
                        setIsEnding(false);
                    }
                }
            }, ONE_MIN);
        }, ONE_MIN);
    }

    const onAnyActivity = () => {
        if (isChatEnded || isEnding) return;
        const now = Date.now();
        if (now - lastActivityRef.current < 300) return;
        lastActivityRef.current = now;
        stopIdleWatchers();
        persistSession({
            chatHistory, chatInput,
            step: __internal?.step ?? null,
            guestForm: __internal?.guestForm ?? null,
            isChatEnded,
            chatStyle: formData.chatStyle,           // ← 저장
        });
        startIdleWatchers();
    };

    /* ✅ user 메시지가 있어야 idle 감시 시작 */
    useEffect(() => {
        if (!chatHistory.some(m => m.sender === "user")) return;
        startIdleWatchers();
        const opts = {passive: true};
        window.addEventListener("mousemove", onAnyActivity, opts);
        window.addEventListener("click", onAnyActivity, opts);
        window.addEventListener("keydown", onAnyActivity, false);
        window.addEventListener("touchstart", onAnyActivity, opts);
        return () => {
            window.removeEventListener("mousemove", onAnyActivity, opts);
            window.removeEventListener("click", onAnyActivity, opts);
            window.removeEventListener("keydown", onAnyActivity, false);
            window.removeEventListener("touchstart", onAnyActivity, opts);
            stopIdleWatchers();
        };
    }, [chatHistory, chatInput, isChatEnded, isEnding, __internal?.step, __internal?.guestForm, formData.chatStyle]);

    /* === 지배 감정 === */
    const dominantEmotion = useMemo(() => {
        if (!emotionMix) return null;
        return Object.entries(emotionMix).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    }, [emotionMix]);
    const dominantPct = useMemo(() => {
        if (!emotionMix || !dominantEmotion) return null;
        const v = Number(emotionMix[dominantEmotion] || 0);
        return Math.max(0, Math.min(100, v));
    }, [emotionMix, dominantEmotion]);

    /* === 레전드 === */
    const LegendItem = ({k}) => {
        const color = EMOTION_PALETTE?.[k] || "#ccc";
        const pct = emotionMix && typeof emotionMix[k] === "number"
            ? Math.round(Math.max(0, Math.min(100, emotionMix[k])))
            : 0;
        return (
            <div className="legend-item" key={k} title={`${k} ${pct}%`}>
                <span className="legend-swatch" style={{backgroundColor: color}}/>
                <span className="legend-label" style={{color: color}}>{k.toUpperCase()}</span>
                <span className="legend-pct">{pct}%</span>
                <div className="legend-desc">{EMOTION_DESCRIPTIONS[k]}</div>
            </div>
        );
    };

    return (
        <div className="consult-wrap">
            {/* 배경 */}
            <div className={`emotion-bg layerA ${activeLayer === 0 ? "active" : ""}`}
                 style={bgLayer[0] ? {backgroundImage: bgLayer[0]} : undefined} aria-hidden/>
            <div className={`emotion-bg layerB ${activeLayer === 1 ? "active" : ""}`}
                 style={bgLayer[1] ? {backgroundImage: bgLayer[1]} : undefined} aria-hidden/>

            {/* 헤더 */}
            <div className="consult-header">
                <div className="consult-logo">MindBridge</div>
                <h1 className="consult-title">
                    {(chatHistory.findLast?.(m => m.sender === "user")?.message) || "무엇이든 물어보세요"}
                </h1>
            </div>

            {/* 감정 안내 버튼 */}
            <button
                ref={anchorRef}
                className="emotion-emoji-btn emotion-info-anchor"
                onClick={() => setOpenInfo(v => !v)}
                title="감정 안내 보기" aria-label="감정 안내 열기" aria-expanded={openInfo}
            >
                <svg className="icon-info" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 7a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 7zm-1 3h2v9h-2v-9z" fill="currentColor"/>
                </svg>
            </button>

            {/* 팝오버 */}
            {openInfo && (
                <div className="emotion-popover"
                     style={{
                         position: "fixed",
                         top: `${popPos.top}px`,
                         left: `${popPos.left}px`,
                         transform: "translate(-50%,0)"
                     }}
                     role="dialog" aria-modal="true">
                    <div className="emotion-popover-inner">
                        <div className="popover-header-row">
                            <strong>감정 색상 안내</strong>
                            <button className="close" onClick={() => setOpenInfo(false)} aria-label="닫기">×</button>
                        </div>
                        <div className="legend-grid">
                            {["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"].map(k => <LegendItem
                                k={k} key={k}/>)}
                        </div>
                        <div className="current-line">
                            {dominantEmotion ? (
                                <>
                                    <span className="dot" style={{background: EMOTION_PALETTE[dominantEmotion]}}/>
                                    <span className="state">
                                        지금은 <b>{EMOJI[dominantEmotion]} {dominantEmotion}</b> 상태예요
                                        {typeof dominantPct === "number" ? ` (${Math.round(dominantPct)}%)` : ""}.
                                    </span>
                                </>
                            ) : <span className="state">아직 분석된 감정이 없습니다.</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* 채팅 메시지 */}
            <div className="consult-stream" role="log" aria-live="polite">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`consult-bubble ${msg.sender}`}>{msg.message}</div>
                ))}
                {isTyping && <div className="consult-bubble ai typing">AI 응답 생성 중</div>}
                <div ref={chatEndRef}/>
            </div>

            {/* 입력창 */}
            <form
                className="consult-inputbar"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                {isEnding && <div className="system-message">상담을 종료 중입니다</div>}

                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "8px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        padding: "12px",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {/* 스타일 선택 드롭다운 (왼쪽) */}
                    <div className="style-dropdown" style={{position: "relative"}}>
                        <button
                            type="button"
                            onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 10px",
                                background: "#805dd1",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "15px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                minWidth: "100px",
                                justifyContent: "space-between",
                                height: "54px",
                            }}
                        >
                            <span>🎭 {formData.chatStyle}</span>
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                    transform: styleDropdownOpen ? "rotate(0deg)" : "rotate(180deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            >
                                <path
                                    d="M6 9l6 6 6-6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {styleDropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "100%",
                                    left: "0",
                                    marginBottom: "8px",
                                    background: "rgba(0,0,0,0.95)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    borderRadius: "12px",
                                    backdropFilter: "blur(20px)",
                                    zIndex: 1000,
                                    overflow: "hidden",
                                    boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
                                    minWidth: "200px",
                                }}
                            >
                                <div
                                    style={{
                                        padding: "8px 0",
                                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        margin: "0 12px 8px",
                                        fontSize: "11px",
                                        color: "rgba(255,255,255,0.6)",
                                        fontWeight: "600",
                                        textAlign: "center",
                                    }}
                                >
                                    대화 스타일 선택
                                </div>
                                {styleOptions.map((style) => (
                                    <button
                                        key={style.name}
                                        type="button"
                                        onClick={() => handleStyleSelect(style)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            background:
                                                formData.chatStyle === style.name
                                                    ? "rgba(255,255,255,0.1)"
                                                    : "transparent",
                                            border: "none",
                                            color: "white",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            transition: "background 0.2s ease",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "2px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "500",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            {style.name}
                                            {formData.chatStyle === style.name && (
                                                <span style={{fontSize: "10px", opacity: 0.7}}>✓</span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "rgba(255,255,255,0.7)",
                                            }}
                                        >
                                            {style.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 입력창 */}
                    <textarea
                        ref={inputRef}
                        className="consult-input"
                        placeholder="질문을 입력하고 Enter를 누르세요. (Shift+Enter 줄바꿈)"
                        value={chatInput}
                        onChange={(e) => {
                            __internal?.setStep?.(__internal.step);
                            __internal?.setGuestForm?.(__internal.guestForm);
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
                        style={{flex: 1}}
                    />

                    {/* 버튼들 (입력창 오른쪽) */}
                    <div className="consult-actions" style={{display: "flex", gap: "6px"}}>
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
                                    clearSession();
                                    inputRef.current?.focus();
                                }}
                            >
                                새 상담 시작
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* 무활동 토스트 */}
            {showIdleToast && !isEnding && !isChatEnded && (
                <div className="center-toast inactivity-toast" role="status" aria-live="assertive">
                    <div className="toast-title">1분 동안 활동이 없어요</div>
                    <div className="toast-desc"><b>{idleCountdown}</b>초 뒤 채팅이 자동 종료됩니다.</div>
                    <div className="toast-sub">정상적 종료를 원하시면 <b>채팅종료</b>를 눌러주세요.</div>
                </div>
            )}
        </div>
    );
}

export default function ChatConsult() {
    const {profile} = useAuth();
    useEffect(() => {
        if (!profile) {
            clearSession();
        }
    }, [profile]);
    const isLoggedIn = !!profile;
    const modeKey = isLoggedIn ? "logged-in" : "logged-out";
    return <ChatConsultInner key={modeKey} profile={profile}/>;
}
