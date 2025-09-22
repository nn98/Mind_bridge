// src/components/dashboard/ChatConsult.jsx
import {useEffect, useMemo, useRef, useState, useLayoutEffect} from "react";
import {useChatFlow} from "../chat/hooks/useChatFlow";
import {useAuth} from "../../AuthContext";
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {forwardRef} from 'react';
import {Color} from 'three';

/* ========= Silk Component ========= */
const hexToNormalizedRGB = hex => {
    hex = hex.replace('#', '');
    return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
    ];
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform vec3  uColors[6];
uniform float uWeights[6];   // ✅ 감정 비율 (합 = 1)

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

// ✅ 감정 비율 기반 그라데이션 색상
vec3 getGradientColor(float t) {
  vec3 color = vec3(0.0);
  float totalWeight = 0.0;
  float acc = 0.0;

  for (int i = 0; i < 6; i++) {
    float w = uWeights[i];
    float from = acc;
    float to = acc + w;
    acc = to;

    float mid = (from + to) * 0.5;
    float range = (to - from) * 0.5;

    float dist = abs(t - mid) / max(range, 0.0001);
    float influence = exp(-dist * 2.5);

    color += uColors[i] * influence;
    totalWeight += influence;
  }

  return color / max(totalWeight, 0.0001);
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;
  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.9 + 0.1 * sin(
      5.0 * (tex.x + tex.y +
             cos(3.0 * tex.x + 5.0 * tex.y) +
             0.02 * tOffset) +
      sin(20.0 * (tex.x + tex.y - 0.1 * tOffset))
  );

  float gradPos = clamp((vUv.x + vUv.y) * 0.5, 0.0, 1.0);
  vec3 gradColor = getGradientColor(gradPos);

  vec3 finalColor = gradColor * pattern + vec3(abs(rnd) * 0.02 * uNoiseIntensity);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const SilkPlane = forwardRef(function SilkPlane({uniforms}, ref) {
    const {viewport} = useThree();
    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.scale.set(viewport.width, viewport.height, 1);
        }
    }, [ref, viewport]);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.material.uniforms.uTime.value += 0.1 * delta;
        }
    });

    return (
        <mesh ref={ref}>
            <planeGeometry args={[1, 1, 1, 1]}/>
            <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}/>
        </mesh>
    );
});
SilkPlane.displayName = 'SilkPlane';

const Silk = ({speed = 5, scale = 1, palette, mix, noiseIntensity = 1.5, rotation = 0}) => {
    const meshRef = useRef();

    const uniforms = useMemo(() => {
        const order = ["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"];

        // ✅ mix가 비어있을 때 fallback weight 지정
        const hasMix = mix && Object.values(mix).some(v => v > 0);
        const weights = hasMix
            ? order.map(k => (mix?.[k] || 0) / 100)
            : [1, 0, 0, 0, 0, 0];   // → 기본값: happiness 100%

        // ✅ palette 없거나 mix가 비었을 때 fallback 색상 (파스텔 보라)
        const fallbackColor = "#d8b4fe"; // 파스텔 보라
        const colors = order.map(k =>
            new Color(...hexToNormalizedRGB(hasMix ? (palette?.[k] || fallbackColor) : fallbackColor))
        );

        return {
            uSpeed: {value: speed},
            uScale: {value: scale},
            uNoiseIntensity: {value: noiseIntensity},
            uRotation: {value: rotation},
            uTime: {value: 0},
            uColors: {value: colors},
            uWeights: {value: weights},
        };
    }, [speed, scale, noiseIntensity, rotation, palette]);

    /* ✅ 실시간 업데이트 */
    useEffect(() => {
        if (!meshRef.current?.material) return;
        const order = ["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"];
        const hasMix = mix && Object.values(mix).some(v => v > 0);
        const fallbackColor = "#C9A7EB";

        // Weights 업데이트
        meshRef.current.material.uniforms.uWeights.value =
            hasMix ? order.map(k => (mix?.[k] || 0) / 100) : [1, 0, 0, 0, 0, 0];

        // Colors 업데이트
        meshRef.current.material.uniforms.uColors.value =
            hasMix
                ? order.map(k => new Color(...hexToNormalizedRGB(palette?.[k] || fallbackColor)))
                : order.map(() => new Color(...hexToNormalizedRGB(fallbackColor)));
    }, [mix, palette]);

    return (
        <Canvas
            dpr={[1, 2]}
            frameloop="always"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        >
            <SilkPlane ref={meshRef} uniforms={uniforms}/>
        </Canvas>
    );
};

