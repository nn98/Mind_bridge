// src/components/admin/services/adminApi.js
import axios from "axios";
import {BACKEND_URL as BACKEND_URL_FROM_CONST} from "../constants";

/* ===============================
   ENV & RUNTIME GUARDS
================================ */
// Vite/CRA 모두 지원 (예약어 'import'는 쓰지 않고 import.meta만 가드)
const isDev =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.MODE !== "production") ||
    (typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV !== "production");

/* ===============================
   BASE URL & AXIOS
================================ */

const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// 경로 합성 유틸: // 제거, 앞/뒤 슬래시 정리
const trimEndSlash = (s) => {
    if (typeof s !== "string") return "";
    return s.replace(/\/+$/, "");
};
const trimStartSlash = (s = "") => s.replace(/^\/+/, "");
const joinPath = (...parts) =>
    "/" +
    parts
        .filter(Boolean)
        .map((p) => trimStartSlash(p))
        .join("/")
        .replace(/\/{2,}/g, "/");

const BACKEND_URL = trimEndSlash(RAW_BACKEND_URL);

// 공통 axios 인스턴스
const api = axios.create({
    baseURL: BACKEND_URL || undefined,
    withCredentials: true,
});

// 요청 인터셉터: localStorage의 token을 자동 부착 (LOGIN 문자열은 쿠키세션용 마커로 간주)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "LOGIN" && !config.headers?.Authorization) {
        config.headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

/** 외부에서 토큰 강제 세팅/해제 */
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        localStorage.removeItem("token");
        delete api.defaults.headers.common.Authorization;
    }
};

/* ===============================
   공용 유틸 (정렬/검색/페이지)
================================ */
const pick = (obj, keys) =>
    keys.find((k) => obj?.[k] !== undefined && obj?.[k] !== null);

const getCreated = (p) =>
    p[
        pick(p, [
            "createdAt",
            "createdDate",
            "created_at",
            "regDate",
            "createdOn",
            "joinedAt",
            "signupAt",
        ])
        ];

const sortArray = (arr, sort) => {
    const [key = "createdAt", dir = "desc"] = (sort || "").split(",");
    const isAsc = (dir || "asc").toLowerCase() === "asc";

    return [...arr].sort((a, b) => {
        let av, bv;

        switch (key) {
            case "title": {
                const getTitle = (p) => p[pick(p, ["title", "subject"])] ?? "";
                av = getTitle(a) || "";
                bv = getTitle(b) || "";
                break;
            }
            case "id": {
                const aKey = pick(a, ["id", "postId", "boardId", "userId"]) || "id";
                const bKey = pick(b, ["id", "postId", "boardId", "userId"]) || "id";
                const anum = Number(a[aKey]);
                const bnum = Number(b[bKey]);
                if (Number.isFinite(anum) && Number.isFinite(bnum)) {
                    av = anum;
                    bv = bnum;
                } else {
                    av = a[aKey] ?? "";
                    bv = b[bKey] ?? "";
                }
                break;
            }
            case "nickname": {
                const getNick = (p) =>
                    p.nickname ??
                    p.authorNickname ??
                    p.userNickname ??
                    p.user?.nickname ??
                    p.author?.nickname ??
                    "";
                av = String(getNick(a)).toLowerCase();
                bv = String(getNick(b)).toLowerCase();
                break;
            }
            case "email": {
                const getEmail = (p) =>
                    p.email ??
                    p.authorEmail ??
                    p.userEmail ??
                    p.user?.email ??
                    p.author?.email ??
                    "";
                av = String(getEmail(a)).toLowerCase();
                bv = String(getEmail(b)).toLowerCase();
                break;
            }
            case "createdAt":
            default: {
                av = new Date(getCreated(a) || 0).getTime();
                bv = new Date(getCreated(b) || 0).getTime();
            }
        }

        if (av < bv) return isAsc ? -1 : 1;
        if (av > bv) return isAsc ? 1 : -1;
        return 0;
    });
};

const searchArray = (arr, q, fieldsFn) => {
    const term = (q || "").trim().toLowerCase();
    if (!term) return arr;

    return arr.filter((item) => {
        const bucket = fieldsFn(item).filter(Boolean).join(" ").toLowerCase();
        return bucket.includes(term);
    });
};

const paginateArray = (arr, page = 0, size = 10) => {
    const totalElements = arr.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / Math.max(1, size)));
    const start = page * size;
    const content = arr.slice(start, start + size);
    return {content, totalElements, totalPages, number: page, size};
};

const looksLikePageResponse = (body) =>
    Array.isArray(body?.content) || Array.isArray(body?.data?.content);

/* ===============================
   ADMIN: 대시보드 통계 (백엔드에 있다고 가정)
================================ */
export const getAdminStats = async () => {
    const path = joinPath("/api/admin/stats");
    const res = await api.get(path);
    console.log(`res: ${JSON.stringify(res)}`);
    return res.data?.data ?? res.data;
};

