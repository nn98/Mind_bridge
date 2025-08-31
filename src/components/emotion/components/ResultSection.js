import ProgressBar from './ProgressBar';

export default function ResultSection({ result }) {
    if (!result) return null;

    const entries = Object.entries(result.percentages || {}).sort(([, a], [, b]) => b - a);

    return (
        <div className="results-section">
            <h2 className="results-title">분석 결과</h2>

            {entries.length > 0 && (
                <div className="progress-bars-container">
                    {entries.map(([emotion, value]) => (
                        <ProgressBar key={emotion} emotion={emotion} value={value} />
                    ))}
                </div>
            )}

            <div className={`result-message-box ${result.dominantEmotion}`}>
                <p className="result-message-text">{result.message}</p>
            </div>
        </div>
    );
}
