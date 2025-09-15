// src/hooks/useEmotionAnalysis.js
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { requestEmotionAnalysis } from "../services/emotionApi";
import { emotionMessages } from "../constants/emotionTexts";
import { useAuth } from "../../../AuthContext"; // ✅ 유저 정보

export const EMOTION_KEYS = ["happiness", "sadness", "anger", "anxiety", "calmness"];
const MIN_CHARS = 8;

function clampNum(n) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function normalizeTo100(picked) {
  const sum = EMOTION_KEYS.reduce((acc, k) => acc + clampNum(picked[k]), 0);
  if (sum <= 0) throw new Error("모든 감정 값이 0입니다.");

  const normalized = {};
  for (const k of EMOTION_KEYS) {
    normalized[k] = Math.round((clampNum(picked[k]) / sum) * 100);
  }
  const total = Object.values(normalized).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const maxKey = EMOTION_KEYS.reduce((a, b) =>
      normalized[a] >= normalized[b] ? a : b
    );
    normalized[maxKey] += 100 - total;
  }
  return normalized;
}

function pickDominant(normalized) {
  return EMOTION_KEYS.reduce((a, b) =>
    normalized[a] > normalized[b] ? a : normalized[a] === normalized[b] ? a : b
  );
}

function entropyConfidence(percentages) {
  const probs = EMOTION_KEYS.map((k) => Math.max(1e-9, percentages[k] / 100));
  const H = -probs.reduce((s, p) => s + p * Math.log(p), 0);
  const Hmax = Math.log(EMOTION_KEYS.length);
  return Math.max(0, Math.min(1, 1 - H / Hmax));
}

export function useEmotionAnalysis() {
  const { profile } = useAuth(); // ✅ 로그인 사용자
  const userEmail = profile?.email || "guest";
  const userId = profile?.id || userEmail;
  const STORAGE_KEY = `ea_history_v1_${userId}`; // ✅ 유저별 구분된 키

  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const abortRef = useRef(null);

  const analyzeDisabled = useMemo(
    () => isLoading || !text.trim() || text.trim().length < MIN_CHARS,
    [isLoading, text]
  );

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const saveHistory = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    setHistory(list);
  };

  const handleAnalyze = useCallback(async () => {
    const query = text.trim();
    if (!query || query.length < MIN_CHARS) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setResult(null);
    try {
      // ✅ email + text 전달 + signal 옵션 추가
      const raw = await requestEmotionAnalysis(userEmail, query, {
        signal: controller.signal,
      });

      const picked = {};
      for (const k of EMOTION_KEYS) picked[k] = clampNum(raw?.[k] ?? 0);

      const percentages = normalizeTo100(picked);
      const dominantEmotion = pickDominant(percentages);

      const candidates =
        emotionMessages[dominantEmotion] ||
        emotionMessages.default ||
        ["요약을 생성하지 못했습니다."];
      const message = candidates[Math.floor(Math.random() * candidates.length)];

      const confidence = entropyConfidence(percentages);
      const createdAt = Date.now();
      const summary = `지배 감정: ${dominantEmotion} (${percentages[dominantEmotion]}%)`;

      const packed = {
        percentages,
        dominantEmotion,
        message,
        confidence,
        createdAt,
        summary,
        text: query,
      };

      setResult(packed);

      const next = [packed, ...history].slice(0, 20);
      saveHistory(next);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("[Emotion] 분석 실패:", e);
        alert("감정 분석 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [text, history, STORAGE_KEY, userEmail]);

  const reset = useCallback(() => {
    setText("");
    setResult(null);
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [STORAGE_KEY]);

  const removeHistoryItem = useCallback(
    (createdAt) => {
      const next = history.filter((h) => h.createdAt !== createdAt);
      saveHistory(next);
    },
    [history, STORAGE_KEY]
  );

  const compareWithPrevious = useCallback(() => {
    if (history.length < 2) return null;
    const [curr, prev] = history;
    const diff = {};
    for (const k of EMOTION_KEYS) {
      diff[k] = (curr.percentages[k] ?? 0) - (prev.percentages[k] ?? 0);
    }
    return diff;
  }, [history]);

  return {
    text,
    setText,
    result,
    isLoading,
    handleAnalyze,
    reset,
    analyzeDisabled,
    history,
    clearHistory,
    removeHistoryItem,
    compareWithPrevious,
  };
}
