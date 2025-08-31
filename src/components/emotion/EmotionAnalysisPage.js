import React from 'react';
import '../../css/EmotionAnalysisPage.css'; // 경로 주의: 상위로 한 단계
import AnalysisCard from './components/AnalysisCard';
import { useEmotionAnalysis } from './hooks/useEmotionAnalysis';

/**
 * mode: "page" | "modal"
 * - "page": 페이지 내부 사용
 * - "modal": 딤+닫기 포함
 */
export default function EmotionAnalysisPage({ mode = 'page', isOpen, onClose }) {
    const { text, setText, result, isLoading, handleAnalyze, reset } = useEmotionAnalysis();

    // 모달 닫기
    const handleClose = () => {
        reset();
        if (typeof onClose === 'function') onClose();
    };

    if (mode === 'modal' && !isOpen) return null;

    const content = (
        <AnalysisCard
            text={text}
            setText={setText}
            isLoading={isLoading}
            onAnalyze={handleAnalyze}
            result={result}
            onClose={handleClose}
            showCloseButton={mode === 'modal'}
        />
    );

    if (mode === 'modal') {
        return (
            <div className="emotion-modal-backdrop" onClick={handleClose}>
                <div className="emotion-modal-content" onClick={(e) => e.stopPropagation()}>
                    {content}
                </div>
            </div>
        );
    }

    return <div className="emotion-page">{content}</div>;
}
