// src/components/emotion/components/AnalysisCard.jsx
import React, {useMemo, useState} from 'react';
import ResultSection from './ResultSection';

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
        happiness: '🟨',
        sadness: '🟦',
        anger: '🟥',
        anxiety: '🟪',
        calmness: '🟩',
    };
    const LABEL = {
        happiness: '행복',
        sadness: '슬픔',
        anger: '분노',
        anxiety: '불안',
        calmness: '평온',
    };

    const diff = useMemo(
        () => (typeof compareWithPrevious === 'function' ? compareWithPrevious() : null),
        [compareWithPrevious]
    );

    const disabled =
        typeof analyzeDisabled === 'boolean' ? analyzeDisabled : isLoading || !text?.trim();

    return (
        <div className="analysis-card">
            {showCloseButton && (
                <button onClick={onClose} id="emotion-modal-close-btn" aria-label="닫기">
                    &times;
                </button>
            )}

            <h1 className="analysis-title">마음 상태 분석기</h1>
            <p className="analysis-subtitle">오늘 당신의 마음은 어떤가요? 당신의 이야기를 들려주세요.</p>

            {/* 입력 영역 - wrapper 추가로 안정화 */}
            <div className="analysis-textarea-wrapper">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="analysis-textarea"
                    placeholder="예: 오늘 너무 행복한 하루였어. 친구랑 맛있는 것도 먹고 이야기도 많이 나눴거든."
                    aria-label="감정 분석 입력"
                    rows={5}
                />
            </div>

            <div className="analysis-actions">
                <button
                    onClick={onAnalyze}
                    disabled={disabled}
                    className="analysis-button"
                    type="button"
                >
                    {isLoading ? (
                        <span className="typing-dots" aria-live="polite">
              AI 응답 생성 중
            </span>
                    ) : (
                        '마음 분석하기'
                    )}
                </button>

                {/* 히스토리 토글: 열려 있거나 항목이 있을 때는 항상 보이도록 */}
                {(openHistory || (history?.length ?? 0) > 0) && (
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

            {/* KPI 헤더: 가로 배치 */}
            {result && (
                <div className="kpi-header kpi-horizontal" role="region" aria-label="분석 요약">
                    <div className="kpi-dominant">
            <span className="kpi-emoji" aria-hidden>
              {EMOJI[result.dominantEmotion] || '🧠'}
            </span>
                        <div className="kpi-texts">
                            <div className="kpi-label">지배 감정</div>
                            <div className="kpi-value">
                                {LABEL[result.dominantEmotion] || result.dominantEmotion}
                                {' · '}
                                {result.percentages?.[result.dominantEmotion] ?? 0}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 이전 결과와 비교(있을 때만) */}
            {result && diff && (
                <div className="diff-strip" role="region" aria-label="이전 결과와 비교">
                    {Object.entries(result.percentages).map(([k, v]) => {
                        const dRaw = Number(diff[k] ?? 0);
                        const d = Math.round(dRaw * 10) / 10;       // 소수 1자리
                        const now = Math.round(Number(v) * 10) / 10; // 소수 1자리
                        const sign = d > 0 ? '+' : d < 0 ? '−' : '±';
                        return (
                            <div className="diff-item" key={k} title={`${LABEL[k] || k} 변화`}>
                                <span className="diff-key">{LABEL[k] || k}</span>
                                <span className={`diff-val ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
            {sign}{Math.abs(d)}%
          </span>
                                <span className="diff-sep">→</span>
                                <span className="diff-now">{now}%</span>
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
                        {/* 🔥 변경: 액션 컨테이너와 클래스명 */}
                        <div className="ea-history-actions">
                            {typeof onClearHistory === 'function' && (
                                <button type="button" className="ea-clear-all-btn" onClick={onClearHistory}>
                                    전체 삭제
                                </button>
                            )}
                        </div>
                    </div>

                    <ul className="history-list">
                        {history.map((h) => (
                            <li className="history-item" key={h.createdAt}>
                                <div className="history-main">
                  <span className="history-emoji" aria-hidden>
                    {EMOJI[h.dominantEmotion] || '🧠'}
                  </span>
                                    <div className="history-texts">
                                        <div className="history-title">
                                            {LABEL[h.dominantEmotion] || h.dominantEmotion} ·{' '}
                                            {h.percentages?.[h.dominantEmotion] ?? 0}%
                                        </div>
                                        <div className="history-sub">
                                            {new Date(h.createdAt).toLocaleString()} — {h.text?.slice(0, 36) || ''}
                                        </div>
                                    </div>
                                </div>

                                {/* 🔥 변경: 개별 삭제 버튼 클래스명 */}
                                {typeof onRemoveHistory === 'function' && (
                                    <button
                                        type="button"
                                        className="ea-remove-item-btn"
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