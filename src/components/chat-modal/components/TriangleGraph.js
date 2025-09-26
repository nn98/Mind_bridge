// src/components/TriangleGraph.js
import {useMemo} from "react";

export default function TriangleGraph({
                                          depression = 0,
                                          addiction = 0,
                                          anxiety = 0,
                                          size = 200,
                                          showLabels = true,
                                          compact = false,
                                      }) {
    // ✅ 값 보정 (0~100, 정수 유지)
    const {A, B, C} = useMemo(() => {
        const A = clamp(depression);
        const B = clamp(addiction);
        const C = clamp(anxiety);
        return {A, B, C};
    }, [depression, addiction, anxiety]);

    const pad = 24;
    const w = size, h = size;

    // 꼭짓점 (위: Anxiety, 좌: Depression, 우: Addiction)
    const Ax = w / 2, Ay = pad;
    const Bx = pad, By = h - pad;
    const Cx = w - pad, Cy = h - pad;

    // 중심점
    const cx = w / 2, cy = h / 2;

    // ✅ 로그 스케일 적용
    const ratioA = logScale(A);
    const ratioB = logScale(B);
    const ratioC = logScale(C);

    // 좌표 계산
    const pAx = lerp(cx, Ax, ratioA);
    const pAy = lerp(cy, Ay, ratioA);
    const pBx = lerp(cx, Bx, ratioB);
    const pBy = lerp(cy, By, ratioB);
    const pCx = lerp(cx, Cx, ratioC);
    const pCy = lerp(cy, Cy, ratioC);

    const labelCls = compact ? "tri-label small" : "tri-label";
    const pctCls = compact ? "tri-pct small" : "tri-pct";

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="triangle-graph">
            {/* 외곽 삼각형 */}
            <polygon
                points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`}
                className="tri-outline"
            />

            {/* 내부 데이터 영역 */}
            <polygon
                points={`${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`}
                className="tri-area"
            />

            {/* 꼭짓점 값 표시 */}
            {showLabels && (
                <>
                    <text x={Ax} y={Ay - 6} textAnchor="middle" className={labelCls}>불안감</text>
                    <text x={Bx - 8} y={By + 16} textAnchor="end" className={labelCls}>우울증</text>
                    <text x={Cx + 8} y={Cy + 16} textAnchor="start" className={labelCls}>중독</text>

                    <text x={Ax} y={Ay + 14} textAnchor="middle" className={pctCls}>{A}%</text>
                    <text x={Bx + 4} y={By - 6} textAnchor="start" className={pctCls}>{B}%</text>
                    <text x={Cx - 4} y={Cy - 6} textAnchor="end" className={pctCls}>{C}%</text>
                </>
            )}
        </svg>
    );
}

/* ===== 유틸 함수 ===== */
function clamp(v) {
    v = Number(v) || 0;
    if (v < 0) return 0;
    if (v > 100) return 100;
    return Math.round(v); // ✅ 정수로 반올림
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function logScale(v) {
    const value = Math.max(Number(v) || 0, 0.0001); // ✅ 최소값 낮춤
    return Math.log10(value + 1) / Math.log10(101);
}
