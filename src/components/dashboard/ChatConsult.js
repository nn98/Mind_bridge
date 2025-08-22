// src/components/dashboard/ChatConsult.jsx
import { useEffect, useMemo } from "react";
import { useChatFlow } from "../chat/hooks/useChatFlow";

export default function ChatConsult({ customUser }) {
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
  } = useChatFlow({
    customUser,
    onClose: undefined,
    askProfileIfMissing: false,
    disableQuestionnaire: true,
    fieldsToAsk: ["상담받고싶은내용", "이전상담경험"],
    introMessage:
      "로그인 정보를 확인했어요. 상담받고 싶은 내용을 말씀해주세요.",
    enforceGreeting: true,
    autoStartFromProfile: false,
  });

  const lastUserQuery = useMemo(() => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].sender === "user") return chatHistory[i].message;
    }
    return "";
  }, [chatHistory]);

  // 새 메시지/타이핑 변화 시 항상 맨 밑(입력칸)으로 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatHistory, isTyping, chatEndRef]);

  // 입력창 포커스 유지
  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="consult-wrap">
      {/* 상단 고정 헤더 */}
      <div className="consult-header">
        <div className="consult-logo">MindBridge</div>
        <h1 className="consult-title">
          {lastUserQuery || "무엇이든 물어보세요"}
        </h1>
      </div>

      {/* 메시지 영역만 스크롤 */}
      <div className="consult-stream" role="log" aria-live="polite">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`consult-bubble ${msg.sender}`}>
            {msg.message}
          </div>
        ))}
        {isTyping && (
          <div className="consult-bubble ai typing">AI 응답 생성 중…</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 하단 입력창: 화면 하단에 고정 */}
      <form
        className="consult-inputbar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <textarea
          ref={inputRef}
          className="consult-input"
          placeholder="질문을 입력하고 Enter를 누르세요. (Shift+Enter 줄바꿈)"
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value);
            const el = e.target;
            el.style.height = "0px";
            el.style.height = Math.min(el.scrollHeight, 200) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          readOnly={isTyping || isChatEnded}
          rows={1}
        />

        <div className="consult-actions">
          {!isChatEnded ? (
            <>
              <button
                type="submit"
                className="consult-send"
                disabled={isTyping || !chatInput.trim()}
              >
                보내기
              </button>
              <button
                type="button"
                className="consult-end"
                onClick={handleEndChat}
                disabled={isTyping}
              >
                종료
              </button>
            </>
          ) : (
            <button
              type="button"
              className="consult-send"
              onClick={() => {
                handleRestartChat();
                inputRef.current?.focus();
              }}
            >
              새 상담 시작
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
