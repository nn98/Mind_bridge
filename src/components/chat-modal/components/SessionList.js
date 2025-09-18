// src/components/SessionList.js
import {useState} from "react";
import SessionItem from "./SessionItem";
import SessionDetailModal from "./SessionDetailModal";

export default function SessionList({userId}) {
    // ⭐ 더미 데이터
    const dummySessions = [
        {
            id: 1,
            createdAt: "2025-09-15T14:30:00Z",
            summary: "최근 업무 스트레스와 불면 증상",
            riskFactor: 65,
            metrics: {depression: 40, addiction: 20, anxiety: 40},
        },
        {
            id: 2,
            createdAt: "2025-09-10T20:15:00Z",
            summary: "SNS 과사용과 집중력 저하",
            riskFactor: 45,
            metrics: {depression: 20, addiction: 60, anxiety: 20},
        },
        {
            id: 3,
            createdAt: "2025-09-05T10:00:00Z",
            summary: "최근 컨디션 양호, 불안감 감소",
            riskFactor: 25,
            metrics: {depression: 10, addiction: 15, anxiety: 75},
        },
    ];

    const [sel, setSel] = useState(null);

    return (
        <div className="session-list-card">
            <div className="session-list-head">
                <h4>최근 채팅 세션</h4>
                <span className="muted">{dummySessions.length}개</span>
            </div>

            <ul className="session-list">
                {dummySessions.map((it) => (
                    <SessionItem key={it.id} item={it} onClick={() => setSel(it)}/>
                ))}
            </ul>

            <SessionDetailModal open={!!sel} onClose={() => setSel(null)} sessionId={sel?.id}/>
        </div>
    );
}
