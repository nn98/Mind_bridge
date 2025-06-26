import React from 'react';

const BoardSection = ({ selectedBoard, visibility, setVisibility }) => {
  return (
    <section className="board-section">
      <h2>게시판</h2>
      {selectedBoard === 'generalBoard' && (
        <>
          <textarea className="textarea" placeholder="당신의 감정을 나눠보세요..."></textarea>
          <div>
            {['공개', '비공개', '관리자만 공개'].map((label, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="visibility"
                  value={label}
                  checked={visibility === label}
                  onChange={(e) => setVisibility(e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
        </>
      )}

      {selectedBoard === 'adminBoard' && (
        <>
          <p>관리자 전용 게시판입니다.</p>
          <textarea className="textarea" placeholder="관리자만 작성 가능합니다"></textarea>
        </>
      )}

      {selectedBoard === 'noticeBoard' && (
        <>
          <textarea className="textarea" placeholder="공지사항 작성 (관리자만)"></textarea>
          <p>※ 일반 사용자는 읽기만 가능합니다.</p>
        </>
      )}
    </section>
  );
};

export default BoardSection;