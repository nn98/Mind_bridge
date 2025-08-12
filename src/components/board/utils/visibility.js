export const visibilityToApi = (label) => {
    const map = { "공개": "public", "비공개": "private", "친구만": "friends" };
    return map[label] || "public";
};

export const visibilityToLabel = (api) => {
    const map = { public: "공개", private: "비공개", friends: "친구만" };
    return map[api] || "공개";
};
