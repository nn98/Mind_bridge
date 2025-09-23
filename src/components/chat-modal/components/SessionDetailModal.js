import TriangleGraph from "./TriangleGraph";
import PolygonGraph from "./PolygonGraph";   // ✅ 감정 다각형 그래프
import styles from "./SessionDetailModal.module.css";

export default function SessionDetailModal({open, onClose, session}) {
    if (!open || !session) return null;

    const m = session.riskFactors ?? {};
    const d = m.depression ?? 0;
    const a = m.addiction ?? 0;
    const x = m.anxiety ?? 0;

    const emotions = session.emotions ?? {};

    return (
        <div className={`${styles.modalBackdrop} ${styles.fadeIn}`} onClick={onClose}>
            <div className={`${styles.modalCard} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <h4>세션 상세</h4>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalMeta}>
                    <div><b>일시</b> {formatDate(session.createdAt)}</div>
                    <div><b>위험도</b> {Math.round(session.primaryRisk ?? 0)}%</div>
                </div>

                {/* ✅ 첫 번째 그래프: 3지표 위험도 - 크기 대폭 증가 */}
                <div className={styles.modalGraph}>
                    <h5>주요 위험 지표</h5>
                    <TriangleGraph
                        size={450}
                        depression={d}
                        addiction={a}
                        anxiety={x}
                        showLabels
                    />
                </div>

                {/* ✅ 두 번째 그래프: 세션 감정 종합 - 크기 대폭 증가 */}
                <div className={styles.modalGraph}>
                    <h5>세션 감정 종합 분석</h5>
                    <PolygonGraph emotions={emotions} size={450}/>
                    <p style={{marginTop: "1rem", fontSize: "0.9rem", color: "#666", lineHeight: "1.4"}}>
                        ※ 개별 메시지 감정 분석과 종합 세션 분석은 일부 오차가 존재할 수 있습니다.
                    </p>
                </div>

                {/* ✅ 감정 리스트 */}
                <div className={styles.emotionList}>
                    <h5>상담 중 감정 비율</h5>
                    <ul>
                        {Object.entries(emotions).map(([emo, val]) => (
                            <li key={emo}>
                                <b>{emo}</b>
                                <span className={styles.emotionValue}>{val}%</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function formatDate(ts) {
    try {
        const d = new Date(ts);
        const mm = `${d.getMonth() + 1}`.padStart(2, "0");
        const dd = `${d.getDate()}`.padStart(2, "0");
        const hh = `${d.getHours()}`.padStart(2, "0");
        const mi = `${d.getMinutes()}`.padStart(2, "0");
        return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
    } catch {
        return "-";
    }
}