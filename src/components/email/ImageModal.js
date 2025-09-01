// src/components/email/ImageModal.jsx
export default function ImageModal({
    isOpen,
    onClose,
    imagePrompt,
    setImagePrompt,
    onGenerate,
    isGenerating,
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay3" onClick={onClose}>
            <div className="modal-content3" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header3">
                    <h3 className="modal-title3">AI 이미지 생성</h3>
                    <button onClick={onClose} className="modal-close-button3">&times;</button>
                </div>
                <div className="modal-body3">
                    <p className="modal-text3">
                        생성하고 싶은 이미지에 대한 설명을 자세히 입력해주세요. <br />
                        예시: "따뜻한 햇살 아래에서 편안하게 웃고 있는 사람"
                    </p>
                    <textarea
                        rows="4"
                        placeholder="이미지 설명 입력..."
                        className="modal-textarea3"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                    />
                </div>
                <div className="modal-footer3">
                    <button
                        onClick={onGenerate}
                        className="composer-button generate-button"
                        disabled={isGenerating}
                    >
                        {isGenerating ? '생성 중...' : '생성하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
