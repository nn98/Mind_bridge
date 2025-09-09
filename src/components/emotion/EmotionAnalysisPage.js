// src/components/emotion/EmotionAnalysisPage.js
import React, {useEffect, useMemo, useState} from 'react';
import '../../css/EmotionAnalysisPage.css';
import AnalysisCard from './components/AnalysisCard';
import {useEmotionAnalysis} from './hooks/useEmotionAnalysis';

export default function EmotionAnalysisPage({
                                                mode = 'page',
                                                isOpen,
                                                onClose,
                                                initialText = '',
                                                presets = [
                                                    {label: '일상', text: '오늘 회사에서 동료와 작은 오해가 있었는데 계속 마음이 쓰여요.'},
                                                    {label: '연애', text: '요즘 연락 빈도가 줄어들면서 불안하고 자꾸 부정적으로 생각하게 됩니다.'},
                                                    {label: '학업', text: '과제 마감이 겹쳐서 압박감이 크고 무엇부터 해야 할지 막막해요.'},
                                                    {label: '가족', text: '부모님과의 대화에서 자주 감정이 격해져 후회가 남습니다.'},
                                                ],
                                            }) {
    // 훅
    const {
        text, setText, result, isLoading,
        handleAnalyze, reset, analyzeDisabled,
        history: analysisHistory, clearHistory, removeHistoryItem, compareWithPrevious,
    } = useEmotionAnalysis();

    // === 추가 기능들(전체화면/다크모드 제외) ===
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [analysisDepth, setAnalysisDepth] = useState('standard'); // standard, deep, quick
    const [focusArea, setFocusArea] = useState('overall'); // overall, relationships, work, personal
    const [textLength, setTextLength] = useState(0);
    const [showWordCloud, setShowWordCloud] = useState(false);

    // initialText 주입
    useEffect(() => {
        if (initialText && !text) setText(initialText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialText]);

    // 텍스트 길이 추적
    useEffect(() => {
        setTextLength(text.length);
    }, [text]);

    // 모달 열렸을 때: Esc 닫기 + 바디 스크롤 잠금
    useEffect(() => {
        if (mode !== 'modal' || !isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isOpen]);

    const handleClose = () => {
        reset();
        if (typeof onClose === 'function') onClose();
    };

    // 향상된 분석 옵션과 함께 분석 실행
    const handleEnhancedAnalyze = () => {
        const options = {
            depth: analysisDepth,
            focus: focusArea,
            includeWordCloud: showWordCloud,
        };
        handleAnalyze(options);
    };

    // 텍스트 통계 계산
    const textStats = useMemo(() => {
        if (!text) return {words: 0, sentences: 0, avgWordsPerSentence: 0};
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
        return {words, sentences, avgWordsPerSentence};
    }, [text]);

    // 프리셋 칩
    const PresetChips = useMemo(() => {
        if (text || isLoading) return null;
        return (
            <div className="ea-presets">
                {presets.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        className="ea-chip"
                        onClick={() => setText(p.text)}
                        aria-label={`${p.label} 예시 적용`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        );
    }, [presets, text, isLoading, setText]);

    // 고급 옵션 패널
    const AdvancedOptionsPanel = useMemo(() => {
        if (!showAdvancedOptions || isLoading) return null;
        return (
            <div className="ea-advanced-panel">
                <div className="ea-option-group">
                    <label className="ea-option-label">분석 깊이</label>
                    <select
                        value={analysisDepth}
                        onChange={(e) => setAnalysisDepth(e.target.value)}
                        className="ea-select"
                    >
                        <option value="quick">빠른 분석</option>
                        <option value="standard">표준 분석</option>
                        <option value="deep">심화 분석</option>
                    </select>
                </div>

                <div className="ea-option-group">
                    <label className="ea-option-label">분석 초점</label>
                    <select
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        className="ea-select"
                    >
                        <option value="overall">전체적</option>
                        <option value="relationships">인간관계</option>
                        <option value="work">업무/학업</option>
                        <option value="personal">개인적</option>
                    </select>
                </div>

                <div className="ea-option-group">
                    <label className="ea-checkbox-label">
                        <input
                            type="checkbox"
                            checked={showWordCloud}
                            onChange={(e) => setShowWordCloud(e.target.checked)}
                            className="ea-checkbox"
                        />
                        워드클라우드 포함
                    </label>
                </div>
            </div>
        );
    }, [showAdvancedOptions, isLoading, analysisDepth, focusArea, showWordCloud]);

    // 텍스트 통계 패널
    const TextStatsPanel = useMemo(() => {
        if (!text) return null;
        return (
            <div className="ea-stats-panel">
                <div className="ea-stats-item">
                    <span className="ea-stats-label">글자수</span>
                    <span className="ea-stats-value">{textLength}</span>
                </div>
                <div className="ea-stats-item">
                    <span className="ea-stats-label">단어수</span>
                    <span className="ea-stats-value">{textStats.words}</span>
                </div>
                <div className="ea-stats-item">
                    <span className="ea-stats-label">문장수</span>
                    <span className="ea-stats-value">{textStats.sentences}</span>
                </div>
                <div className="ea-stats-item">
                    <span className="ea-stats-label">평균 단어/문장</span>
                    <span className="ea-stats-value">{textStats.avgWordsPerSentence}</span>
                </div>
            </div>
        );
    }, [text, textLength, textStats]);

    // 툴바 (다크모드/전체화면 버튼 제거)
    const Toolbar = useMemo(() => (
        <div className="ea-toolbar">
            <div className="ea-toolbar-group">
                <button
                    type="button"
                    className={`ea-toolbar-btn ${showAdvancedOptions ? 'active' : ''}`}
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    title="고급 옵션"
                >
                    ⚙️
                </button>

                <button
                    type="button"
                    className="ea-toolbar-btn"
                    onClick={reset}
                    title="초기화"
                    disabled={isLoading}
                >
                    🔄
                </button>
            </div>

            {result && (
                <div className="ea-toolbar-group">
                    <button
                        type="button"
                        className="ea-toolbar-btn"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                        title="결과 복사"
                    >
                        📋
                    </button>

                    <button
                        type="button"
                        className="ea-toolbar-btn"
                        onClick={() => {
                            const data = new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'});
                            const url = URL.createObjectURL(data);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `emotion-analysis-${new Date().toISOString().slice(0, 10)}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                        }}
                        title="결과 다운로드"
                    >
                        💾
                    </button>
                </div>
            )}
        </div>
    ), [showAdvancedOptions, isLoading, result, reset]);

    // 모달 표시 여부
    const isModal = mode === 'modal';
    const isVisible = isModal ? !!isOpen : true;
    if (!isVisible) return null;

    const content = (
        <div className="emotion-container" aria-live="polite">
            {Toolbar}
            {PresetChips}
            {AdvancedOptionsPanel}
            {TextStatsPanel}

            <AnalysisCard
                text={text}
                setText={setText}
                isLoading={isLoading}
                onAnalyze={showAdvancedOptions ? handleEnhancedAnalyze : handleAnalyze}
                result={result}
                onClose={handleClose}
                showCloseButton={isModal}
                analyzeDisabled={analyzeDisabled}
                history={analysisHistory}
                onClearHistory={clearHistory}
                onRemoveHistory={removeHistoryItem}
                compareWithPrevious={compareWithPrevious}
            />
        </div>
    );

    if (isModal) {
        return (
            <div className="emotion-modal-backdrop" onClick={handleClose} role="presentation">
                <div
                    className="emotion-modal-content"
                    role="dialog"
                    aria-modal="true"
                    aria-label="감정 분석"
                    onClick={(e) => e.stopPropagation()}
                >
                    {content}
                </div>
            </div>
        );
    }

    return <div className="emotion-page">{content}</div>;
}
