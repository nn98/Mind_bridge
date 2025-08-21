// src/components/chat/ChatWidget.js
import { useChatFlow } from "./hooks/useChatFlow";

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
        handleRestartChat,
    } = useChatFlow({ customUser, onClose: () => setIsOpen?.(false) });

    return (
        <div className="chat-container card">
            <div className="chat-header">
                <div className="chat-title">상담</div>
                <div className="chat-actions">
                    <button className="btn" onClick={handleRestartChat} disabled={isTyping}>
                        다시 시작
                    </button>
                </div>
            </div>

            <div className="chat-box">
                {chatHistory.map((m, idx) => (
                    <div key={idx} className={`msg ${m.sender === "ai" ? "ai" : "user"}`}>
                        <div className="bubble">{m.message}</div>
                    </div>
                ))}

                {isTyping && (
                    <div className="msg ai">
                        <div className="bubble">상담사가 답변을 작성 중이에요…</div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="chat-input-row">
                <input
                    ref={inputRef}
                    className="chat-input"
                    type="text"
                    placeholder={isChatEnded ? "상담이 종료되었습니다" : "메시지를 입력하세요"}
                    disabled={isTyping || isChatEnded}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                    className="btn chat-send"
                    onClick={handleSubmit}
                    disabled={isTyping || isChatEnded}
                    aria-label="메시지 전송"
                    title="메시지 전송"
                >
                    📩
                </button>
            </div>

            <button className="btn chat-end" onClick={handleEndChat} disabled={isTyping || isChatEnded}>
                상담 종료
            </button>
        </div>
    );
}
