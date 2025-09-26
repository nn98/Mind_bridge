// src/components/board/BoardSection.jsx
import React, {useMemo, useState, useCallback, useEffect, useRef} from "react";
import {usePosts} from "./hooks/usePosts";
import BoardControls from "./BoardControls";
import WriteForm from "./WriteForm";
import PostCard from "./PostCard";
import "../../css/board.css";
import {useAuth} from "../../AuthContext";

/* ---------- 공통 헬퍼 ---------- */
const vis = (v) => (v || "").toUpperCase();
const isAdmin = (profile) => (profile?.role || "").toUpperCase() === "ADMIN";
const isOwner = (post, profile) =>
    String(post?.userNickname) === String(profile?.nickname);

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
                <div className="featured-info">
                    <h3 className="featured-title">{post.title || "게시글"}</h3>
                    <div className="featured-meta">
                        <span className="meta-item">
                            <i className="icon-calendar">📅</i>
                            {created}
                        </span>
                        <span className="meta-item">
                            <i className="icon-user">👤</i>
                            {post.userNickname || "익명"}
                        </span>
                        <span className={`visibility-badge ${vis(post.visibility).toLowerCase()}`}>
                            {visibilityToLabel(post.visibility)}
                        </span>
                    </div>
                </div>
                <button className="featured-close" onClick={onClose} aria-label="닫기">
                    ✕
                </button>
            </div>
            <div className="featured-body">{body}</div>
            {canEdit && canView && (
                <div className="featured-actions">
                    {/* 수정/삭제 버튼 자리 */}
                </div>
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
            onChange(newPage);
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
            <button className="page-btn page-nav" onClick={() => go(1)} disabled={page === 1}>
                <span>⏮</span>
            </button>
            <button className="page-btn page-nav" onClick={() => go(page - 1)} disabled={page === 1}>
                <span>◀</span>
            </button>

            {start > 1 && (
                <>
                    <button className="page-btn" onClick={() => go(1)}>1</button>
                    <span className="page-ellipsis">...</span>
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
                    <span className="page-ellipsis">...</span>
                    <button className="page-btn" onClick={() => go(totalPages)}>{totalPages}</button>
                </>
            )}

            <button className="page-btn page-nav" onClick={() => go(page + 1)} disabled={page === totalPages}>
                <span>▶</span>
            </button>
            <button className="page-btn page-nav" onClick={() => go(totalPages)} disabled={page === totalPages}>
                <span>⏭</span>
            </button>
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
    const [viewMode, setViewMode] = useState("card"); // card, list

    // Pagination
    const PAGE_SIZE = viewMode === "card" ? 12 : 20;
    const [page, setPage] = useState(1);

    // 스크롤 기준 앵커
    const topRef = useRef(null);

    // 페이지 바뀔 때마다 부드럽게 상단으로
    useEffect(() => {
        const el = topRef.current;
        if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({behavior: "smooth", block: "start"});
        } else {
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    }, [page]);

    // 탭/검색/정렬/뷰모드 변경 시 1페이지로
    useEffect(() => {
        setPage(1);
    }, [selectedBoard, searchQuery, sortOrder, viewMode]);

    const handleDelete = useCallback(
        async (id) => {
            await removePost(id);
            if (featuredPost?.id === id) setFeaturedPost(null);
        },
        [removePost, featuredPost]
    );

    // 목록은 그냥 visibility 기준으로만 보여줌
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
    }, [sorted, page, PAGE_SIZE]);

    const rangeText = useMemo(() => {
        if (sorted.length === 0) return "0 / 0";
        const start = (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, sorted.length);
        return `${start}–${end} / ${sorted.length}개`;
    }, [sorted.length, page, PAGE_SIZE]);

    return (
        <section className="board-section" ref={topRef}>
            <div className="banner-area">
                <h2 className="board-title">
                    <i className="board-icon">📋</i>
                    게시판
                </h2>
                <p className="board-subtitle">고객님의 마음을 자유롭게 표현해보세요</p>
                <div className="board-stats">
                    <span className="stat-item">
                        <strong>{sorted.length}</strong>개의 게시글
                    </span>
                    <span className="stat-divider">|</span>
                    <span className="stat-item">
                        페이지 <strong>{page}</strong> / <strong>{totalPages}</strong>
                    </span>
                </div>
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
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
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

            <div className={`post-list ${viewMode}-view`}>
                {loading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>게시글을 불러오는 중...</p>
                    </div>
                )}

                {error && (
                    <div className="error-container">
                        <i className="error-icon">⚠️</i>
                        <p className="error">{error}</p>
                    </div>
                )}

                {!loading && !error && sorted.length === 0 && (
                    <div className="empty-container">
                        <i className="empty-icon">📝</i>
                        <p>아직 게시글이 없습니다</p>
                        <small>첫 번째 게시글을 작성해보세요!</small>
                    </div>
                )}

                {!loading && !error && sorted.length > 0 && (
                    <>
                        {paged.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                profile={profile}
                                onEdit={editPost}
                                onDelete={handleDelete}
                                viewMode={viewMode}
                                onFeature={(p) => {
                                    setFeaturedPost(p);
                                    requestAnimationFrame(() => {
                                        document.querySelector(".board-featured-wrap")
                                            ?.scrollIntoView({behavior: "smooth", block: "start"});
                                    });
                                }}
                            />
                        ))}

                        <div className="pagination-bar bottom">
                            <div className="pagination-info">
                                <span className="range-text">{rangeText}</span>
                                <span className="view-mode-indicator">
                                    {viewMode === "card" ? "카드뷰" : "리스트뷰"}
                                </span>
                            </div>
                            <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default BoardSection;
