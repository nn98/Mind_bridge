// src/components/admin/components/PostsPanel.js
import React, {useEffect, useMemo, useState} from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import {getAllPosts, deletePostById} from "../services/adminApi";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** 안전 접근 키 선택 */
const pick = (obj, keys) =>
    keys.find((k) => obj?.[k] !== undefined && obj?.[k] !== null);

/** 정렬 값 추출 */
function getSortValue(row, sortKey) {
    switch (sortKey) {
        case "id": {
            const idKey = pick(row, ["id", "postId", "boardId"]);
            const v = idKey ? row[idKey] : undefined;
            const num = Number(v);
            return Number.isFinite(num) ? num : (v ?? "");
        }
        case "nickname": {
            const v =
                row?.nickname ??
                row?.authorNickname ??
                row?.userNickname ??
                row?.user?.nickname ??
                row?.author?.nickname ??
                "";
            return String(v).toLowerCase();
        }
        case "email": {
            const v =
                row?.email ??
                row?.authorEmail ??
                row?.userEmail ??
                row?.user?.email ??
                row?.author?.email ??
                "";
            return String(v).toLowerCase();
        }
        case "createdAt":
        default: {
            const createdKey = pick(row, [
                "createdAt",
                "createdDate",
                "created_at",
                "regDate",
                "createdOn",
            ]);
            const t = createdKey ? new Date(row[createdKey]).getTime() : NaN;
            return Number.isFinite(t) ? t : -Infinity;
        }
    }
}

/** 공개/비공개 라벨링 */
function getVisibilityInfo(row) {
    const visKey = pick(row, ["visibility", "isPublic", "public"]);
    const v = visKey ? row[visKey] : undefined;
    let isPublic = false;
    if (typeof v === "string") isPublic = v.toLowerCase() === "public";
    else if (typeof v === "boolean") isPublic = v;
    return {isPublic, label: isPublic ? "공개" : "비공개"};
}

/** 작성자 관리자 여부 추정 */
function isAdminAuthor(row) {
    const candidates = [];
    if (row?.user) {
        candidates.push(row.user.role, row.user.roles, row.user.authorities);
    }
    candidates.push(row?.authorRole, row?.role, row?.roles, row?.authorities);
    for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c)) {
            if (
                c.some(
                    (x) =>
                        typeof x === "string" &&
                        (x.includes("ADMIN") || x.includes("ROLE_ADMIN"))
                )
            )
                return true;
            if (
                c.some((x) => typeof x === "object" && x?.authority?.includes?.("ADMIN"))
            )
                return true;
        } else if (typeof c === "string") {
            if (c.includes("ADMIN")) return true;
        } else if (typeof c === "object" && c?.authority?.includes?.("ADMIN")) {
            return true;
        }
    }
    return false;
}

/** 서버 응답 포맷 표준화 */
function normalizePostsResponse(result, {size}) {
    let content = [];
    let totalPages = 0;
    let totalElements = 0;

    if (Array.isArray(result?.data?.content)) {
        content = result.data.content;
        totalPages = Number(result.data.totalPages ?? 0);
        totalElements = Number(
            result.data.totalElements ?? result.data.content.length ?? 0
        );
    } else if (Array.isArray(result?.content)) {
        content = result.content;
        totalPages = Number(result.totalPages ?? 0);
        totalElements = Number(result.totalElements ?? result.content.length ?? 0);
    } else if (Array.isArray(result?.data)) {
        content = result.data;
    } else if (Array.isArray(result)) {
        content = result;
    }

    if (!totalPages || !Number.isFinite(totalPages)) {
        totalElements = content.length;
        totalPages = Math.max(1, Math.ceil(totalElements / Math.max(1, size)));
    }

    return {content, totalPages, totalElements};
}

