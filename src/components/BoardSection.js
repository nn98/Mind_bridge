import React, { useState, useEffect } from 'react';

const BoardSection = () => {
  const [selectedBoard, setSelectedBoard] = useState('general');
  const [visibility, setVisibility] = useState('공개');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('posts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('posts', JSON.stringify(posts));
  }, [posts]);

  const handleSubmit = () => {
    if (!content.trim()) return;

    const newPost = {
      id: Date.now(),
      content,
      visibility,
      date: new Date().toLocaleString(),
    };

    setPosts([newPost, ...posts]);
    setContent('');
    setVisibility('공개');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  const filteredPosts = posts.filter((post) => {
    const matchBoard =
      selectedBoard === 'general' ? post.visibility === '공개' : post.visibility === '비공개';
    const matchSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBoard && matchSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    return sortOrder === 'newest' ? b.id - a.id : a.id - b.id;
  });

  return (
    <section className="board-section">
      <div className="banner-area">
        <h2 className="board-title">게시판</h2>
        <p className="board-subtitle">고객님의 마음을 작성해주세요</p>
      </div>

      <div className="board-controls">
        <div className="left-controls">
          <select className="board-selector" value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
            <option value="general">일반 게시판</option>
            <option value="admin">관리자 게시판</option>
          </select>

          <select className="sort-selector" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>

        <div className="right-controls">
          <input
            type="text"
            className="search-input"
            placeholder="검색어 입력"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="write-button" onClick={() => setShowForm(true)}>
            작성하기
          </button>
        </div>
      </div>

      {showForm && (
        <div className="write-form">
          <textarea
            className="textarea"
            placeholder="고민을 다같이 들어드립니다"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="radio-group">
            {['공개', '비공개'].map((label) => (
              <label key={label}>
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
          <button className="submit-button" onClick={handleSubmit}>
            작성 완료
          </button>
        </div>
      )}

      <div className="post-list">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <div key={post.id} className="post-card">
              <p className="post-content">{post.content}</p>
              <span className="post-meta">{post.date} ・ {post.visibility}</span>
              <button className="delete-button" onClick={() => handleDelete(post.id)}>삭제</button>
            </div>
          ))
        ) : (
          <p className="no-posts">게시글이 없습니다</p>
        )}
      </div>
    </section>
  );
};

export default BoardSection;
