import React, { useState } from "react";
import { isOwner } from "./utils/auth";
import { visibilityToLabel } from "./utils/visibility";

const PostCard = ({ post, user, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(post.content);
    const [saving, setSaving] = useState(false);

    const canEdit = isOwner(post, user)||
    (user?.role && user.role.toUpperCase() === "ADMIN"); //관리자 권한이면 패스

    const save = async () => {
        if (!editingContent.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        try {
            setSaving(true);
            await onEdit(post.id, { content: editingContent, visibility: post.visibility });
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
            {isEditing ? (
                <div>
                    <textarea
                        className="edit-form"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                    />
                    <div className="post-actions">
                        <button className="post-edit1" disabled={saving} onClick={save}>
                            {saving ? "저장 중..." : "저장"}
                        </button>
                        <button className="post-delete1" onClick={() => setIsEditing(false)}>
                            취소
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {canEdit && (
                        <div className="post-action-icons">
                            <button className="post-edit" onClick={() => setIsEditing(true)}>
                                수정
                            </button>
                            <button className="post-delete" onClick={remove}>
                                x
                            </button>
                        </div>
                    )}

                    <p className="post-content">{post.content}</p>

                    <div className="post-meta">
                        <span>
                            {created} | {visibilityToLabel(post.visibility)}
                        </span>
                        <span>작성자: {post.userNickname || "익명"}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default PostCard;
