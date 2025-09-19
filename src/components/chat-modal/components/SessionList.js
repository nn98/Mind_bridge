// src/components/SessionList.js
import { useState ,useEffect } from "react";
import axios from "axios";
import SessionItem from "./SessionItem";
import SessionDetailModal from "./SessionDetailModal";
import { BACKEND_URL } from "../constants";

export default function SessionList({ userId }) {

    const [sessions, setSessions] = useState([]);
    const [sel, setSel] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => { 
            try {
                const res = await axios.get(`${BACKEND_URL}/api/users/account`, {
                    withCredentials: true, // ✅ UserProfile과 동일하게 쿠키 기반 인증 유지
                });

                const riskAssessments = res.data.riskAssessments || [];

                const mapped = riskAssessments.map((it) => ({
                    id: it.sessionId,
                    createdAt: it.createdAt,
                    summary: it.riskFactors,
                    riskFactor: 0, // 필요하다면 백엔드에서 추가
                    metrics: {},   // 필요시 확장
                }));

                setSessions(mapped);
            } catch (err) {
                console.error("세션 불러오기 실패:", err);
            }
        };

        fetchSessions();
    }, []);

    // ⭐ 더미 데이터
    const dummySessions = [
        {
            id: 1,
            createdAt: "2025-09-15T14:30:00Z",
            summary: "최근 업무 스트레스와 불면 증상",
            riskFactor: 65,
            metrics: { depression: 40, addiction: 20, anxiety: 40 },
        },
        {
            id: 2,
            createdAt: "2025-09-10T20:15:00Z",
            summary: "SNS 과사용과 집중력 저하",
            riskFactor: 45,
            metrics: { depression: 20, addiction: 60, anxiety: 20 },
        },
        {
            id: 3,
            createdAt: "2025-09-05T10:00:00Z",
            summary: "최근 컨디션 양호, 불안감 감소",
            riskFactor: 25,
            metrics: { depression: 10, addiction: 15, anxiety: 75 },
        },
    ];



    return (
        <div className="session-list-card">
            <div className="session-list-head">
                <h4>최근 채팅 세션</h4>
                <span className="muted">{sessions.length}개</span>
            </div>

            <ul className="session-list">
                {sessions.map((it) => (
                    <SessionItem key={it.id} item={it} onClick={() => setSel(it)} />
                ))}
            </ul>

            <SessionDetailModal open={!!sel} onClose={() => setSel(null)} sessionId={sel?.id} />
        </div>
    );
}
