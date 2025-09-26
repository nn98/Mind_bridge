import {useState, useEffect} from "react";
import axios from "axios";
import SessionItem from "./SessionItem";
import {BACKEND_URL} from "../constants";

export default function SessionList({openModal}) {
    const [sessions, setSessions] = useState([]);

    // 페이지네이션 상태
    const [page, setPage] = useState(1);
    const [pageSize] = useState(3); // ✅ 한 페이지당 3개
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/chat/sessions?page=${page}&size=${pageSize}`,
                    {withCredentials: true}
                );

                console.log("세션 응답:", res.data);
                console.log("세션 응답:", JSON.stringify(res.data[1].emotions));

                // case1: { analysis: [...], total: n }
                if (res.data && Array.isArray(res.data.analysis)) {
                    const {analysis, total} = res.data;

                    const userSessions = analysis.map((session) => ({
                        sessionId: session.sessionId,
                        emotions: session.emotions, // ✅ 감정 퍼센트 포함
                        primaryRisk: session.primaryRisk,
                        riskFactors: session.riskFactors,
                        createdAt: session.createdAt,
                        updatedAt: session.updatedAt,
                        protectiveFactors: session.protectiveFactors,
                    }));

                    setSessions(userSessions);
                    setTotal(total ?? analysis.length);
                    return;
                }

                // case2: 응답이 그냥 배열일 경우
                if (Array.isArray(res.data)) {
                    const start = (page - 1) * pageSize;
                    const end = start + pageSize;

                    const userSessions = res.data.map((session) => ({
                        sessionId: session.sessionId,
                        emotions: session.emotions,
                        primaryRisk: session.primaryRisk,
                        riskFactors: session.riskFactors,
                        createdAt: session.createdAt,
                        updatedAt: session.updatedAt,
                        protectiveFactors: session.protectiveFactors,
                    }));

                    setSessions(userSessions.slice(start, end));
                    setTotal(res.data.length);
                    return;
                }

                console.warn("알 수 없는 응답 구조:", res.data);
            } catch (err) {
                console.error("세션 불러오기 실패:", err);
            }
        };

        fetchSessions();
    }, [page, pageSize]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="session-list-card">
            <div className="session-list-head">
                <h4>최근 채팅 세션</h4>
                <span className="muted">
                    {total > 0
                        ? `${pageSize * (page - 1) + 1}-${Math.min(
                            page * pageSize,
                            total
                        )} / ${total}개`
                        : "0개"}
                </span>
            </div>

            <ul className="session-list">
                {sessions.map((session) => (
                    <SessionItem
                        sessionId={session.sessionId}
                        item={session}
                        onClick={(e) => {
                            openModal(session, e)
                        }} // ✅ 세션 전체 선택
                    />
                ))}
            </ul>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                        이전
                    </button>
                    <span className="page-info">{page} / {totalPages}</span>
                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        다음
                    </button>
                </div>
            )}

        </div>
    );
}
