// src/components/SessionItem.js
import TriangleGraph from "./TriangleGraph";

export default function SessionItem({item, onClick}) {
    const {createdAt, primaryRisk = "", protectiveFactors = 0, riskFactors = {}} = item ?? {};
    const depression = riskFactors?.depression ?? 0;
    const addiction = riskFactors?.addiction ?? 0;
    const anxiety = riskFactors?.anxiety ?? 0;

    return (
        <li className="session-item" onClick={onClick}>
            <div className="item-top">
                <div className="item-title-row">
                    <strong className="item-date">{formatDate(createdAt)}</strong>
                    <span className={`risk-badge ${riskTone(protectiveFactors)}`}>Risk {Math.round(protectiveFactors)}%</span>
                </div>
                <p className="item-summary">{primaryRisk || "위험 없음"}</p>
            </div>

            {/* 그래프: 수평/수직 어디든 배치 가능. 여기선 오른쪽 미니 뷰 */}
            <div className="item-graph">
                <TriangleGraph
                    size={120}
                    depression={depression}
                    addiction={addiction}
                    anxiety={anxiety}
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
