import React, { useState } from 'react';
import '../css/NoticeBoard.css';

const NoticeBoard = () => {
    const [notices] = useState([
        {
            id: 1,
            title: '[정기점검] 7월 10일 시스템 점검 안내',
            content: '7월 10일(수) 01:00~03:00 사이 정기 점검이 진행됩니다.',
            date: '2025-07-01',
        },
        {
            id: 2,
            title: '[신규 기능] AI 상담 기록 저장 기능 추가',
            content: '상담 결과를 마이페이지에서 저장할 수 있는 기능이 추가되었습니다.',
            date: '2025-06-28',
        },
        {
            id: 3,
            title: '[이벤트] 자가진단 공유 이벤트 (~7/31)',
            content: '자가진단 결과 공유하면 추첨을 통해 커피 쿠폰 증정!',
            date: '2025-06-25',
        },
        {
            id: 4,
            title: '[위치 기능] 내 주변 병원 위치 확인 기능 추가',
            content:'내 주변 가까운 병원 위치 확인과 간단한 병원 안내 창이 생겼습니다.',
            date: '2025-07-02',
        },
    ]);

    const [selectedNotice, setSelectedNotice] = useState(null);

    return (
        <div className="notice-board">
            <table className="notice-table">
                <thead>
                    <tr>
                        <th>제목</th>
                        <th>날짜</th>
                    </tr>
                </thead>
                <tbody>
                    {notices.map((notice) => (
                        <tr key={notice.id} onClick={() => setSelectedNotice(notice)}>
                            <td>{notice.title}</td>
                            <td>{notice.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedNotice && (
                <div className="notice-detail">
                    <h3>{selectedNotice.title}</h3>
                    <p>{selectedNotice.content}</p>
                    <button onClick={() => setSelectedNotice(null)}>닫기</button>
                </div>
            )}
        </div>
    );
};

export default NoticeBoard;
