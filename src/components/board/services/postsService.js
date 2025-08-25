import apiClient from "./apiClient";

export const getPosts = async () => {
    const res = await apiClient.get("/api/posts", { withCredentials: true });
    console.log(`getPosts ${JSON.stringify(res.data)}`);
    return res.data.data;
};

export const createPost = async (payload) => {
    const res = await apiClient.post("/api/posts", payload, { withCredentials: true });
    return res.data;
};

export const updatePost = async (id, payload) => {
    const res = await apiClient.put(`/api/posts/${id}`, payload, { withCredentials: true });
    return res.data;
};

export const deletePost = async (id) => {
    const res = await apiClient.delete(`/api/posts/${id}`, { withCredentials: true });
    return res.data;
};
