import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BoardSection = ({ user, isSignedIn }) => {
  const [selectedBoard, setSelectedBoard] = useState('general');
  const [visibility, setVisibility] = useState('공개');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [posts, setPosts] = useState([]);

  // 게시글 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/posts');
      setPosts(res.data);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
    }
  };

  // 게시글 작성
  const handleSubmit = async () => {
    if (!isSignedIn) {
      alert('로그인 후 작성해주세요.');
      console.log('작성 완료 버튼 눌림');
      return;
    }

    if (!content.trim()) return;

    const newPost = {
      content,
      visibility,
      userId: user.id,
      userName: user.fullName || user.username || '익명',
    };

    try {
      await axios.post('http://localhost:8080/api/posts', newPost);
      setContent('');
      setVisibility('공개');
      setShowForm(false);
      fetchPosts(); // 작성 후 다시 불러오기
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  // 게시글 삭제
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/posts/${id}`);
      fetchPosts(); // 삭제 후 다시 불러오기
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
    }
  };

  // 필터링 및 정렬
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
          <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
            <option value="general">일반 게시판</option>
            <option value="admin">관리자 게시판</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
        <div className="right-controls">
          <input
            type="text"
            placeholder="검색어 입력"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={() => setShowForm(true)}>작성하기</button>
        </div>
      </div>

      {showForm && (
        <div className="write-form">
          <textarea
            placeholder="고민을 다같이 들어드립니다"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
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
          <button onClick={handleSubmit}>작성 완료</button>
        </div>
      )}

      <div className="post-list">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <div key={post.id} className="post-card">
              <p>{post.content}</p>
              <span>
                {post.createdAt || post.date} ・ {post.visibility} ・ 작성자: {post.userName}
              </span>
              {isSignedIn && user?.id === post.userId && (
                <button onClick={() => handleDelete(post.id)}>삭제</button>
              )}
            </div>
          ))
        ) : (
          <p>게시글이 없습니다</p>
        )}
      </div>
    </section>
  );
};

export default BoardSection;
