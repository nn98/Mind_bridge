import React, {useMemo, useState} from 'react';
import ResultSection from './ResultSection';

/**
 * Optional props (있으면 사용, 없으면 무시되어 하위 호환 유지)
 * - analyzeDisabled?: boolean
 * - history?: Array<{ createdAt:number, text:string, percentages:Record<string,number>, dominantEmotion:string, confidence:number }>
 * - onClearHistory?: () => void
 * - onRemoveHistory?: (createdAt:number) => void
 * - compareWithPrevious?: () => Record<string, number> | null
 */
export default function AnalysisCard({
                                         text,
                                         setText,
                                         isLoading,
                                         onAnalyze,
                                         result,
                                         onClose,           // 모달에서만 사용
                                         showCloseButton,   // 모달 여부

                                         // 선택 props
                                         analyzeDisabled,
                                         history = [],
                                         onClearHistory,
                                         onRemoveHistory,
                                         compareWithPrevious,
                                     }) {
    const [openHistory, setOpenHistory] = useState(false);

    // 지배 감정 KPI를 위한 이모지/라벨 매핑
    const EMOJI = {
        happiness: '😊',
        sadness: '😢',
        anger: '😡',
        anxiety: '😟',
        calmness: '😌',
    };
    const LABEL = {
        happiness: '행복',
        sadness: '슬픔',
        anger: '분노',
        anxiety: '불안',
        calmness: '평온',
    };

    const diff = useMemo(() => (typeof compareWithPrevious === 'function' ? compareWithPrevious() : null), [compareWithPrevious]);

    const disabled = typeof analyzeDisabled === 'boolean'
        ? analyzeDisabled
        : (isLoading || !text?.trim());

    return (
        <div className="analysis-card">
            {showCloseButton && (
                <button onClick={onClose} id="emotion-modal-close-btn" aria-label="닫기">
                    &times;
                </button>
            )}

            <h1 className="analysis-title">마음 상태 분석기</h1>
            <p className="analysis-subtitle">오늘 당신의 마음은 어떤가요? 당신의 이야기를 들려주세요.</p>

            {/* 입력 영역 */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="analysis-textarea"
                placeholder="예: 오늘 너무 행복한 하루였어. 친구랑 맛있는 것도 먹고 이야기도 많이 나눴거든."
                aria-label="감정 분석 입력"
                rows={5}
            />

            <div className="analysis-actions">
                <button
                    onClick={onAnalyze}
                    disabled={disabled}
                    className="analysis-button"
                    type="button"
                >
                    {isLoading ? <span className="typing-dots" aria-live="polite">AI 응답 생성 중</span> : '마음 분석하기'}
                </button>

                {/* 히스토리 토글(선택) */}
                {history?.length > 0 && (
                    <button
                        type="button"
                        className="history-toggle"
                        onClick={() => setOpenHistory((v) => !v)}
                        aria-expanded={openHistory}
                    >
                        {openHistory ? '히스토리 닫기' : `히스토리 (${history.length})`}
                    </button>
                )}
            </div>

            {/* 로딩 스피너(기존 스타일 유지 가능) */}
            {isLoading && (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"/>
                </div>
            )}

            {/* KPI 헤더 */}
            {result && (
                <div className="kpi-header" role="region" aria-label="분석 요약">
                    <div className="kpi-dominant">
                        <span className="kpi-emoji" aria-hidden>{EMOJI[result.dominantEmotion] || '🧠'}</span>
                        <div className="kpi-texts">
                            <div className="kpi-label">지배 감정</div>
                            <div className="kpi-value">
                                {LABEL[result.dominantEmotion] || result.dominantEmotion}
                                {' · '}
                                {result.percentages?.[result.dominantEmotion] ?? 0}%
                            </div>
                        </div>
                    </div>
                    {typeof result.confidence === 'number' && (
                        <div className="kpi-confidence" title="분포 기반 신뢰도">
                            신뢰도 <strong>{Math.round(result.confidence * 100)}%</strong>
                        </div>
                    )}
                </div>
            )}

            {/* 이전 결과와 비교(있을 때만) */}
            {result && diff && (
                <div className="diff-strip" role="region" aria-label="이전 결과와 비교">
                    {Object.entries(result.percentages).map(([k, v]) => {
                        const d = diff[k] ?? 0;
                        const sign = d > 0 ? '+' : d < 0 ? '−' : '±';
                        return (
                            <div className="diff-item" key={k}>
                                <span className="diff-key">{LABEL[k] || k}</span>
                                <span className={`diff-val ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
                  {sign}{Math.abs(d)}
                </span>
                                <span className="diff-now">{v}%</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 결과 섹션(기존 컴포넌트) */}
            <ResultSection result={result}/>

            {/* 히스토리 패널(선택) */}
            {openHistory && (
                <div className="history-panel" role="region" aria-label="분석 히스토리">
                    <div className="history-head">
                        <strong>최근 결과</strong>
                        <div className="history-head-actions">
                            {typeof onClearHistory === 'function' && (
                                <button type="button" className="history-clear" onClick={onClearHistory}>
                                    전체 삭제
                                </button>
                            )}
                        </div>
                    </div>

                    <ul className="history-list">
                        {history.map((h) => (
                            <li className="history-item" key={h.createdAt}>
                                <div className="history-main">
                                    <span className="history-emoji" aria-hidden>{EMOJI[h.dominantEmotion] || '🧠'}</span>
                                    <div className="history-texts">
                                        <div className="history-title">
                                            {LABEL[h.dominantEmotion] || h.dominantEmotion} · {h.percentages?.[h.dominantEmotion] ?? 0}%
                                        </div>
                                        <div className="history-sub">
                                            {new Date(h.createdAt).toLocaleString()} — {h.text?.slice(0, 36) || ''}
                                        </div>
                                    </div>
                                </div>

                                {typeof onRemoveHistory === 'function' && (
                                    <button
                                        type="button"
                                        className="history-remove"
                                        onClick={() => onRemoveHistory(h.createdAt)}
                                        aria-label="히스토리에서 제거"
                                    >
                                        삭제
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
