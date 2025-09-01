import { emotionNames } from '../../emotion/constants/emotionTexts';

export default function ProgressBar({ emotion, value }) {
    const v = Number(value) || 0;
    return (
        <div>
            <div className="progress-bar-label">
                <span className="progress-bar-emotion-name">{emotionNames[emotion] ?? emotion}</span>
                <span className="progress-bar-percentage">{v.toFixed(1)}%</span>
            </div>
            <div className="progress-bar-track">
                <div
                    className={`progress-bar-fill ${emotion}`}
                    style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                >
                    {v > 10 && <span>{v.toFixed(1)}%</span>}
                </div>
            </div>
        </div>
    );
}
