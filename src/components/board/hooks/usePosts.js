import { useCallback, useEffect, useMemo, useState } from "react";
import { getPosts, createPost, updatePost, deletePost } from "../services/postsService";
import { visibilityToApi } from "../utils/visibility";

export const usePosts = (user) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getPosts();
            setPosts(Array.isArray(data) ? data : []);
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
            if (!user?.email) throw new Error("로그인 후 작성해주세요.");
            const payload = {
                content,
                visibility: visibilityToApi(visibility),
                userEmail: user.email,
                userNickname: user.nickname || "익명",
            };
            await createPost(payload);
            await fetchPosts();
        },
        [user, fetchPosts]
    );

    const editPost = useCallback(
        async (id, { content, visibility }) => {
            const v =
                visibility === "public" || visibility === "private" || visibility === "friends"
                    ? visibility
                    : visibilityToApi(visibility);

            const original = posts.find((p) => p.id === id);
            if (!original) throw new Error("수정할 게시글을 찾을 수 없습니다.");

            await updatePost(id, {
                content,
                visibility: v,
                userEmail: original.userEmail,
                userNickname: original.userNickname,
            });
            await fetchPosts();
        },
        [posts, fetchPosts]
    );

    const removePost = useCallback(
        async (id) => {
            await deletePost(id);
            await fetchPosts();
        },
        [fetchPosts]
    );

    return useMemo(
        () => ({ posts, loading, error, fetchPosts, addPost, editPost, removePost }),
        [posts, loading, error, fetchPosts, addPost, editPost, removePost]
    );
};
