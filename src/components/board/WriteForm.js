// src/components/board/WriteForm.jsx
import React, {useState, useRef, useEffect} from "react";

const VISIBILITY_LABELS = ["공개", "비공개"]; // 필요 시 '친구만' 추가

const WriteForm = ({onSubmit, onCancel}) => {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState("공개");
    const [submitting, setSubmitting] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef(null);

    const MAX_CHARS = 2000;

    useEffect(() => {
        setCharCount(content.length);
    }, [content]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleSubmit = async () => {
        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            textareaRef.current?.focus();
            return;
        }
        if (content.length > MAX_CHARS) {
            alert(`내용이 너무 깁니다. ${MAX_CHARS}자 이하로 입력해주세요.`);
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({content, visibility});
            setContent("");
            setVisibility("공개");
        } catch (e) {
            console.error(e);
            alert(e?.message || "게시글 작성에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <div className="write-form-overlay">
            <div className="write-form">
                <div className="form-header">
                    <h3 className="form-title">
                        <i className="form-icon">✏️</i>
                        새 게시글 작성
                    </h3>
                    <button
                        type="button"
                        className="form-close"
                        onClick={onCancel}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                <div className="form-body">
                    <div className="textarea-wrapper">
                        <textarea
                            ref={textareaRef}
                            placeholder="고민을 다같이 들어드립니다"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="content-textarea"
                            rows="8"
                            maxLength={MAX_CHARS}
                        />
                        <div className="textarea-footer">
                            <div className="char-count">
                                <span className={charCount > MAX_CHARS * 0.9 ? "warning" : ""}>
                                    {charCount.toLocaleString()}
                                </span>
                                <span className="max-chars">/ {MAX_CHARS.toLocaleString()}</span>
                            </div>
                            <div className="keyboard-hint">
                                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 빠른 등록
                            </div>
                        </div>
                    </div>

                    <div className="visibility-controls">
                        <span className="visibility-label">
                            <i className="visibility-icon">👁️</i>
                            공개 설정
                        </span>
                        <div className="visibility-group visibility-options">
                            {VISIBILITY_LABELS.map((label) => (
                                <label
                                    key={label}
                                    className={`visibility-option ${visibility === label ? "selected" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value={label}
                                        checked={visibility === label}
                                        onChange={(e) => setVisibility(e.target.value)}
                                    />
                                    <span className="option-icon">
                                        {label === "공개" ? "🌐" : label === "친구만" ? "👥" : "🔒"}
                                    </span>
                                    <span className="option-text">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-actions write-actions">
                    <button
                        type="button"
                        className="cancel-btn ghost"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        <i className="btn-icon">✕</i>
                        취소
                    </button>
                    <button
                        type="button"
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={submitting || !content.trim() || content.length > MAX_CHARS}
                    >
                        <i className="btn-icon">{submitting ? "⏳" : "📝"}</i>
                        {submitting ? "작성 중..." : "작성 완료"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WriteForm;