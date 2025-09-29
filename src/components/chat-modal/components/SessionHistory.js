import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // 백엔드 주소

const SessionHistory = ({ userEmail }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) return;

        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/chat/sessions`, {
                    params: { email: userEmail },
                    withCredentials: true, // 쿠키 자동 전송
                });
                console.log(JSON.stringify(response));
                setHistory(response.data);
            } catch (error) {
                console.error("채팅 이력 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [userEmail]);

    //if (isLoading) return <p>채팅 이력을 불러오는 중...</p>;

    return (
        <div className="session-history">
            <h4>채팅 이력</h4>
            {history.length > 0 ? (
                <ul>
                    {history.map(item => (
                        <li key={item.counselId}>
                            <span className="history-date">{item.date || "날짜 없음"}</span>
                            <p className="history-summary">{item.userCounsellingSummation}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>진행된 채팅 내역이 없습니다.</p>
            )}
        </div>
    );
};

export default SessionHistory;
