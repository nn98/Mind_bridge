// src/components/board/BoardSection.jsx
import React, {useMemo, useState, useCallback, useEffect, useRef} from "react";
import {usePosts} from "./hooks/usePosts";
import BoardControls from "./BoardControls";
import WriteForm from "./WriteForm";
import "../../css/board.css";
import {useAuth} from "../../AuthContext";

/* ---------- 공통 헬퍼 ---------- */
const vis = (v) => (v || "").toUpperCase();
const isAdmin = (profile) => (profile?.role || "").toUpperCase() === "ADMIN";
const isOwner = (post, profile) => String(post?.userNickname) === String(profile?.nickname);
const canViewPost = (post, profile) =>
    vis(post.visibility) === "PUBLIC" || isAdmin(profile) || isOwner(post, profile);
const canEditPost = (post, profile) => isAdmin(profile) || isOwner(post, profile);
const visibilityToLabel = (v) =>
    vis(v) === "PRIVATE" ? "비공개" : vis(v) === "FRIENDS" ? "친구공개" : "공개";

/* ---------- FeaturedPost ---------- */
const FeaturedPost = ({post, onClose, onDelete, canEdit, canView}) => {
    if (!post) return null;
    const created = (post.createdAt || post.date || "").split("T")[0];
    const body = canView ? post.content : "내용은 비공개입니다.";

    return (
        <div className="featured-post">
            <div className="featured-header">
                <h3 className="featured-title">{post.title || "내용"}</h3>
                <button className="featured-close" onClick={onClose} aria-label="닫기">x</button>
            </div>
            <div className="featured-meta">
                <span>{created} | {visibilityToLabel(post.visibility)}</span>
                <span>작성자: {post.userNickname || "익명"}</span>
            </div>
            <div className="featured-body">{body}</div>
            {canEdit && canView && (
                <div className="featured-actions">
                    <button className="post-delete" onClick={() => onDelete?.(post.id)}>삭제</button>
                </div>
            )}
        </div>
    );
};

