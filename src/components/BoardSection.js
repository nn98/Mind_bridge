import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const BoardSection = ({ user, isSignedIn, isCustomLoggedIn }) => {
  const [posts, setPosts] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("general");
  const [visibility, setVisibility] = useState("공개");
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const { getToken } = useAuth();

  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/posts", {
        withCredentials: true,
      });
      setPosts(res.data);
    } catch (error) {
      console.error("게시글 불러오기 실패:", error);
    }
  };

  const getAuthToken = async () => {
    try {
      const clerkToken = await getToken();
      if (clerkToken) return clerkToken;
    } catch (e) {
      console.warn("Clerk 토큰 가져오기 실패, 커스텀 토큰으로 대체합니다.", e);
    }
    return localStorage.getItem("token");
  };

  const visibilityMap = {
    공개: "public",
    비공개: "private",
    친구만: "friends",
  };

  const handleSubmit = async () => {
    const token = await getAuthToken();
    if (!token) {
      alert("로그인 후 작성해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const visibilityValue = visibilityMap[visibility] || "public";

    const newPost = {
      content,
      visibility: visibilityValue,
      userEmail: user.email,  // 필드명 수정
      userNickname: user.fullName || user.nickname || "익명", //수정부분을 위한 username > userNickname 으로 변경 
    };

    try {
      const response = await axios.post("http://localhost:8080/api/posts", newPost, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      console.log("게시글 생성 응답:", response.data);
      setContent("");
      setVisibility("공개");
      setShowForm(false);
      fetchPosts();
    } catch (error) {
      console.error("게시글 작성 실패:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    const token = await getAuthToken();
    if (!token) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchPosts();
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다. 본인의 글이 맞는지 확인해주세요.");
    }
  };

  const handleEditStart = (post) => {

    const currentUserName = user.fullName || user.nickname;

    console.log("Current User Name:", currentUserName);
    console.log("Post User Name:", post.userNickname);

    if (post.userNickname === currentUserName) {
      setEditingPostId(post.id);
      setEditingContent(post.content);
    } else {
      alert("본인이 작성한 글만 수정할 수 있습니다.");
    }
  };

  const handleUpdateSubmit = async (id) => {
    const token = await getAuthToken();
    if (!token) {
      alert("로그인 정보가 유효하지 않습니다.");
      return;
    }
    if (!editingContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const post = posts.find((p) => p.id === id);
    if (!post) {
      alert("수정할 게시글을 찾을 수 없습니다.");
      return;
    }

    const visibilityMap = {
      공개: "public",
      비공개: "private",
      친구만: "friends",
    };

    const visibilityValue = visibilityMap[post.visibility] || "public";

    console.log("PUT 요청 보낼 데이터:", {
      content: editingContent,
      visibility: visibilityValue,
      userEmail: post.userEmail,
      userNickname: post.userNickname,
    });

    try {
      await axios.put(
        `http://localhost:8080/api/posts/${id}`,
        {
          content: editingContent,
          visibility: visibilityValue,
          userEmail: post.userEmail,
          userNickname: post.userNickname,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setEditingPostId(null);
      setEditingContent("");
      fetchPosts();
    } catch (error) {
      console.error("게시글 수정 실패:", error);
      if (error.response) {
        console.error("서버 응답 메시지:", error.response.data);
      }
      alert("게시글 수정에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingContent("");
  };

  const filteredPosts = posts.filter((post) => {

    const matchBoard =
      selectedBoard === "general"
        ? post.visibility === "public"
        : post.visibility === "private";

    const matchSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchBoard && matchSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const currentUserName = user?.fullName || user?.nickname;

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
          {(isSignedIn || isCustomLoggedIn) && (
            <button onClick={() => setShowForm(true)}>작성하기</button>
          )}
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
          sortedPosts.map((post) => (
            <div key={post.id} className="post-card">
              {editingPostId === post.id ? (
                <div>
                  <textarea className="edit-form"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div>
                    <button className="post-edit1" onClick={() => handleUpdateSubmit(post.id)}>저장</button>
                    <button className="post-delete1" onClick={handleCancelEdit}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  {currentUserName === post.userNickname && (
                    <div>
                      <button className="post-edit" onClick={() => handleEditStart(post)}>수정</button>
                      <button className="post-delete" onClick={() => handleDelete(post.id)}>x</button>
                    </div>
                  )}
                  <p>{post.content}</p>
                  <div className="post-meta">
                    <span>
                      {(post.createdAt || post.date || "").split("T")[0]} | {post.visibility}
                    </span>
                    <span>작성자: {post.userNickname || "익명"}</span>
                  </div>
                </>
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