/* ===============================
   Posts (기존 유지)
================================ */
export const getAllPosts = async ({
                                      page = 0,
                                      size = 10,
                                      search = "",
                                      sort = "createdAt,desc",
                                  } = {}) => {
    const res = await api.get(joinPath("/api/posts"), {
        params: {page, size, search, sort},
    });
    const body = res.data?.data ?? res.data;

    // 1) 서버가 Page 포맷 제공 → 그대로
    if (looksLikePageResponse(body)) {
        return body?.data ?? body;
    }

    // 2) 배열만 제공 → 프론트에서 처리
    let arr = Array.isArray(body) ? [...body] : [];

    const fields = (p) => {
        const getTitle = (x) => x[pick(x, ["title", "subject"])] ?? "";
        const getNick = (x) =>
            x.nickname ??
            x.authorNickname ??
            x.user?.nickname ??
            x.author?.nickname ??
            "";
        const getEmail = (x) =>
            x.email ?? x.authorEmail ?? x.user?.email ?? x.author?.email ?? "";
        return [getTitle(p), getNick(p), getEmail(p)];
    };

    arr = searchArray(arr, search, fields);
    arr = sortArray(arr, sort);
    return paginateArray(arr, page, size);
};

export const deletePostById = async (postId) => {
    const path = joinPath("/api/posts", String(postId));
    await api.delete(path);
};

/* ===============================
   Users — UserController에 맞춘 API
   (목록 API 없음 → summary/프로필/단건 중심)
================================ */

/** 회원가입 */
export const registerUser = async (payload) => {
    const res = await api.post(joinPath("/api/users/register"), payload);
    return res.data?.data ?? res.data; // Profile
};

/** 이메일 중복 확인 */
export const checkEmail = async (email) => {
    const res = await api.get(joinPath("/api/users/check-email"), {
        params: {email},
    });
    return res.data?.data ?? res.data; // { isAvailable: boolean }
};

/** 닉네임 중복 확인 */
export const checkNickname = async (nickname) => {
    const res = await api.get(joinPath("/api/users/check-nickname"), {
        params: {nickname},
    });
    return res.data?.data ?? res.data; // { isAvailable: boolean }
};

/** 현재 로그인 사용자 프로필 (민감 캐시 금지 헤더는 서버에서 처리) */
export const getUserProfile = async () => {
    const res = await api.get(joinPath("/api/users/account"));
    return res.data?.data ?? res.data; // Profile
};

/** 닉네임으로 사용자 요약 조회 */
export const getUserSummary = async (nickname) => {
    const res = await api.get(joinPath("/api/users/summary"), {
        params: {nickname},
    });
    return res.data?.data ?? res.data; // Summary
};

/** 사용자 정보 수정 */
export const updateUser = async (updateRequest) => {
    const res = await api.put(joinPath("/api/users/update"), updateRequest);
    return res.data?.data ?? res.data; // Profile
};

/** 비밀번호 변경 */
export const changePassword = async (newPassword) => {
    const res = await api.put(joinPath("/api/users/password"), {newPassword});
    return res.data?.data ?? res.data; // "비밀번호가 성공적으로 변경되었습니다."
};

/** 회원 탈퇴 */
export const deleteAccount = async () => {
    const res = await api.delete(joinPath("/api/users/account"));
    return res.data?.data ?? res.data; // "회원 탈퇴가 완료되었습니다."
};

/* ===============================
   getAllUsers (목록 API 부재 대응)
   - search(닉네임)가 주어지면 summary 단건을 리스트처럼 반환
   - 없으면 빈 페이지네이션 반환
================================ */
export const getAllUsers = async ({
                                      page = 0,
                                      size = 10,
                                      search = "",
                                      sort = "createdAt,desc",
                                  } = {}) => {
    const term = (search || "").trim();

    // 닉네임으로 탐색 시 summary 1건을 리스트처럼 포장
    if (term) {
        try {
            const summary = await getUserSummary(term); // 닉네임 정확 일치 전제(UserController 설계상)
            if (summary) {
                // summary를 테이블에서 다루기 쉬운 형태로 가볍게 매핑 (필드명은 프로젝트에 맞게 조정해도 됨)
                const row = {
                    id: summary?.id ?? summary?.userId ?? undefined,
                    nickname: summary?.nickname ?? "",
                    email: summary?.email ?? "",
                    // 필요 시 더 매핑: phoneNumber, createdAt 등
                };
                return paginateArray([row], 0, Math.max(1, size));
            }
        } catch (e) {
            if (isDev) console.warn("[getAllUsers] summary fetch failed:", e);
            // summary 실패 시 아래 빈 목록으로 폴백
        }
    }

    // 목록 API가 없으므로 빈 목록 반환 (화면은 정상 동작)
    if (isDev) {
        console.warn(
            "[getAllUsers] User list endpoint not provided. Returning empty page."
        );
    }
    return paginateArray([], page, size);
};

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || "";
        if (status === 401 || status === 403 || (status === 400 && msg.includes("사용자를 찾을 수 없습니다"))) {
            // 인증/식별 불가 → 토큰 제거
            try {
                localStorage.removeItem("token");
            } catch {
            }
        }
        return Promise.reject(error);
    }
);