/* ---------- PostCard ---------- */
const PostCard = ({post, profile, onEdit, onDelete, onFeature}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(post.content || "");
    const [saving, setSaving] = useState(false);

    const _canEdit = canEditPost(post, profile);
    const _canView = canViewPost(post, profile);

    const SHOW_MORE_THRESHOLD = 110;
    const isLong = (post?.content || "").trim().length > SHOW_MORE_THRESHOLD;
    const created = (post.createdAt || post.date || "").split("T")[0];

    const save = async () => {
        if (!editingContent.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        try {
            setSaving(true);
            await onEdit(post.id, {content: editingContent, visibility: post.visibility});
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

    const maskedBody = _canView ? post.content : "내용은 비공개입니다.";

    return (
        <div className="post-card">
            {_canEdit && _canView && (
                <button className="post-delete" onClick={remove} aria-label="삭제">x</button>
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
                    <button className="post-delete1" onClick={() => setIsEditing(false)}>취소</button>
                </>
            ) : (
                <>
                    <p className="post-content line-clamp-2">{maskedBody}</p>
                    {isLong && _canView && (
                        <button className="post-more-link" type="button" onClick={() => onFeature?.(post)}>
                            더보기
                        </button>
                    )}
                    <span>{created} | {visibilityToLabel(post.visibility)}</span>
                    <span>작성자: {post.userNickname || "익명"}</span>
                    {_canEdit && _canView && !isEditing && (
                        <button className="post-edit" onClick={() => setIsEditing(true)}>수정</button>
                    )}
                </>
            )}
        </div>
    );
};

/* ---------- Pagination UI ---------- */
function Pagination({page, totalPages, onChange}) {
    if (totalPages <= 1) return null;

    const go = (p) => {
        const newPage = Math.max(1, Math.min(totalPages, p));
        if (newPage !== page) {
            onChange(newPage); // 스크롤은 상위 useEffect에서 처리
        }
    };

    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - windowSize + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <nav className="board-pagination" aria-label="게시글 페이지네이션">
            <button className="page-btn" onClick={() => go(1)} disabled={page === 1}>«</button>
            <button className="page-btn" onClick={() => go(page - 1)} disabled={page === 1}>‹</button>

            {start > 1 && (
                <>
                    <button className="page-btn" onClick={() => go(1)}>1</button>
                    <span className="page-ellipsis">…</span>
                </>
            )}

            {pages.map((p) => (
                <button
                    key={p}
                    className={`page-btn ${p === page ? "is-active" : ""}`}
                    onClick={() => go(p)}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && (
                <>
                    <span className="page-ellipsis">…</span>
                    <button className="page-btn" onClick={() => go(totalPages)}>{totalPages}</button>
                </>
            )}

            <button className="page-btn" onClick={() => go(page + 1)} disabled={page === totalPages}>›</button>
            <button className="page-btn" onClick={() => go(totalPages)} disabled={page === totalPages}>»</button>
        </nav>
    );
}

/* ---------- BoardSection ---------- */
const BoardSection = () => {
    const {posts, loading, error, addPost, editPost, removePost} = usePosts();
    const {profile} = useAuth();

    const [selectedBoard, setSelectedBoard] = useState("general");
    const [sortOrder, setSortOrder] = useState("newest");
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [featuredPost, setFeaturedPost] = useState(null);

    // Pagination
    const PAGE_SIZE = 15;
    const [page, setPage] = useState(1);

    // 🔝 스크롤 기준 앵커
    const topRef = useRef(null);

    // ✅ 페이지 바뀔 때마다 부드럽게 상단(게시판 영역 시작점)으로
    useEffect(() => {
        const el = topRef.current;
        if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({behavior: "smooth", block: "start"});
        } else {
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    }, [page]);

    // 탭/검색/정렬 변경 시 1페이지로
    useEffect(() => {
        setPage(1);
    }, [selectedBoard, searchQuery, sortOrder]);

    const handleDelete = useCallback(
        async (id) => {
            await removePost(id);
            if (featuredPost?.id === id) setFeaturedPost(null);
        },
        [removePost, featuredPost]
    );

    const filtered = useMemo(() => {
        const matchBoard = (p) =>
            selectedBoard === "general" ? vis(p.visibility) === "PUBLIC" : vis(p.visibility) === "PRIVATE";
        const matchSearch = (p) =>
            (p.content || "").toLowerCase().includes((searchQuery || "").toLowerCase());
        return posts.filter((p) => matchBoard(p) && matchSearch(p));
    }, [posts, selectedBoard, searchQuery]);

    const sorted = useMemo(() => {
        const copied = [...filtered];
        copied.sort((a, b) => {
            const da = new Date(a.createdAt || a.date || 0).getTime();
            const db = new Date(b.createdAt || b.date || 0).getTime();
            return sortOrder === "newest" ? db - da : da - db;
        });
        return copied;
    }, [filtered, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sorted.slice(start, start + PAGE_SIZE);
    }, [sorted, page]);

    const rangeText = useMemo(() => {
        if (sorted.length === 0) return "0 / 0";
        const start = (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, sorted.length);
        return `${start}–${end} / ${sorted.length}개`;
    }, [sorted.length, page]);

    return (
        <section className="board-section" ref={topRef}>
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
                    onSubmit={async ({content, visibility}) => {
                        await addPost({content, visibility});
                        setShowForm(false);
                        setPage(1);
                    }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {featuredPost && (
                <div className="board-featured-wrap">
                    <FeaturedPost
                        post={featuredPost}
                        onClose={() => setFeaturedPost(null)}
                        onDelete={handleDelete}
                        canEdit={canEditPost(featuredPost, profile)}
                        canView={canViewPost(featuredPost, profile)}
                    />
                </div>
            )}

            <div className="post-list">
                {loading && <p>불러오는 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && !error && sorted.length === 0 && <p>게시글이 없습니다</p>}

                {!loading && !error && sorted.length > 0 && (
                    <>
                        {paged.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                profile={profile}
                                onEdit={editPost}
                                onDelete={handleDelete}
                                onFeature={(p) => {
                                    if (!canViewPost(p, profile)) {
                                        alert("비공개 글은 작성자와 관리자만 열람할 수 있습니다.");
                                        return;
                                    }
                                    setFeaturedPost(p);
                                    requestAnimationFrame(() => {
                                        document.querySelector(".board-featured-wrap")
                                            ?.scrollIntoView({behavior: "smooth", block: "start"});
                                    });
                                }}
                            />
                        ))}

                        {/* 하단만 표시 */}
                        <div className="pagination-bar bottom">
                            <span className="range-text">{rangeText}</span>
                            <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default BoardSection;
