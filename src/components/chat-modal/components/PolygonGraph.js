import {useMemo} from "react";

export default function PolygonGraph({
                                         emotions = {},
                                         size = 200,
                                         showLabels = true,
                                         compact = false,
                                     }) {
    const graphData = useMemo(() => {
        // 감정 데이터를 배열로 변환하고 정렬
        const emotionEntries = Object.entries(emotions)
            .filter(([key, value]) => key && typeof value === 'number')
            .sort(([a], [b]) => a.localeCompare(b)); // 일관된 순서

        if (emotionEntries.length === 0) {
            return {vertices: [], dataPoints: [], center: {x: size / 2, y: size / 2}};
        }

        const pad = compact ? 20 : 32;
        const center = {x: size / 2, y: size / 2};
        const radius = (size - pad * 2) / 2;
        const angleStep = (2 * Math.PI) / emotionEntries.length;

        const vertices = emotionEntries.map(([emotion, value], index) => {
            // 12시 방향부터 시계방향으로 배치
            const angle = index * angleStep - Math.PI / 2;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);

            return {
                emotion,
                value: clamp(value),
                x,
                y,
                angle,
                labelX: center.x + (radius + (compact ? 12 : 20)) * Math.cos(angle),
                labelY: center.y + (radius + (compact ? 12 : 20)) * Math.sin(angle),
            };
        });

        const dataPoints = vertices.map(vertex => {
            const dataRadius = (vertex.value / 100) * radius;
            return {
                x: center.x + dataRadius * Math.cos(vertex.angle),
                y: center.y + dataRadius * Math.sin(vertex.angle),
                value: vertex.value
            };
        });

        return {vertices, dataPoints, center};
    }, [emotions, size, compact]);

    const {vertices, dataPoints, center} = graphData;

    if (vertices.length === 0) {
        return (
            <div className="polygon-graph empty" style={{width: size, height: size}}>
                <span>감정 데이터 없음</span>
            </div>
        );
    }

    // 외곽선 점들을 문자열로 변환
    const outlinePoints = vertices.map(v => `${v.x},${v.y}`).join(' ');
    const dataAreaPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    const labelClass = compact ? "poly-label small" : "poly-label";
    const valueClass = compact ? "poly-value small" : "poly-value";

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="polygon-graph"
        >
            {/* 배경 격자선 (중심에서 각 꼭짓점으로) */}
            {vertices.map((vertex, index) => (
                <line
                    key={`axis-${index}`}
                    x1={center.x}
                    y1={center.y}
                    x2={vertex.x}
                    y2={vertex.y}
                    className="poly-axis"
                />
            ))}

            {/* 외곽 다각형 */}
            <polygon
                points={outlinePoints}
                className="poly-outline"
            />

            {/* 데이터 영역 다각형 */}
            {dataPoints.length > 0 && (
                <polygon
                    points={dataAreaPoints}
                    className="poly-area"
                />
            )}

            {/* 데이터 포인트 점들 */}
            {dataPoints.map((point, index) => (
                <circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={compact ? 2 : 3}
                    className="poly-point"
                />
            ))}

            {/* 라벨과 값 표시 */}
            {showLabels && vertices.map((vertex, index) => (
                <g key={`label-${index}`}>
                    <text
                        x={vertex.labelX}
                        y={vertex.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={labelClass}
                    >
                        {vertex.emotion}
                    </text>
                    <text
                        x={vertex.labelX}
                        y={vertex.labelY + (compact ? 10 : 14)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={valueClass}
                    >
                        {vertex.value}%
                    </text>
                </g>
            ))}

            {/* 중심점 */}
            <circle
                cx={center.x}
                cy={center.y}
                r={compact ? 1 : 2}
                className="poly-center"
            />
        </svg>
    );
}

function clamp(v) {
    const num = Number(v) || 0;
    if (num < 0) return 0;
    if (num > 100) return 100;
    return Math.round(num);
}
