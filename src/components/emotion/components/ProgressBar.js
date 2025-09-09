import {emotionNames} from '../../emotion/constants/emotionTexts';

/**
 * 감정별 ProgressBar
 * - 색상/이모지 적용
 * - 접근성(aria) 속성 추가
 * - 값 표시 방식 개선
 */
export default function ProgressBar({emotion, value}) {
    const v = Number(value) || 0;
    const safeV = Math.max(0, Math.min(100, v));

    // 감정별 색상/이모지 매핑
    const COLORS = {
        happiness: '#facc15', // 노랑
        sadness: '#3b82f6',   // 파랑
        anger: '#ef4444',     // 빨강
        anxiety: '#a855f7',   // 보라
        calmness: '#22c55e',  // 초록
    };
    const EMOJI = {
        happiness: '🟨',
        sadness: '🟦',
        anger: '🟥',
        anxiety: '🟪',
        calmness: '🟩',
    };

    return (
        <div className="progress-bar" role="group" aria-label={`${emotionNames[emotion] ?? emotion} 비율`}>
            <div className="progress-bar-label">
        <span className="progress-bar-emotion-name">
          {EMOJI[emotion] || '🧠'} {emotionNames[emotion] ?? emotion}
        </span>
                <span className="progress-bar-percentage">{safeV.toFixed(1)}%</span>
            </div>
            <div className="progress-bar-track" aria-hidden>
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${safeV}%`,
                        backgroundColor: COLORS[emotion] || '#6b7280',
                    }}
                >
                    {safeV > 15 && <span className="progress-bar-inline">{safeV.toFixed(1)}%</span>}
                </div>
            </div>
        </div>
    );
}
