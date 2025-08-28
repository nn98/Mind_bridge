import React, { useMemo, useState } from "react";
import { usePosts } from "./hooks/usePosts";
import BoardControls from "./BoardControls";
import WriteForm from "./WriteForm";
import PostCard from "./PostCard";
import '../../css/board.css';
import { useAuth } from "../../AuthContext";

const BoardSection = () => {
    const { posts, loading, error, addPost, editPost, removePost } = usePosts();
    const { profile } = useAuth();
  console.log(`posts: ${JSON.stringify(posts)}`);

    const [selectedBoard, setSelectedBoard] = useState("general");
    const [sortOrder, setSortOrder] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);

    // 필터링
    const filtered = useMemo(() => {
        const matchBoard = (p) =>
            selectedBoard === "general" ? p.visibility === "public" : p.visibility === "private";
        const matchSearch = (p) =>
            (p.content || "").toLowerCase().includes((searchQuery || "").toLowerCase());
        return posts.filter((p) => matchBoard(p) && matchSearch(p));
    }, [posts, selectedBoard, searchQuery]);

    // 정렬
    const sorted = useMemo(() => {
        const copied = [...filtered];
        copied.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0).getTime();
            const dateB = new Date(b.createdAt || b.date || 0).getTime();
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });
        return copied;
    }, [filtered, sortOrder]);

    return (
        <section className="board-section">
            <div className="banner-area">
                <h2 className="board-title">게시판</h2>
                <p className="board-subtitle">고객님의 마음을 작성해주세요</p>
            </div>

            <BoardControls
                selectedBoard={selectedBoard}
                onChangeBoard={setSelectedBoard}
                sortOrder={sortOrder}
                onChangeSort={setSortOrder}
                searchQuery={searchQuery}
                onChangeSearch={setSearchQuery}
                onClickWrite={() => setShowForm(true)}
                profile={profile}
            />

            {showForm && (
                <WriteForm
                    onSubmit={async ({ content, visibility }) => {
                        await addPost({ content, visibility });
                        setShowForm(false);
                    }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <div className="post-list">
                {loading && <p>불러오는 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && !error && sorted.length === 0 && <p>게시글이 없습니다</p>}
                {!loading &&
                    !error &&
                    sorted.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            user={profile.email}
                            onEdit={editPost}
                            onDelete={removePost}
                        />
                    ))}
            </div>
        </section>
    );
};

export default BoardSection;
