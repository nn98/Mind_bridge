// src/components/emotion/EmotionAnalysisPage.js
import React, {useEffect, useMemo} from 'react';
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
    // ⬇️ 훅에서 추가 필드까지 전부 받아옵니다.
    const {
        text,
        setText,
        result,
        isLoading,
        handleAnalyze,
        reset,
        analyzeDisabled,
        history: analysisHistory,          // 전역 history와 충돌 피하기
        clearHistory,
        removeHistoryItem,
        compareWithPrevious,
    } = useEmotionAnalysis();

    // ✅ 훅은 항상 동일한 순서로 호출되어야 하므로 early return 이전에 배치 금지
    useEffect(() => {
        if (initialText && !text) setText(initialText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialText]);

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

    // ⬇️ useMemo도 반드시 컴포넌트 최상위에서 호출 (조건부 X)
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

    // 모달이면서 닫힌 상태: 훅 호출은 이미 끝났으니 여기서 렌더만 막기
    const isModal = mode === 'modal';
    const isVisible = isModal ? !!isOpen : true;
    if (!isVisible) return null;

    const content = (
        <div className="emotion-container" aria-live="polite">
            {PresetChips}
            <AnalysisCard
                text={text}
                setText={setText}
                isLoading={isLoading}
                onAnalyze={handleAnalyze}
                result={result}
                onClose={handleClose}
                showCloseButton={isModal}

                // ⬇️ 추가 props 전달 (정의 안 됐다는 에러 해결)
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
            <div
                className="emotion-modal-backdrop"
                onClick={handleClose}
                role="presentation"
            >
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
