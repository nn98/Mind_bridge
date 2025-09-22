// src/components/SessionList.js
import {useState, useEffect} from "react";
import axios from "axios";
import SessionItem from "./SessionItem";
import SessionDetailModal from "./SessionDetailModal";
import {BACKEND_URL} from "../constants";

const PAGE_SIZE = 5; // 한 페이지당 아이템 개수

export default function SessionList({userId}) {
    const [sessions, setSessions] = useState([]);
    const [sel, setSel] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/chat/sessions`, {
                    withCredentials: true,
                });

                const userSessions = res.data;

                const mapped = userSessions.map((session) => ({
                    sessionId: session.sessionId,
                    emotions: session.emotions,
                    primaryRisk: session.primaryRisk,
                    riskFactors: session.riskFactors,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    protectiveFactors: session.protectiveFactors,
                }));

                setSessions(mapped);
            } catch (err) {
                console.error("세션 불러오기 실패:", err);
            }
        };

        fetchSessions();
    }, [userId]);

    // ⭐ 더미 데이터 (백엔드 없을 때 테스트용)
    // const dummySessions = [
    //   {
    //     sessionId: 1,
    //     primaryRisk: "최근 업무 스트레스와 불면 증상",
    //     protectiveFactors: 65,
    //     riskFactors: { depression: 40, addiction: 20, anxiety: 40 },
    //     createdAt: "2025-09-15T14:30:00Z",
    //   },
    //   {
    //     sessionId: 2,
    //     primaryRisk: "SNS 과사용과 집중력 저하",
    //     protectiveFactors: 45,
    //     riskFactors: { depression: 20, addiction: 60, anxiety: 20 },
    //     createdAt: "2025-09-10T20:15:00Z",
    //   },
    //   {
    //     sessionId: 3,
    //     primaryRisk: "최근 컨디션 양호, 불안감 감소",
    //     protectiveFactors: 25,
    //     riskFactors: { depression: 10, addiction: 15, anxiety: 75 },
    //     createdAt: "2025-09-05T10:00:00Z",
    //   },
    // ];

    // 페이지네이션 계산
    const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
    const paginated = sessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="session-list-card">
            <div className="session-list-head">
                <h4>최근 채팅 세션</h4>
                <span className="muted">{sessions.length}개</span>
            </div>

            <ul className="session-list">
                {paginated.length > 0 ? (
                    paginated.map((session) => (
                        <SessionItem
                            key={session.sessionId}
                            item={session}
                            onClick={() => setSel(session)}
                        />
                    ))
                ) : (
                    <div className="list-empty">세션 내역이 없습니다.</div>
                )}
            </ul>

            {/* 페이지네이션 버튼 */}
            {totalPages > 1 && (
                <div className="pagination">
                    {Array.from({length: totalPages}, (_, idx) => (
                        <button
                            key={idx}
                            className={page === idx + 1 ? "active" : ""}
                            onClick={() => setPage(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            <SessionDetailModal
                open={!!sel}
                onClose={() => setSel(null)}
                sessionId={sel?.sessionId}
            />
        </div>
    );
}
