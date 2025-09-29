import axios from "axios";
import {BACKEND_URL} from "../constants";
import TriangleGraph from "./TriangleGraph";
import PolygonGraph from "./PolygonGraph";
import styles from "./SessionDetailModal.module.css";
import {useEffect, useState} from "react";

// 특수문자 제거 함수
function removeSpecialChars(text) {
    if (!text) return "";
    return text.toString().replace(/[^\w\s,ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
}

// ✅ riskFactors 안전 파싱 함수
function parseRiskFactors(riskFactors) {
    try {
        if (!riskFactors) return {addiction: 0, depression: 0, anxiety: 0};
        if (typeof riskFactors === "string") {
            return JSON.parse(riskFactors);
        }
        return riskFactors; // 이미 객체일 경우
    } catch (e) {
        console.error("riskFactors 파싱 실패:", e);
        return {addiction: 0, depression: 0, anxiety: 0};
    }
}

export default function SessionDetailModal({open, onClose, session}) {
    const [emotionData, setEmotionData] = useState([]);
    const [emotionStats, setEmotionStats] = useState(null);

    const processEmotionData = (messages) => {
        console.log("세션 상세 응답:", messages);

        if (!Array.isArray(messages)) {
            console.error('messages가 배열이 아닙니다:', messages);
            return;
        }

        const userEmotions = messages
            .filter(message => message.messageType?.toUpperCase() === 'USER')
            .map((message, index) => {
                let parsedEmotions = null;

                if (typeof message.emotion === 'string' && message.emotion.trim()) {
                    try {
                        const emotionPairs = message.emotion.split(', ');
                        const emotionObj = {};
                        emotionPairs.forEach(pair => {
                            const [emotion, percentage] = pair.split(': ');
                            if (emotion && percentage) {
                                emotionObj[emotion.trim()] = parseInt(percentage.replace('%', '').trim());
                            }
                        });
                        parsedEmotions = emotionObj;
                    } catch (error) {
                        console.warn('감정 파싱 실패:', message.emotion);
                    }
                }

                return {
                    messageIndex: index + 1,
                    emotions: parsedEmotions,
                    createdAt: message.createdAt,
                    content: message.messageContent?.substring(0, 50) || ""
                };
            })
            .filter(item => item.emotions !== null);

        setEmotionData(userEmotions);
        const stats = calculateEmotionStats(userEmotions);
        setEmotionStats(stats);

        return userEmotions;
    };

    const fetchSessions = async (sessionId) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/chat/messages/${sessionId}`, {
                withCredentials: true
            });
            processEmotionData(res.data.data || []);
        } catch (error) {
            console.error('세션 불러오기 실패:', error);
        }
    };

    const calculateEmotionStats = (emotionDataArray) => {
        if (!emotionDataArray || emotionDataArray.length === 0) {
            return null;
        }

        const emotionTotals = {};
        const emotionCounts = {};

        emotionDataArray.forEach(item => {
            Object.entries(item.emotions).forEach(([emotion, percentage]) => {
                if (!emotionTotals[emotion]) {
                    emotionTotals[emotion] = 0;
                    emotionCounts[emotion] = 0;
                }
                emotionTotals[emotion] += percentage;
                emotionCounts[emotion]++;
            });
        });

        const emotionAverages = {};
        Object.keys(emotionTotals).forEach(emotion => {
            emotionAverages[emotion] = Math.round(emotionTotals[emotion] / emotionCounts[emotion]);
        });

        const highestEmotion = Object.entries(emotionAverages)
            .reduce((max, [emotion, percentage]) =>
                    percentage > max.percentage ? {emotion, percentage} : max,
                {emotion: '', percentage: 0}
            );

        return {
            averages: emotionAverages,
            highest: highestEmotion,
            totalMessages: emotionDataArray.length
        };
    };

    // ✅ 감정 변화 그래프 (코드는 그대로 유지)
    const EmotionProgressGraph = ({data}) => {
        if (!data || data.length === 0) return null;

        const maxValue = 100;
        const graphWidth = 600;
        const graphHeight = 320;
        const padding = 60;

        const emotionKeys = ['기쁨', '슬픔', '분노', '불안', '피곤'];
        const colors = {
            '기쁨': '#10b981',
            '슬픔': '#3b82f6',
            '분노': '#ef4444',
            '불안': '#f59e0b',
            '피곤': '#8b5cf6'
        };

        const gradientDefs = emotionKeys.map(emotionKey => (
            <defs key={`gradient-${emotionKey}`}>
                <linearGradient id={`gradient-${emotionKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors[emotionKey]} stopOpacity="0.4"/>
                    <stop offset="100%" stopColor={colors[emotionKey]} stopOpacity="0.05"/>
                </linearGradient>
            </defs>
        ));

        return (
            <div className={styles.emotionGraphContainer}>
                <svg width={graphWidth} height={graphHeight} className={styles.emotionSvg}>
                    {gradientDefs}
                    {/* 배경 그리드 */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <g key={y}>
                            <line
                                x1={padding}
                                y1={graphHeight - padding - (y * (graphHeight - padding * 2) / maxValue)}
                                x2={graphWidth - padding}
                                y2={graphHeight - padding - (y * (graphHeight - padding * 2) / maxValue)}
                                stroke="#f1f5f9"
                                strokeWidth={1}
                                strokeDasharray={y === 0 ? "none" : "4,4"}
                            />
                            <text
                                x={padding - 15}
                                y={graphHeight - padding - (y * (graphHeight - padding * 2) / maxValue) + 4}
                                fontSize="12"
                                fill="#64748b"
                                textAnchor="end"
                                fontWeight="500"
                            >
                                {y}%
                            </text>
                        </g>
                    ))}

                    {/* 영역 그래프 */}
                    {emotionKeys.map(emotionKey => {
                        const hasData = data.some(item => (item.emotions[emotionKey] || 0) > 0);
                        if (!hasData) return null;

                        let pathData = `M ${padding} ${graphHeight - padding}`;

                        data.forEach((item, index) => {
                            const x = padding + (index * (graphWidth - padding * 2) / (data.length - 1 || 1));
                            const value = item.emotions[emotionKey] || 0;
                            const y = graphHeight - padding - (value * (graphHeight - padding * 2) / maxValue);
                            pathData += ` L ${x} ${y}`;
                        });

                        pathData += ` L ${graphWidth - padding} ${graphHeight - padding} Z`;

                        return (
                            <path
                                key={`area-${emotionKey}`}
                                d={pathData}
                                fill={`url(#gradient-${emotionKey})`}
                                stroke="none"
                            />
                        );
                    })}

                    {/* 라인 그래프 */}
                    {emotionKeys.map(emotionKey => {
                        const points = data.map((item, index) => {
                            const x = padding + (index * (graphWidth - padding * 2) / (data.length - 1 || 1));
                            const value = item.emotions[emotionKey] || 0;
                            const y = graphHeight - padding - (value * (graphHeight - padding * 2) / maxValue);
                            return `${x},${y}`;
                        }).join(' ');

                        const hasData = data.some(item => (item.emotions[emotionKey] || 0) > 0);
                        if (!hasData) return null;

                        return (
                            <g key={`line-${emotionKey}`}>
                                <polyline
                                    points={points}
                                    fill="none"
                                    stroke={colors[emotionKey]}
                                    strokeWidth={3.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                                />
                                {data.map((item, index) => {
                                    const value = item.emotions[emotionKey] || 0;
                                    if (value === 0) return null;

                                    const x = padding + (index * (graphWidth - padding * 2) / (data.length - 1 || 1));
                                    const y = graphHeight - padding - (value * (graphHeight - padding * 2) / maxValue);

                                    return (
                                        <circle
                                            key={`point-${emotionKey}-${index}`}
                                            cx={x}
                                            cy={y}
                                            r={5}
                                            fill={colors[emotionKey]}
                                            stroke="white"
                                            strokeWidth={3}
                                            className={styles.dataPoint}
                                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* X축 라벨 */}
                    {data.map((item, index) => {
                        const x = padding + (index * (graphWidth - padding * 2) / (data.length - 1 || 1));
                        return (
                            <text
                                key={`label-${index}`}
                                x={x}
                                y={graphHeight - 20}
                                fontSize="12"
                                fill="#64748b"
                                textAnchor="middle"
                                fontWeight="500"
                            >
                                {index + 1}
                            </text>
                        );
                    })}
                </svg>

                {/* 범례 */}
                <div className={styles.graphLegend}>
                    {emotionKeys.map(emotionKey => {
                        const hasData = data.some(item => (item.emotions[emotionKey] || 0) > 0);
                        if (!hasData) return null;

                        return (
                            <div key={emotionKey} className={styles.legendItem}>
                                <div
                                    className={styles.legendColor}
                                    style={{backgroundColor: colors[emotionKey]}}
                                />
                                <span>{emotionKey}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (!open || !session) {
            return;
        }
        setEmotionData([]);
        setEmotionStats(null);
        fetchSessions(session.sessionId);
    }, [open, session]);

    if (!open || !session) return null;

    // ✅ riskFactors 안전하게 파싱
    const m = parseRiskFactors(session.riskFactors);
    const d = m.depression ?? 0;
    const a = m.addiction ?? 0;
    const x = m.anxiety ?? 0;
    const emotions = session.emotions ?? {};

    return (
        <div className={`${styles.modalBackdrop} ${styles.fadeIn}`} onClick={onClose}>
            <div className={`${styles.modalCard} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <h4>🔍 세션 상세 분석</h4>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalMeta}>
                    <div>
                        <b>📅 일시</b>
                        <span className={styles.metaValue}>{formatDate(session.createdAt)}</span>
                    </div>
                    <div>
                        <b>⚠️ 주요 증상</b>
                        <span className={styles.metaValue}>
                            {removeSpecialChars(session.primaryRisk) || "정보 없음"}
                        </span>
                    </div>
                    {emotionStats && (
                        <div>
                            <b>💬 분석 메시지</b>
                            <span className={styles.metaValue}>{emotionStats.totalMessages}개</span>
                        </div>
                    )}
                </div>

                {/* ✅ 첫 번째 행: 위험 지표 + 감정 종합 */}
                <div className={styles.graphRow}>
                    <div className={styles.graphHalf}>
                        <h5>🔺 주요 위험 지표</h5>
                        <div className={styles.graphWrapper}>
                            <TriangleGraph
                                size={350}
                                depression={d}
                                addiction={a}
                                anxiety={x}
                                showLabels
                            />
                        </div>
                    </div>

                    <div className={styles.graphHalf}>
                        <h5>🎯 세션 감정 종합</h5>
                        <div className={styles.graphWrapper}>
                            <PolygonGraph emotions={emotions} size={350}/>
                        </div>
                    </div>
                </div>

                {/* ✅ 두 번째 행: 감정 변화 그래프 + 통계 */}
                {emotionData.length > 0 && (
                    <div className={styles.analysisRow}>
                        <div className={styles.graphMain}>
                            <h5>📈 메시지별 감정 변화</h5>
                            <EmotionProgressGraph data={emotionData}/>
                            <p className={styles.graphDescription}>
                                📝 채팅 중 각 메시지에서 분석된 감정의 변화 추이를 보여줍니다
                            </p>

                            <div className={styles.emotionSummary}>
                                <h6>📊 채팅 중 감정 비율 (종합)</h6>
                                <div className={styles.emotionGrid}>
                                    {Object.entries(emotions)
                                        .filter(([, val]) => val > 0)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([emo, val]) => (
                                            <div key={emo} className={styles.emotionItem}>
                                                <span className={styles.emotionLabel}>{emo}</span>
                                                <span className={styles.emotionValue}>{val}%</span>
                                                <div className={styles.emotionBar}>
                                                    <div
                                                        className={styles.emotionBarFill}
                                                        style={{width: `${val}%`}}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.graphSide}>
                            {emotionStats && (
                                <div className={styles.emotionStats}>
                                    <h5>🎲 감정 평균</h5>
                                    <div className={styles.statsGrid}>
                                        {Object.entries(emotionStats.averages)
                                            .filter(([, percentage]) => percentage > 0)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 6)
                                            .map(([emotion, percentage]) => (
                                                <div key={emotion} className={styles.statItem}>
                                                    <div className={styles.statHeader}>
                                                        <span className={styles.statLabel}>{emotion}</span>
                                                        <span className={styles.statValue}>{percentage}%</span>
                                                    </div>
                                                    <div className={styles.statBar}>
                                                        <div
                                                            className={styles.statBarFill}
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: emotion === emotionStats.highest.emotion ? '#10b981' : '#e2e8f0'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <div className={styles.highestEmotion}>
                                        <span className={styles.crownIcon}>👑</span>
                                        <strong>{emotionStats.highest.emotion}</strong>
                                        <span className={styles.percentBadge}>{emotionStats.highest.percentage}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.modalNote}>
                    <span className={styles.noteIcon}>ℹ️</span>
                    개별 메시지 감정 분석과 종합 세션 분석은 일부 오차가 존재할 수 있습니다.
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
