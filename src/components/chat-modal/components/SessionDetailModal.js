import TriangleGraph from "./TriangleGraph";

export default function SessionDetailModal({open, onClose, session}) {
    if (!open || !session) return null;

    // ✅ props로 받은 session에서 직접 꺼내기
    const m = session.riskFactors ?? {};
    const d = m.depression ?? 0;
    const a = m.addiction ?? 0;
    const x = m.anxiety ?? 0;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h4>세션 상세</h4>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-meta">
                    <div><b>일시</b> {formatDate(session.createdAt)}</div>
                    <div><b>위험도</b> {Math.round(session.primaryRisk ?? 0)}%</div>
                </div>

                <div className="modal-graph">
                    <TriangleGraph
                        size={300}   // ✅ 더 크게
                        depression={d}
                        addiction={a}
                        anxiety={x}
                        showLabels
                    />
                </div>

                {/* ✅ 감정 퍼센트 리스트 */}
                <div className="emotion-list">
                    <h5>상담 중 감정 비율</h5>
                    <ul>
                        {Object.entries(session.emotions ?? {}).map(([emo, val]) => (
                            <li key={emo}>
                                <b>{emo}</b>: {val}%
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
