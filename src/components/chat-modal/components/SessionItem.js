// src/components/SessionItem.js
import TriangleGraph from "./TriangleGraph";

export default function SessionItem({item, onClick}) {
    const {createdAt, summary, riskFactor = 0, metrics = {}} = item ?? {};
    const d = metrics.depression ?? 0;
    const a = metrics.addiction ?? 0;
    const x = metrics.anxiety ?? 0;

    return (
        <li className="session-item" onClick={onClick}>
            <div className="item-top">
                <div className="item-title-row">
                    <strong className="item-date">{formatDate(createdAt)}</strong>
                    <span className={`risk-badge ${riskTone(riskFactor)}`}>Risk {Math.round(riskFactor)}%</span>
                </div>
                <p className="item-summary">{summary || "요약 없음"}</p>
            </div>

            {/* 그래프: 수평/수직 어디든 배치 가능. 여기선 오른쪽 미니 뷰 */}
            <div className="item-graph">
                <TriangleGraph
                    size={80}
                    depression={d}
                    addiction={a}
                    anxiety={x}
                    showLabels={true}
                    compact
                />
            </div>
        </li>
    );
}

function formatDate(ts) {
    if (!ts) return "-";
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

function riskTone(v) {
    if (v >= 70) return "danger";
    if (v >= 40) return "warn";
    return "ok";
}
