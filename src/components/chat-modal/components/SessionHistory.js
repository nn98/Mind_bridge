import React, { useEffect, useState } from 'react';

const SessionHistory = ({ userId }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchHistory = async () => {
            try {
                // TODO: 실제 API로 교체 가능
                setTimeout(() => {
                    setHistory([
                        { id: 1, date: '2025-07-25', summary: '첫 상담: 현재 느끼는 불안감에 대해 이야기함.' },
                        { id: 2, date: '2025-07-18', summary: '대인관계 스트레스 관련 상담 진행.' },
                    ]);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error("상담 이력 조회에 실패했습니다:", error);
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [userId]);

    if (isLoading) return <p>상담 이력을 불러오는 중...</p>;

    return (
        <div className="session-history">
            <h4>상담 이력</h4>
            {history.length > 0 ? (
                <ul>
                    {history.map(item => (
                        <li key={item.id}>
                            <span className="history-date">{item.date}</span>
                            <p className="history-summary">{item.summary}</p>
                        </li>
                    ))}
                </ul>
            ) : <p>진행된 상담 내역이 없습니다.</p>}
        </div>
    );
};

export default SessionHistory;
