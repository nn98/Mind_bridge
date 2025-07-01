import React from 'react';

const EmailSection = ({ chatHistory, selectedChat, setSelectedChat, handleRead, handleSendEmail }) => {
  return (
    <section className="board-section">
      <h2>AI 상담 기록 메일 전송</h2>

      <ul style={{ textAlign: 'left' }}>
        {Array.isArray(chatHistory) && chatHistory.length > 0 ? (
          chatHistory.map((item, idx) => (
            <li key={idx}>
              <label>
                <input
                  type="radio"
                  name="chatSelect"
                  value={idx}
                  checked={selectedChat === idx}
                  onChange={() => setSelectedChat(idx)}
                />
                {item.summary?.length > 30
                  ? item.summary.slice(0, 30) + '...'
                  : item.summary || '내용 없음'}
              </label>
            </li>
          ))
        ) : (
          <li>상담 기록이 없습니다.</li>
        )}
      </ul>

      <div style={{ marginTop: '1rem' }}>
        <button className="button" onClick={handleRead} disabled={!Array.isArray(chatHistory) || chatHistory.length === 0}>
          텍스트 
        </button>
        <button className="button" onClick={handleSendEmail} disabled={!Array.isArray(chatHistory) || chatHistory.length === 0}>
          메일 전송
        </button>
      </div>
    </section>
  );
};

export default EmailSection;
