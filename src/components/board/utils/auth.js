// 현재 정책: 닉네임으로 소유자 판단 (백엔드가 이메일 기준이면 바꿔도 OK)
export const isOwner = (post, user) =>
    post?.userEmail && user?.email && post.userNickname === user.nickname;
