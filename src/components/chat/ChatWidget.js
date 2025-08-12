import { useChatFlow } from "./hooks/useChatFlow";

// UI 컴포넌트
export default function ChatWidget({ setIsOpen, customUser }) {
    const {
        chatInput,
        setChatInput,
        chatHistory,
        isTyping,
        isChatEnded,
        chatEndRef,
        inputRef,
        handleSubmit,
        handleEndChat,
    } = useChatFlow({
        customUser,
        onClose: () => setIsOpen?.(false),
    });

    return (
        <div className="tab-content">
            <h3>AI 상담 챗봇</h3>
            <div className="chat-box" style={{ maxHeight: 400, overflowY: "auto" }}>
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`bubble ${msg.sender}`}>
                        {msg.message}
                    </div>
                ))}
                {isTyping && <div className="bubble ai typing">AI 응답 생성 중...</div>}
                <div ref={chatEndRef} />
            </div>

            <div className="input-wrapper">
                <textarea
                    ref={inputRef}
                    placeholder="메시지를 입력하세요..."
                    className="input-fixed"
                    value={chatInput}
                    onChange={(e) => {
                        setChatInput(e.target.value);
                        const el = e.target;
                        el.scrollTop = el.scrollHeight;
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    readOnly={isTyping || isChatEnded}
                />
                <button
                    className="chat-button1"
                    onClick={handleSubmit}
                    disabled={isTyping || isChatEnded}
                >
                    📩
                </button>
            </div>

            <button
                className="chat-button"
                onClick={handleEndChat}
                disabled={isTyping || isChatEnded}
            >
                상담 종료</button>
        </div>
    );
}