const PostsPanel = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [sortKey, setSortKey] = useState("createdAt");
    const [sortDir, setSortDir] = useState("desc");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [openRowId, setOpenRowId] = useState(null);

    const sortParam = `${sortKey},${sortDir}`;

    const fetch = async () => {
        try {
            setLoading(true);
            setError("");

            const raw = await getAllPosts({page, size, search, sort: sortParam});

            const {content, totalPages, totalElements} = normalizePostsResponse(
                raw,
                {size}
            );

            setPosts(Array.isArray(content) ? content : []);
            setTotalPages(Number.isFinite(totalPages) ? totalPages : 0);
            setTotalElements(Number.isFinite(totalElements) ? totalElements : 0);
        } catch (e) {
            console.error(e);
            setPosts([]);
            setTotalPages(0);
            setTotalElements(0);
            setError("게시글을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, search, sortKey, sortDir]);

    const onSearchSubmit = (e) => {
        e?.preventDefault?.();
        setPage(0);
        setSearch(searchInput.trim());
    };

    const onKeyDown = (e) => {
              // IME(한글) 조합 중 Enter는 무시
                 if (e.isComposing) return;
              if (e.key === "Enter") {
                      // 기본 제출 방지 후, 표준 submit 트리거
                          e.preventDefault();
                     // 가장 가까운 form을 찾아 안전하게 제출 (버튼 클릭과 동일 라우팅)
                          e.currentTarget.form?.requestSubmit?.();
                  }
          };

    const onDelete = (postId) => {
        const toastId = toast.info(
            <div>
                <div style={{fontWeight: 600, marginBottom: 8}}>
                    정말 이 게시글을 삭제하시겠습니까?
                </div>
                <div style={{display: "flex", gap: 8}}>
                    <button
                        onClick={async () => {
                            try {
                                await deletePostById(postId);
                                setOpenRowId((prev) => (prev === postId ? null : prev));
                                toast.dismiss(toastId);
                                toast.success("게시글이 삭제되었습니다.");
                                fetch();
                            } catch (e) {
                                console.error(e);
                                toast.dismiss(toastId);
                                toast.error(
                                    e?.response?.status === 403
                                        ? "삭제 권한이 없습니다. (관리자 권한이 필요하거나 작성자만 삭제 가능합니다)"
                                        : "삭제 중 오류가 발생했습니다."
                                );
                            }
                        }}
                        style={{
                            background: "#d9534f",
                            color: "#fff",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderRadius: 6,
                        }}
                    >
                        삭제
                    </button>
                    <button
                        onClick={() => toast.dismiss(toastId)}
                        style={{
                            background: "#e0e0e0",
                            color: "#000",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderRadius: 6,
                        }}
                    >
                        취소
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: "top-center",
            }
        );
    };

    const handleHeaderSort = (key) => {
        setPage(0);
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortIndicator = (key) =>
        sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

    // ✅ 검색엔진 (프론트단 필터링)
    const filteredPosts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return posts;

        return posts.filter((p) => {
            const nickname =
                p?.nickname ??
                p?.authorNickname ??
                p?.userNickname ??
                p?.user?.nickname ??
                p?.author?.nickname ??
                "";

            const email =
                p?.email ??
                p?.authorEmail ??
                p?.userEmail ??
                p?.user?.email ??
                p?.author?.email ??
                "";

            const content = p?.content ?? "";
            const title = p?.title ?? "";

            return (
                String(nickname).toLowerCase().includes(q) ||
                String(email).toLowerCase().includes(q) ||
                String(content).toLowerCase().includes(q) ||
                String(title).toLowerCase().includes(q)
            );
        });
    }, [posts, search]);

    const displayRows = useMemo(() => {
        const arr = Array.isArray(filteredPosts) ? [...filteredPosts] : [];
        return arr
            .map((row, idx) => ({row, idx}))
            .sort((a, b) => {
                const av = getSortValue(a.row, sortKey);
                const bv = getSortValue(b.row, sortKey);
                let comp = 0;
                if (typeof av === "number" && typeof bv === "number") comp = av - bv;
                else comp = String(av).localeCompare(String(bv), "ko", {numeric: true});
                if (comp === 0) comp = a.idx - b.idx;
                return sortDir === "asc" ? comp : -comp;
            })
            .map(({row}) => row);
    }, [filteredPosts, sortKey, sortDir]);

    const renderRows = () => {
        if (!displayRows || displayRows.length === 0) {
            return (
                <tr>
                    <td colSpan="6" className="empty">
                        게시글이 없습니다.
                    </td>
                </tr>
            );
        }

        return displayRows.map((p) => {
            const idKey = pick(p, ["id", "postId", "boardId"]);
            const id = idKey ? p[idKey] : undefined;

            const nick =
                p?.nickname ??
                p?.authorNickname ??
                p?.userNickname ??
                p?.user?.nickname ??
                p?.author?.nickname ??
                "─";

            const email =
                p?.email ??
                p?.authorEmail ??
                p?.userEmail ??
                p?.user?.email ??
                p?.author?.email ??
                "─";

            const createdKey = pick(p, [
                "createdAt",
                "createdDate",
                "created_at",
                "regDate",
                "createdOn",
            ]);
            const createdRaw = createdKey ? p[createdKey] : null;
            const createdStr =
                createdRaw && dayjs(createdRaw).isValid()
                    ? dayjs(createdRaw).format("YYYY-MM-DD")
                    : "─";

            const content = p?.content ?? "";
            const {isPublic, label: visLabel} = getVisibilityInfo(p);
            const admin = isAdminAuthor(p);

            return (
                <React.Fragment key={id ?? `${nick}-${createdStr}`}>
                    <tr>
                        <td>{id ?? "─"}</td>
                        <td className="ellipsis">{nick}</td>
                        <td>
              <span className="ellipsis-email" title={email}>
                {email}
              </span>
                        </td>

                        <td className="nowrap">
              <span
                  className={`badge ${isPublic ? "badge-public" : "badge-private"}`}
              >
                {visLabel}
              </span>
                            {admin && (
                                <>
                                    {" "}
                                    <span className="badge badge-admin">(관리자)</span>
                                </>
                            )}
                        </td>

                        <td className="nowrap">{createdStr}</td>

                        <td>
                            {id ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn-link"
                                        onClick={() =>
                                            setOpenRowId((prev) => (prev === id ? null : id))
                                        }
                                    >
                                        보기
                                    </button>
                                    &nbsp;
                                    <button className="btn-danger" onClick={() => onDelete(id)}>
                                        삭제
                                    </button>
                                </>
                            ) : (
                                "─"
                            )}
                        </td>
                    </tr>

                    {openRowId === id && (
                        <tr className="detail-row">
                            <td colSpan="6">
                                <div className="post-content">
                                    {content ? content : <em>내용이 없습니다.</em>}
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <div className="section-container posts-panel">
            <h2 className="admin-section-title">📋 게시글</h2>

            <div className="toolbar">
                <form onSubmit={onSearchSubmit} className="toolbar-form">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="제목/작성자/이메일/내용 검색"
                        className="input"
                    />
                    <button type="submit" className="btn">
                        검색
                    </button>
                </form>
            </div>

            <div className="table-scroll">
                <table className="admin-table posts-table">
                    <colgroup>
                        <col style={{width: 80}}/>
                        <col style={{width: 160}}/>
                        <col/>
                        <col style={{width: 140}}/>
                        <col style={{width: 120}}/>
                        <col style={{width: 120}}/>
                    </colgroup>

                    <thead>
                    <tr>
                        <th onClick={() => handleHeaderSort("id")} role="button">
                            ID{sortIndicator("id")}
                        </th>
                        <th onClick={() => handleHeaderSort("nickname")} role="button">
                            작성자{sortIndicator("nickname")}
                        </th>
                        <th onClick={() => handleHeaderSort("email")} role="button">
                            이메일{sortIndicator("email")}
                        </th>
                        <th>유형</th>
                        <th onClick={() => handleHeaderSort("createdAt")} role="button">
                            작성일{sortIndicator("createdAt")}
                        </th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="loading">
                                불러오는 중…
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="6" className="error">
                                {error}
                            </td>
                        </tr>
                    ) : (
                        renderRows()
                    )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <div className="total">총 {totalElements}건</div>
                <div className="pager">
                    <button
                        className="btn"
                        disabled={page <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        이전
                    </button>
                    <span className="page-indicator">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
                    <button
                        className="btn"
                        disabled={page >= totalPages - 1}
                        onClick={() =>
                            setPage((p) =>
                                totalPages > 0 ? Math.min(totalPages - 1, p + 1) : p
                            )
                        }
                    >
                        다음
                    </button>
                </div>
            </div>

            <ToastContainer position="top-center" closeButton={false} icon={false}/>
        </div>
    );
};

export default PostsPanel;
