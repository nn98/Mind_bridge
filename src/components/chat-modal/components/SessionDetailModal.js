import TriangleGraph from "./TriangleGraph";
import styles from "./SessionDetailModal.module.css";

export default function SessionDetailModal({open, onClose, session}) {
    if (!open || !session) return null;

    const m = session.riskFactors ?? {};
    const d = m.depression ?? 0;
    const a = m.addiction ?? 0;
    const x = m.anxiety ?? 0;

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

                <div className={styles.modalGraph}>
                    <TriangleGraph
                        size={300}
                        depression={d}
                        addiction={a}
                        anxiety={x}
                        showLabels
                    />
                </div>

                <div className={styles.emotionList}>
                    <h5>상담 중 감정 비율</h5>
                    <ul>
                        {Object.entries(session.emotions ?? {}).map(([emo, val]) => (
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
