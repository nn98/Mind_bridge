// src/components/admin/services/adminApi.js
import axios from "axios";
import { BACKEND_URL } from "../constants";

// 관리자 대시보드 통계
export const getAdminStats = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
    withCredentials: true,
  });
  return res.data;
};

// 모든 게시글 조회 (백엔드: /api/posts 가 배열 반환)
// search/sort/page/size는 프론트에서 처리
export const getAllPosts = async (
  token,
  { page = 0, size = 10, search = "", sort = "createdAt,desc" } = {}
) => {
  const res = await axios.get(`${BACKEND_URL}/api/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 원본 배열
  let arr = Array.isArray(res.data) ? [...res.data] : [];

  // 안전 접근 헬퍼
  const pick = (obj, keys) =>
    keys.find((k) => obj?.[k] !== undefined && obj?.[k] !== null);

  const getTitle = (p) => p[pick(p, ["title", "subject"])] ?? "";
  const getNick = (p) =>
    p.nickname ?? p.authorNickname ?? p.user?.nickname ?? p.author?.nickname ?? "";
  const getEmail = (p) =>
    p.email ?? p.authorEmail ?? p.user?.email ?? p.author?.email ?? "";
  const getCreated = (p) => p[pick(p, ["createdAt", "createdDate", "created_at", "regDate", "createdOn"])];

  // (1) 검색
  const q = search.trim().toLowerCase();
  if (q) {
    arr = arr.filter((p) => {
      const bucket = [getTitle(p), getNick(p), getEmail(p)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return bucket.includes(q);
    });
  }

  // (2) 정렬
  const [key, dir] = (sort || "").split(",");
  const isAsc = (dir || "asc").toLowerCase() === "asc";
  arr.sort((a, b) => {
    let av, bv;
    if (key === "title") {
      av = getTitle(a) || ""; bv = getTitle(b) || "";
    } else {
      // createdAt 계열 기본
      av = new Date(getCreated(a) || 0).getTime();
      bv = new Date(getCreated(b) || 0).getTime();
    }
    if (av < bv) return isAsc ? -1 : 1;
    if (av > bv) return isAsc ? 1 : -1;
    return 0;
  });

  // (3) 페이지네이션 (클라 사이드)
  const totalElements = arr.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = arr.slice(start, start + size);

  return { content, totalElements, totalPages, number: page, size };
};

// 게시글 삭제 (기존 백엔드: /api/posts/{id})
export const deletePostById = async (token, postId) => {
  await axios.delete(`${BACKEND_URL}/api/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
