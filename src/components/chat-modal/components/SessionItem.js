// src/components/SessionItem.js
import PolygonGraph from "./PolygonGraph";

export default function SessionItem({item, onClick}) {
    const {createdAt, primaryRisk = "", protectiveFactors = 0, emotions = {}} = item ?? {};

    return (
        <li className="session-item" onClick={onClick}>
            <div className="item-top">
                <div className="item-title-row">
                    <strong className="item-date">{formatDate(createdAt)}</strong>
                </div>

                <span className={`risk-badge ${riskTone(protectiveFactors)}`}>
                    {primaryRisk || "위험 없음"}
                </span>
            </div>

            {/* 다각형 감정 그래프 */}
            <div className="item-graph">
                <PolygonGraph
                    size={120}
                    emotions={emotions}
                    showLabels={true}
                    compact={true}
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
        return `${mm}/${dd}`;
    } catch {
        return "-";
    }
}

function riskTone(v) {
    if (v >= 70) return "danger";
    if (v >= 40) return "warn";
    return "ok";
}
