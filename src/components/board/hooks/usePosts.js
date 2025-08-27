import { useCallback, useEffect, useMemo, useState } from "react";
import { getPosts, createPost, updatePost, deletePost } from "../services/postsService";
import { visibilityToApi } from "../utils/visibility";
import { useAuth } from "../../../AuthContext";

export const usePosts = () => {
    const { profile } = useAuth();                // 전역 프로필 사용
    const isLoggedIn = !!profile;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const list = await getPosts();
            setPosts(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("게시글 불러오기 실패:", e);
            setError("게시글을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const addPost = useCallback(
        async ({ content, visibility }) => {
            if (!isLoggedIn || !profile?.email) throw new Error("로그인 후 작성해주세요.");
            const payload = {
                content,
                visibility: visibilityToApi(visibility),
                userEmail: profile.email,
                userNickname: profile.nickname || "익명",
            };
            await createPost(payload);
            await fetchPosts();
        },
        [isLoggedIn, profile, fetchPosts]
    );

    const editPost = useCallback(
        async (id, { content, visibility }) => {
            if (!isLoggedIn || !profile?.email) throw new Error("로그인 후 수정해주세요.");
            const v =
                visibility === "public" || visibility === "private" || visibility === "friends"
                    ? visibility
                    : visibilityToApi(visibility);

            const original = posts.find((p) => p.id === id);
            if (!original) throw new Error("수정할 게시글을 찾을 수 없습니다.");

            // 서버가 작성자 일치 검증을 하겠지만, 클라이언트에서도 가드
            await updatePost(id, {
                content,
                visibility: v,
                userEmail: original.userEmail,
                userNickname: original.userNickname,
            });
            await fetchPosts();
        },
        [isLoggedIn, profile, posts, fetchPosts]
    );

    const removePost = useCallback(
        async (id) => {
            if (!isLoggedIn || !profile?.email) throw new Error("로그인 후 삭제해주세요.");
            await deletePost(id);
            await fetchPosts();
        },
        [isLoggedIn, profile, fetchPosts]
    );

    return useMemo(
        () => ({ posts, loading, error, fetchPosts, addPost, editPost, removePost, isLoggedIn, profile }),
        [posts, loading, error, fetchPosts, addPost, editPost, removePost, isLoggedIn, profile]
    );
};
