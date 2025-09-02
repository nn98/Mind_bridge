// BoardSection.jsx — (한 파일 완성본)
// - 상단 FeaturedPost(더보기 클릭 시 해당 글을 크게 표시)
// - 카드 본문 4줄 클램프 + "더보기" 버튼
// - 기존 usePosts / BoardControls / WriteForm 그대로 사용

import React, { useMemo, useState } from "react";
import { usePosts } from "./hooks/usePosts";
import BoardControls from "./BoardControls";
import WriteForm from "./WriteForm";
import "../../css/board.css";
import { useAuth } from "../../AuthContext";

/* ---------------------------
   FeaturedPost (상단 확대 보기)
---------------------------- */
const FeaturedPost = ({ post, onClose, onEdit, onDelete, canEdit }) => {
    if (!post) return null;
    const created = (post.createdAt || post.date || "").split("T")[0];
    const visibilityToLabel = (v) =>
        v === "private" || v === "PRIVATE"
            ? "비공개"
            : v === "friends" || v === "FRIENDS"
                ? "친구공개"
                : "공개";

    return (
        <div className="featured-post">
            <div className="featured-header">
                <h3 className="featured-title">{post.title || "내용"}</h3>
                <button className="featured-close" onClick={onClose} aria-label="닫기">
                    x
                </button>
            </div>

            <div className="featured-meta">
                <span>
                    {created} | {visibilityToLabel(post.visibility)}
                </span>
                <span>작성자: {post.userNickname || "익명"}</span>
            </div>

            <div className="featured-body">{post.content}</div>

            {canEdit && (
                <div className="featured-actions">
                    <button
                        className="post-edit"
                        onClick={() =>
                            onEdit?.(post.id, {
                                content: post.content,
                                visibility: post.visibility,
                            })
                        }
                    >
                        수정
                    </button>
                    <button className="post-delete" onClick={() => onDelete?.(post.id)}>
                        삭제
                    </button>
                </div>
            )}
        </div>
    );
};

/* ---------------------------
   PostCard (4줄 클램프 + 더보기)
---------------------------- */
const PostCard = ({ post, profile, onEdit, onDelete, onFeature }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(post.content || "");
    const [saving, setSaving] = useState(false);

    // 권한(작성자 또는 ADMIN)
    const role = profile?.role?.toUpperCase?.();
    const canEdit =
        role === "ADMIN" ||
        String(post?.userId || post?.authorId) === String(profile?.id);

    // “길다” 판정(대략 4줄 기준으로 140자 전후)
    const SHOW_MORE_THRESHOLD = 140;
    const isLong = (post?.content || "").trim().length > SHOW_MORE_THRESHOLD;

    const created = (post.createdAt || post.date || "").split("T")[0];
    const visibilityToLabel = (v) =>
        v === "private" || v === "PRIVATE"
            ? "비공개"
            : v === "friends" || v === "FRIENDS"
                ? "친구공개"
                : "공개";

    const save = async () => {
        if (!editingContent.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        try {
            setSaving(true);
            await onEdit(post.id, {
                content: editingContent,
                visibility: post.visibility,
            });
            setIsEditing(false);
        } catch (e) {
            console.error("게시글 수정 실패:", e);
            alert(e?.message || "게시글 수정에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
        try {
            await onDelete(post.id);
        } catch (e) {
            console.error("게시글 삭제 실패:", e);
            alert("게시글 삭제에 실패했습니다. 본인의 글이 맞는지 확인해주세요.");
        }
    };

    return (
        <div className="post-card">
            {canEdit && (
                <>
                    <button className="post-delete" onClick={remove} aria-label="삭제">
                        x
                    </button>
                    <button className="post-edit" onClick={() => setIsEditing(true)}>
                        수정
                    </button>
                </>
            )}

            {isEditing ? (
                <>
                    <textarea
                        className="edit-form"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                    />
                    <button className="post-edit1" disabled={saving} onClick={save}>
                        {saving ? "저장 중..." : "저장"}
                    </button>
                    <button className="post-delete1" onClick={() => setIsEditing(false)}>
                        취소
                    </button>
                </>
            ) : (
                <>
                    {/* 본문 4줄까지만 보이기 */}
                    <p className="post-content line-clamp-4">{post.content}</p>

                    {/* 길면 '더보기' 텍스트 링크 */}
                    {isLong && (
                        <button
                            className="post-more-link"
                            onClick={() => onFeature?.(post)}
                            aria-label="해당 게시글 더보기"
                        >
                            더보기
                        </button>
                    )}

                    <span>
                        {created} | {visibilityToLabel(post.visibility)}
                    </span>
                    <span>작성자: {post.userNickname || "익명"}</span>
                </>
            )}
        </div>
    );
};

/* ---------------------------
   BoardSection (부모)
---------------------------- */
const BoardSection = () => {
    const { posts, loading, error, addPost, editPost, removePost } = usePosts();
    const { profile } = useAuth();

    const [selectedBoard, setSelectedBoard] = useState("general");
    const [sortOrder, setSortOrder] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);

    // 상단 Featured로 띄울 글
    const [featuredPost, setFeaturedPost] = useState(null);

    // 필터링
    const filtered = useMemo(() => {
        const matchBoard = (p) =>
            selectedBoard === "general"
                ? p.visibility === "public" || p.visibility === "PUBLIC"
                : p.visibility === "private" || p.visibility === "PRIVATE";
        const matchSearch = (p) =>
            (p.content || "")
                .toLowerCase()
                .includes((searchQuery || "").toLowerCase());
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

            {/* ▶ 상단 Featured 영역 */}
            {featuredPost && (
                <div className="board-featured-wrap">
                    <FeaturedPost
                        post={featuredPost}
                        onClose={() => setFeaturedPost(null)}
                        onEdit={editPost}
                        onDelete={removePost}
                        canEdit={
                            profile?.role?.toUpperCase?.() === "ADMIN" ||
                            String(featuredPost?.userId || featuredPost?.authorId) ===
                            String(profile?.id)
                        }
                    />
                </div>
            )}

            {/* 목록 */}
            <div className="post-list">
                {loading && <p>불러오는 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && !error && sorted.length === 0 && (
                    <p>게시글이 없습니다</p>
                )}
                {!loading &&
                    !error &&
                    sorted.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            profile={profile}
                            onEdit={editPost}
                            onDelete={removePost}
                            onFeature={(p) => {
                                setFeaturedPost(p);
                                // 상단으로 스크롤(UX)
                                requestAnimationFrame(() => {
                                    document
                                        .querySelector(".board-featured-wrap")
                                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                                });
                            }}
                        />
                    ))}
            </div>
        </section>
    );
};

export default BoardSection;
