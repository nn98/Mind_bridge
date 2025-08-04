import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const BoardSection = ({ user, isSignedIn, isCustomLoggedIn }) => {
  const [selectedBoard, setSelectedBoard] = useState("general");
  const [visibility, setVisibility] = useState("공개");
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [posts, setPosts] = useState([]);
  const { getToken } = useAuth();

  // 게시글 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/posts", {
        withCredentials: true, // 인증 쿠키 포함
      });
      setPosts(res.data);
    } catch (error) {
      console.error("게시글 불러오기 실패:", error);
    }
  };

  // 게시글 작성
  const handleSubmit = async () => {

    let token;

    try {
      // Clerk 사용자 토큰 우선 시도
      token = await getToken();
      console.log("Clerk 토큰:", await getToken());
    } catch (e) {
      console.warn("Clerk 토큰 가져오기 실패:", e);
    }

    // 커스텀 로그인 fallback
    if (!token) {
      token = localStorage.getItem("token");
    }

    if (!token) {
      alert("로그인 후 작성해주세요.");
      console.log("커스텀 토큰:", token);
      return;
    }

    if (!content.trim()) return; //내용이 비어있으면 제출 x 

    //여기가 인증 요청하는 곳 
    const newPost = {
      content,
      visibility,
      userId: user.email,
      userName: user.fullName || user.nickname || "익명",
    };

    try {
      const res = await axios.post(
        "http://localhost:8080/api/posts",
        newPost,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        } // 인증 쿠키 포함
      );


      console.log("게시글 작성 성공:", res.data);
      setContent("");
      setVisibility("공개");
      setShowForm(false);
      fetchPosts(); // 작성 후 다시 불러오기

    } catch (error) {
      console.error("게시글 작성 실패:", error);
    }
  };

  // 게시글 삭제
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token"); //토큰 가져오기

      await axios.delete(`http://localhost:8080/api/posts/${id}`, { 
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPosts(); // 리콜
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
    }
  };

  // 필터링 및 정렬
  const filteredPosts = posts.filter((post) => {
    const matchBoard =
      selectedBoard === "general"
        ? post.visibility === "공개"
        : post.visibility === "비공개";
    const matchSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchBoard && matchSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    return sortOrder === "newest" ? b.id - a.id : a.id - b.id;
  });

  return (
    <section className="board-section">
      <div className="banner-area">
        <h2 className="board-title">게시판</h2>
        <p className="board-subtitle">고객님의 마음을 작성해주세요</p>
      </div>

      <div className="board-controls">
        <div className="left-controls">
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
          >
            <option value="general">일반 게시판</option>
            <option value="admin">관리자 게시판</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
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
            {["공개", "비공개"].map((label) => (
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
          sortedPosts.map((post) => (   //filter 넣어서 해볼까? 
            <div key={post.id} className="post-card">
              <button onClick={() => handleDelete(post.id)}>삭제</button>
              <p>{post.content}</p>
              <span>
                {(post.createdAt || post.date).split("T")[0]} | {post.visibility} |
              </span>
              <span>
                작성자:{""}
                {post.userNickname}
              </span>
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
