import { useState, useCallback } from 'react';
import { requestEmotionAnalysis } from '../services/emotionApi';
import { parseJsonFromText } from '../utils/parseJsonFromText';
import { emotionMessages } from '../constants/emotionTexts';

export function useEmotionAnalysis() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null); // { percentages, dominantEmotion, message }
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = useCallback(async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const content = await requestEmotionAnalysis(text);
            const percentages = parseJsonFromText(content);
            if (!percentages) throw new Error('JSON 파싱 실패');

            // 숫자 보정
            const normalized = Object.fromEntries(
                Object.entries(percentages).map(([k, v]) => [k, Number(v) || 0])
            );

            // 지배적 감정
            const keys = Object.keys(normalized);
            const dominantEmotion = keys.reduce((a, b) => (normalized[a] > normalized[b] ? a : b), keys[0]);

            const candidates = emotionMessages[dominantEmotion] || emotionMessages.default;
            const message = candidates[Math.floor(Math.random() * candidates.length)];

            setResult({ percentages: normalized, dominantEmotion, message });
        } catch (e) {
            console.error('[Emotion] 분석 실패:', e);
            alert('감정 분석 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    const reset = useCallback(() => {
        setText('');
        setResult(null);
    }, []);

    return {
        text,
        setText,
        result,
        isLoading,
        handleAnalyze,
        reset,
    };
}
