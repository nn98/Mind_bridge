import React from 'react';
import ResultSection from './ResultSection';

export default function AnalysisCard({
    text,
    setText,
    isLoading,
    onAnalyze,
    result,
    onClose,           // 모달에서만 사용
    showCloseButton,   // 모달 여부
}) {
    return (
        <div className="analysis-card">
            {showCloseButton && (
                <button onClick={onClose} id="emotion-modal-close-btn" aria-label="닫기">
                    &times;
                </button>
            )}

            <h1 className="analysis-title">마음 상태 분석기</h1>
            <p className="analysis-subtitle">오늘 당신의 마음은 어떤가요? 당신의 이야기를 들려주세요.</p>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="analysis-textarea"
                placeholder="예: 오늘 너무 행복한 하루였어. 친구랑 맛있는 것도 먹고 이야기도 많이 나눴거든."
            />

            <button
                onClick={onAnalyze}
                disabled={isLoading || !text.trim()}
                className="analysis-button"
                type="button"
            >
                {isLoading ? <span>분석 중...</span> : '마음 분석하기'}
            </button>

            {isLoading && (
                <div className="loading-spinner-container">
                    <div className="loading-spinner" />
                </div>
            )}

            <ResultSection result={result} />
        </div>
    );
}
