// src/components/SessionDetailModal.js
import TriangleGraph from "./TriangleGraph";

export default function SessionDetailModal({open, onClose, sessionId}) {
    if (!open) return null;

    // ⭐ 더미 상세 데이터 (id에 따라 분기)
    const dummyDetails = {
        1: {
            id: 1,
            createdAt: "2025-09-15T14:30:00Z",
            summary: "최근 업무 스트레스와 불면 증상",
            notes: "업무 부담을 줄이고 수면 패턴 개선 필요",
            riskFactor: 65,
            metrics: {depression: 40, addiction: 20, anxiety: 40},
        },
        2: {
            id: 2,
            createdAt: "2025-09-10T20:15:00Z",
            summary: "SNS 과사용과 집중력 저하",
            notes: "SNS 사용 시간을 줄이고 운동 권장",
            riskFactor: 45,
            metrics: {depression: 20, addiction: 60, anxiety: 20},
        },
        3: {
            id: 3,
            createdAt: "2025-09-05T10:00:00Z",
            summary: "최근 컨디션 양호, 불안감 감소",
            notes: "긍정적인 변화가 지속되도록 유지 권장",
            riskFactor: 25,
            metrics: {depression: 10, addiction: 15, anxiety: 75},
        },
    };

    const data = dummyDetails[sessionId];
    if (!data) return null;

    const m = data.metrics ?? {};
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
                    <div><b>일시</b> {formatDate(data.createdAt)}</div>
                    <div><b>Risk</b> {Math.round(data.riskFactor)}%</div>
                    <div><b>요약</b> {data.summary}</div>
                </div>

                <div className="modal-graph">
                    <TriangleGraph size={220} depression={d} addiction={a} anxiety={x} showLabels/>
                </div>

                <div className="modal-notes">
                    <h5>상담 메모</h5>
                    <p>{data.notes}</p>
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
