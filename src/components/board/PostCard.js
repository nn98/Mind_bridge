// PostCard.jsx
import React, {useMemo, useState} from "react";
import {isOwner} from "./utils/auth";
import {visibilityToLabel} from "./utils/visibility";
import {useAuth} from "../../AuthContext";

const PostCard = ({post, onEdit, onDelete, onFeature}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(post.content || "");
    const [saving, setSaving] = useState(false);
    const {profile} = useAuth();

    const role = profile?.role?.toUpperCase();
    const canEdit = isOwner(post, profile) || role === "ADMIN";

    // 길면 '더보기' 노출(대략 2~3줄 기준으로 100~120자)
    const SHOW_MORE_THRESHOLD = 110;
    const isLong = useMemo(
        () => (post?.content || "").trim().length > SHOW_MORE_THRESHOLD,
        [post?.content]
    );

    const created = (post.createdAt || post.date || "").split("T")[0];

    const save = async () => {
        if (!editingContent.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        try {
            setSaving(true);
            await onEdit(post.id, {
                content: editingContent,
                visibility: post.visibility,
            });
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

    return (
        <div className="post-card">
            {/* 우상단 X = 삭제 */}
            {canEdit && (
                <button className="post-delete" onClick={remove} aria-label="삭제">
                    x
                </button>
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
                    <button className="post-delete1" onClick={() => setIsEditing(false)}>
                        취소
                    </button>
                </>
            ) : (
                <>
                    {/* 본문 2줄만 노출 */}
                    <p className="post-content line-clamp-2">{post.content}</p>

                    {/* 길면 '더보기' → 텍스트 링크 */}
                    {isLong && (
                        <button
                            className="post-more-link"
                            onClick={() => onFeature?.(post)}
                            aria-label="해당 게시글 더보기"
                            type="button"
                        >
                            더보기
                        </button>
                    )}

                    <span>
            {created} | {visibilityToLabel(post.visibility)}
          </span>
                    <span>작성자: {post.userNickname || "익명"}</span>

                    {/* 수정 버튼은 편집 중이 아닐 때만 노출 → 저장/취소와 겹침 방지 */}
                    {canEdit && !isEditing && (
                        <button className="post-edit" onClick={() => setIsEditing(true)}>
                            수정
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default PostCard;
