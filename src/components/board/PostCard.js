// PostCard.jsx
import React, { useMemo, useState } from "react";
import { isOwner } from "./utils/auth";
import { visibilityToLabel } from "./utils/visibility";
import { useAuth } from "../../AuthContext";

const PostCard = ({ post, onEdit, onDelete, onFeature }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(post.content || "");
    const [saving, setSaving] = useState(false);
    const { profile } = useAuth();

    const role = profile?.role?.toUpperCase();
    const canEdit = isOwner(post, profile) || role === "ADMIN";

    // “길이 판정”은 대략값. 필요하면 숫자만 조정(한글 120~160자 ≈ 4줄)
    const SHOW_MORE_THRESHOLD = 140;
    const isLong = useMemo(
        () => (post?.content || "").trim().length > SHOW_MORE_THRESHOLD,
        [post?.content]
    );

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

    const created = (post.createdAt || post.date || "").split("T")[0];

    return (
        <div className="post-card">
            {canEdit && (
                <>
                    <button className="post-delete" onClick={remove} aria-label="삭제">x</button>
                    <button className="post-edit" onClick={() => setIsEditing(true)}>수정</button>
                </>
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
                    {/* 4줄까지만 보이기 */}
                    <p className="post-content line-clamp-4">{post.content}</p>

                    {/* 길면 “더보기” */}
                    {isLong && (
                        <button
                            className="post-more"
                            onClick={() => onFeature?.(post)}
                            aria-label="해당 게시글 더보기"
                        >
                            더보기
                        </button>
                    )}

                    <span>
                        {created} | {visibilityToLabel(post.visibility)}
                    </span>
                    <span>작성자: {post.userNickname || "익명"}</span>
                </>
            )}
        </div>
    );
};

export default PostCard;
