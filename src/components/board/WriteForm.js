import React, { useState } from "react";

const VISIBILITY_LABELS = ["공개", "비공개"]; // 필요 시 '친구만' 추가

const WriteForm = ({ onSubmit, onCancel }) => {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState("공개");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        try {
            setSubmitting(true);
            await onSubmit({ content, visibility });
            setContent("");
            setVisibility("공개");
        } catch (e) {
            console.error(e);
            alert(e?.message || "게시글 작성에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="write-form">
            <textarea
                placeholder="고민을 다같이 들어드립니다"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="visibility-group">
                {VISIBILITY_LABELS.map((label) => (
                    <label key={label}>
                        <input
                            type="radio"
                            name="visibility"
                            value={label}
                            checked={visibility === label}
                            onChange={(e) => setVisibility(e.target.value)}
                        />
                        {label}
                    </label>
                ))}
            </div>
            <div className="write-actions">
                <button disabled={submitting} onClick={handleSubmit}>
                    {submitting ? "작성 중..." : "작성 완료"}
                </button>
                <button className="ghost" onClick={onCancel}>
                    취소
                </button>
            </div>
        </div>
    );
};

export default WriteForm;