/* ========= 유틸 함수 ========= */
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
    // 파스텔톤을 위해 전체적으로 더 투명하게 조정
    if (pct >= 60) return 0.15;
    if (pct >= 30) return 0.25;
    return 0.35;
}

/* ========= 배경 빌드 ========= */
function buildCompositeBackground(mix, palette) {
    if (!mix) {
        // 기본 배경 - 부드러운 파스텔 그라데이션
        const baseGradient = "linear-gradient(135deg, #e8d5ff 0%, #d4c5f9 25%, #f5c2e7 50%, #ffc9dd 75%, #c2e9fb 100%)";
        const overlayGradient = "linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 30%, rgba(255,255,255,0.15) 70%, transparent 100%)";
        const radialLight = "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)";
        const radialSoft = "radial-gradient(ellipse at 70% 80%, rgba(255, 220, 255, 0.15) 0%, transparent 60%)";

        return `${radialLight}, ${radialSoft}, ${overlayGradient}, ${baseGradient}`;
    }

    const order = ["happiness", "calmness", "neutral", "sadness", "anxiety", "anger"];
    const smooth = gammaSmooth(mix, 1.0);
    const adjusted = clampAndRedistribute(smooth, {min: 2, max: 80});

    // 감정별 그라데이션 생성 (파스텔 버전)
    let acc = 0;
    const gradientStops = [];
    const emotionColors = [];

    for (const key of order) {
        const pct = Math.max(0, Math.min(100, adjusted[key] || 0));
        if (pct < 1) continue;

        const color = palette[key] || "#ffffff";
        emotionColors.push({color, pct, key});

        // 파스텔톤으로 alpha 값 조정
        const alpha = Math.min(0.4, alphaForPct(pct) * 0.7); // 더 투명하게
        const col = hexToRgba(color, alpha);
        const from = acc;
        const to = acc + pct;
        gradientStops.push(`${col} ${Math.max(0, from - 2)}% ${Math.min(100, to + 2)}%`);
        acc = to;
    }

    // 지배적인 감정 색상으로 파스텔 메인 그라데이션 생성
    const dominantEmotion = emotionColors.reduce((a, b) => (b.pct > a.pct ? b : a), emotionColors[0]);
    const dominantColor = dominantEmotion?.color || "#e8d5ff";

    // 다층 파스텔 그라데이션 구성
    const baseGradient = `linear-gradient(135deg, ${dominantColor}30 0%, ${dominantColor}40 30%, ${dominantColor}20 70%, ${dominantColor}35 100%)`;
    const meshGradient = `radial-gradient(ellipse at 20% 30%, ${dominantColor}20 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, ${dominantColor}25 0%, transparent 50%)`;
    const overlayGradient = "linear-gradient(45deg, rgba(255,255,255,0.15) 0%, transparent 25%, rgba(255,255,255,0.08) 60%, transparent 100%)";
    const conicGradient = gradientStops.length > 0 ? `conic-gradient(from 180deg at 50% 50%, ${gradientStops.join(", ")})` : "";

    // 최종 조합
    const layers = [overlayGradient, meshGradient];
    if (conicGradient) layers.push(conicGradient);
    layers.push(baseGradient);

    return layers.join(", ");
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

/* ========= 세션 저장 키 & 타이머 ========= */
const LS_KEY = "mindbridge.chat.session.v1";
const TWO_MIN = 2 * 60 * 1000;
const ONE_MIN = 60 * 1000;

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

    const [formData, setFormData] = useState({
        chatStyle: saved?.chatStyle || "심플한",
    });
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
        chatStyle: formData.chatStyle,
        initialHistory: saved?.chatHistory || [],
        initialInput: saved?.chatInput || "",
        initialStep: typeof saved?.step === "number" ? saved.step : null,
        initialGuestForm: saved?.guestForm || null,
        initialIsChatEnded: typeof saved?.isChatEnded === "boolean" ? saved.isChatEnded : null,
    });
    // ✅ 감정 결과 유무 체크
    const hasEmotionResult = useMemo(
        () => emotionMix && Object.values(emotionMix).some(v => v > 0),
        [emotionMix]
    );

    const [isEnding, setIsEnding] = useState(false);
    const [useSilkBg, setUseSilkBg] = useState(false); // Silk 배경 토글
    const [cssBackground, setCssBackground] = useState(""); // 단일 CSS 배경
    const [isTransitioning, setIsTransitioning] = useState(false); // 배경 전환 상태

    const [openInfo, setOpenInfo] = useState(false);
    const anchorRef = useRef(null);
    const [popPos, setPopPos] = useState({top: 0, left: 0});
    const popoverRef = useRef(null);

    const [showIdleToast, setShowIdleToast] = useState(false);
    const [idleCountdown, setIdleCountdown] = useState(60);
    const idleTimerRef = useRef(null);
    const countdownRef = useRef(null);
    const autoEndRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    /* === 스타일 선택 === */
    const styleOptions = [
        {name: '따뜻한', desc: '공감하고 위로하는'},
        {name: '차가운', desc: '냉정하고 객관적인'},
        {name: '쾌활한', desc: '밝고 긍정적인'},
        {name: '진중한', desc: '깊이 있게 생각하는'},
        {name: '심플한', desc: '간결하고 명확한'},
        {name: '전문적', desc: '전문성 있는'}
    ];
    const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleStyleSelect = (style) => {
        setFormData((prev) => ({...prev, chatStyle: style.name}));
        setStyleDropdownOpen(false);
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-mb-chat-style", formData.chatStyle);
        window.dispatchEvent(new CustomEvent("mb:chat:style", {detail: formData.chatStyle}));
    }, [formData.chatStyle]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setStyleDropdownOpen(false);
            }
        };
        if (styleDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [styleDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target) &&
                anchorRef.current && !anchorRef.current.contains(event.target)) {
                setOpenInfo(false);
            }
        };
        if (openInfo) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openInfo]);

    /* === 단일 CSS 배경 업데이트 === */
    const nextBackground = useMemo(
        () => buildCompositeBackground(emotionMix, EMOTION_PALETTE),
        [emotionMix, EMOTION_PALETTE]
    );

    useEffect(() => {
        if (!nextBackground || useSilkBg) return;
        setCssBackground(nextBackground);
    }, [nextBackground, useSilkBg]);

    /* === 배경 전환 애니메이션 === */
    const handleBgToggle = () => {
        setIsTransitioning(true);

        // 전환 애니메이션 시작
        setTimeout(() => {
            setUseSilkBg(!useSilkBg);
            // 전환 완료 후 잠시 후 상태 리셋
            setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
        }, 300); // 페이드아웃 시간과 맞춤
    };

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
            chatStyle: formData.chatStyle,
            useSilkBg,
        });
    }, [chatHistory, chatInput, isChatEnded, isEnding, __internal?.step, __internal?.guestForm, formData.chatStyle, useSilkBg]);

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
            chatStyle: formData.chatStyle,
            useSilkBg,
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
    }, [chatHistory, chatInput, isChatEnded, isEnding, __internal?.step, __internal?.guestForm, formData.chatStyle, useSilkBg]);

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

    /* === 세션에서 Silk 설정 복원 === */
    useEffect(() => {
        if (saved?.useSilkBg !== undefined) {
            setUseSilkBg(saved.useSilkBg);
        }
    }, []);

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
        <div className="consult-wrap" style={{position: 'relative'}}>
            {/* Silk 배경 - 전체 화면에 고정 */}
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -10,
                pointerEvents: "none",
                opacity: useSilkBg ? 1 : 0,
                transition: "opacity 0.6s ease-in-out",
                visibility: isTransitioning || useSilkBg ? "visible" : "hidden"
            }}>
                <Silk
                    speed={10}
                    scale={1.2}
                    palette={EMOTION_PALETTE}
                    mix={emotionMix}
                    noiseIntensity={0.8}
                    rotation={180}
                />
            </div>

            {/* CSS 배경 */}
            <div
                className="emotion-bg"
                style={{
                    backgroundImage: hasEmotionResult
                        ? cssBackground
                        : "linear-gradient(270deg, #ffd6a5, #cfe1ff, #ffc9c9, #e3d1ff, #c9f4e5, #ffecb3)",
                    backgroundSize: hasEmotionResult ? "200% 200%" : "1200% 100%",
                    animation: hasEmotionResult
                        ? "gradientShift 10s ease infinite"
                        : "slideColors 30s linear infinite",
                    transition: 'background-image 1.5s ease-in-out, opacity 0.6s ease-in-out',
                    opacity: !useSilkBg ? 1 : 0,
                    visibility: isTransitioning || !useSilkBg ? "visible" : "hidden"
                }}
                aria-hidden
            />

            {/* 헤더 */}
            <div className="consult-header">
                <div className="consult-logo">MindBridge</div>
                <h1 className="consult-title">
                    {(chatHistory.findLast?.(m => m.sender === "user")?.message) || "무엇이든 물어보세요"}
                </h1>

                {/* 배경 토글 버튼 */}
                <button
                    className="bg-toggle-btn"
                    onClick={handleBgToggle}
                    disabled={isTransitioning}
                    title={`${useSilkBg ? '기본' : '실크'} 배경으로 변경`}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: isTransitioning ? '#9ca3af' : '#c4b5fd',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'white',
                        cursor: isTransitioning ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
                        opacity: isTransitioning ? 0.7 : 1
                    }}
                >
                    {isTransitioning ? '🔄 전환중' : useSilkBg ? '🎨 기본' : '✨ 실크'}
                </button>
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
                     ref={popoverRef}
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

                <div className="consult-input-wrapper">
                    {/* 스타일 선택 드롭다운 (왼쪽) */}
                    <div className="style-dropdown" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                            className={`style-dropdown-btn ${styleDropdownOpen ? "open" : ""}`}
                        >
                            <span>🎭 {formData.chatStyle}</span>
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="dropdown-arrow"
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
                            <div className="style-dropdown-menu">
                                <div className="style-dropdown-header">대화 스타일 선택</div>
                                {styleOptions.map((style) => (
                                    <button
                                        key={style.name}
                                        type="button"
                                        onClick={() => handleStyleSelect(style)}
                                        className={`style-dropdown-item ${
                                            formData.chatStyle === style.name ? "active" : ""
                                        }`}
                                    >
                                        <div className="style-dropdown-item-title">
                                            {style.name}
                                            {formData.chatStyle === style.name && (
                                                <span className="checkmark">✓</span>
                                            )}
                                        </div>
                                        <div className="style-dropdown-item-desc">{style.desc}</div>
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

        // CSS 애니메이션 키프레임 추가
        if (!document.getElementById('gradient-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'gradient-animation-styles';
            style.textContent = `
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    25% { background-position: 100% 50%; }
                    50% { background-position: 100% 100%; }
                    75% { background-position: 0% 100%; }
                    100% { background-position: 0% 50%; }
                }
                
                .emotion-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: -5;
                    pointer-events: none;
                }
                
                .emotion-bg::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 30%, transparent 70%);
                    animation: pulseLight 8s ease-in-out infinite alternate;
                }
                @keyframes slideColors {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                
                @keyframes pulseLight {
                    0% { opacity: 0.3; transform: scale(1); }
                    100% { opacity: 0.8; transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }, [profile]);

    const isLoggedIn = !!profile;
    const modeKey = isLoggedIn ? "logged-in" : "logged-out";
    return <ChatConsultInner key={modeKey} profile={profile}/>;
}