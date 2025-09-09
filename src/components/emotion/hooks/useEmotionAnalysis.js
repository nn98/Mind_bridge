// src/hooks/useEmotionAnalysis.js (업그레이드 교체본)
import {useState, useCallback, useRef, useEffect, useMemo} from 'react';
import {requestEmotionAnalysis} from '../services/emotionApi';
import {emotionMessages} from '../constants/emotionTexts';

export const EMOTION_KEYS = ['happiness', 'sadness', 'anger', 'anxiety', 'calmness'];
const STORAGE_KEY = 'ea_history_v1';
const MIN_CHARS = 8;

function clampNum(n) {
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function normalizeTo100(picked) {
    // 합계 및 라운딩 보정
    const sum = EMOTION_KEYS.reduce((acc, k) => acc + clampNum(picked[k]), 0);
    if (sum <= 0) throw new Error('모든 감정 값이 0입니다.');

    // 정규화 후 반올림
    const normalized = {};
    for (const k of EMOTION_KEYS) {
        normalized[k] = Math.round((clampNum(picked[k]) / sum) * 100);
    }
    // 총합이 100이 아닐 경우 가장 큰 버킷에 보정
    const total = Object.values(normalized).reduce((a, b) => a + b, 0);
    if (total !== 100) {
        const maxKey = EMOTION_KEYS.reduce((a, b) =>
            normalized[a] >= normalized[b] ? a : b
        );
        normalized[maxKey] += (100 - total);
    }
    return normalized;
}

function pickDominant(normalized) {
    // 동률 시 EMOTION_KEYS의 등장 순서를 우선
    return EMOTION_KEYS.reduce((a, b) =>
        normalized[a] > normalized[b] ? a : normalized[a] === normalized[b] ? a : b
    );
}

function entropyConfidence(percentages) {
    // Shannon entropy로 균등도 측정 → 0(균등)~1(단일 지배)
    const probs = EMOTION_KEYS.map(k => Math.max(1e-9, percentages[k] / 100));
    const H = -probs.reduce((s, p) => s + p * Math.log(p), 0);
    const Hmax = Math.log(EMOTION_KEYS.length);
    const c = 1 - H / Hmax; // 0~1
    return Math.max(0, Math.min(1, c));
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
    }
}

export function useEmotionAnalysis() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null); // { percentages, dominantEmotion, message, confidence, createdAt, summary }
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState(() => loadHistory());
    const abortRef = useRef(null);

    // 분석 가능 여부(버튼 비활성에 사용)
    const analyzeDisabled = useMemo(
        () => isLoading || !text.trim() || text.trim().length < MIN_CHARS,
        [isLoading, text]
    );

    useEffect(() => {
        return () => {
            // 언마운트 시 진행중 요청 취소
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const handleAnalyze = useCallback(async () => {
        const query = text.trim();
        if (!query || query.length < MIN_CHARS) return;

        // 진행중이면 취소
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setResult(null);
        try {
            // API 호출({ signal })이 지원된다면 전달 (서비스에서 사용)
            const raw = await requestEmotionAnalysis(query, {signal: controller.signal});

            // 필요한 키만 숫자화
            const picked = {};
            for (const k of EMOTION_KEYS) picked[k] = clampNum(raw?.[k] ?? 0);

            const percentages = normalizeTo100(picked);
            const dominantEmotion = pickDominant(percentages);

            const candidates = emotionMessages[dominantEmotion] || emotionMessages.default || ['요약을 생성하지 못했습니다.'];
            const message = candidates[Math.floor(Math.random() * candidates.length)];

            const confidence = entropyConfidence(percentages);
            const createdAt = Date.now();
            const summary = `지배 감정: ${dominantEmotion} (${percentages[dominantEmotion]}%)`;

            const packed = {percentages, dominantEmotion, message, confidence, createdAt, summary, text: query};

            setResult(packed);

            // 히스토리 저장(최신 20개)
            const next = [packed, ...history].slice(0, 20);
            setHistory(next);
            saveHistory(next);
        } catch (e) {
            if (e?.name !== 'AbortError') {
                console.error('[Emotion] 분석 실패:', e);
                alert('감정 분석 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
            abortRef.current = null;
        }
    }, [text, history]);

    const reset = useCallback(() => {
        setText('');
        setResult(null);
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        saveHistory([]);
    }, []);

    const removeHistoryItem = useCallback((createdAt) => {
        const next = history.filter(h => h.createdAt !== createdAt);
        setHistory(next);
        saveHistory(next);
    }, [history]);

    // 최근 결과와 비교(증가/감소 % 반환)
    const compareWithPrevious = useCallback(() => {
        if (history.length < 2) return null;
        const [curr, prev] = history;
        const diff = {};
        for (const k of EMOTION_KEYS) {
            diff[k] = (curr.percentages[k] ?? 0) - (prev.percentages[k] ?? 0);
        }
        return diff; // { happiness: +3, ... }
    }, [history]);

    return {
        text,
        setText,
        result,
        isLoading,
        handleAnalyze,
        reset,

        // ⬇️ 추가 노출(선택적 사용)
        analyzeDisabled,
        history,
        clearHistory,
        removeHistoryItem,
        compareWithPrevious,
    };
}
