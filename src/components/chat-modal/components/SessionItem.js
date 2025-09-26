import PolygonGraph from "./PolygonGraph";

export default function SessionItem({sessionId, item, onClick}) {
    const {
        createdAt,
        primaryRisk = 0,
        emotions = {},
    } = item ?? {};

    return (
        <li className="session-item" onClick={onClick}>
            <div className="item-top">
                <div className="item-title-row">
                    <strong className="item-date">{formatDate(createdAt)}</strong>
                </div>

                {/* primaryRisk 기반으로 위험 레벨 표시 */}
                <div className={`risk-badge ${riskTone(primaryRisk)}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {renderTextWithLineBreaks(removeSpecialChars(primaryRisk))}
                </div>
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

function removeSpecialChars(text) {
    if (!text) return "";

    // 특수문자 제거 (한글, 영문, 숫자, 공백, 쉼표만 남김)
    return text.toString().replace(/[^\w\s,ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
}

function renderTextWithLineBreaks(text) {
    if (!text) return "";

    // 쉼표를 기준으로 분할하고 각 줄을 <div>로 래핑
    const items = text
        .split(',')
        .map((item, index) => item.trim())
        .filter(item => item.length > 0);

    // 3개 이상이면 처음 2개만 보여주고 ...을 추가
    if (items.length >= 3) {
        return (
            <>
                {items.slice(0, 2).map((item, index) => (
                    <div key={index}>{item}</div>
                ))}
                <div style={{ color: 'lightgray' }}>전체보기</div>
            </>
        );
    }

    // 3개 미만이면 모든 항목 표시
    return items.map((item, index) => (
        <div key={index}>{item}</div>
    ));
}