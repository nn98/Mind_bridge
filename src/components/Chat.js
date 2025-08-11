import { useState, useRef, useEffect } from "react";
const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;
//ㅊㄱ
const BACKEND_URL = "http://localhost:8080";

const questionOrder = [
  "이름을 입력해주세요.",
  "성별을 입력해주세요.",
  "나이를 입력해주세요.",
  "현재 상태를 간단히 적어주세요.",
  "상담받고 싶은 내용을 말씀해주세요.",
  "이전에 상담 경험이 있었나요?",
];

const fieldKeys = [
  "이름",
  "성별",
  "나이",
  "상태",
  "상담받고싶은내용",
  "이전상담경험",
];

const Chat = ({ setIsOpen, customUser }) => {
  const [step, setStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", message: questionOrder[0] },
  ]);
  const [form, setForm] = useState({
    이름: "",
    성별: "",
    나이: "",
    상태: "",
    상담받고싶은내용: "",
    이전상담경험: "",
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const chatEndRef = useRef(null);

  //////////customUser
  useEffect(() => {
    if (!customUser) return;

    console.log("✅ Chat 컴포넌트 customUser:", customUser);

    const prefill = {
      이름: customUser.fullName || customUser.nickname || "",
      성별: customUser.gender || "",
      나이: customUser.age || "",
      상태: customUser.mentalState || customUser.status || "",
    };

    let filledCount = 0;
    fieldKeys.forEach((key) => {
      if (prefill[key]) filledCount++;
    });

    setForm((prev) => ({
      ...prev,
      ...prefill,
    }));

    setStep(filledCount);
    setChatHistory([
      { sender: "ai", message: questionOrder[filledCount] },
    ]);
  }, [customUser]); // ✅ props가 바뀔 때마다 다시 실행됨

  //////////

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (!chatInput.trim()) return;

    const currentKey = fieldKeys[step];
    const updatedValue =
      currentKey === "나이" ? parseInt(chatInput, 10) : chatInput;

    setChatHistory((prev) => [...prev, { sender: "user", message: chatInput }]);
    setForm((prev) => ({ ...prev, [currentKey]: updatedValue }));
    setChatInput("");
    inputRef.current?.focus();

    setIsTyping(true);

    if (step < fieldKeys.length - 1) {
      // 다음 질문 출력
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", message: questionOrder[step + 1] },
        ]);
        setStep((prev) => prev + 1);
        setIsTyping(false);
      }, 700);
    } else {
      // 모든 질문 끝났으면 OpenAI API 호출
      await sendToOpenAI({ ...form, [currentKey]: updatedValue });
    }
  };

  const sendToOpenAI = async (finalForm) => {
    setChatHistory((prev) => [
      ...prev,
      { sender: "ai", message: "상담 내용을 분석 중입니다..." },
    ]);

    const systemPrompt = `
    사용자가 작성한 텍스트를 바탕으로 분석하여 상담 내용을 준비하십시오. 
상담사는 다음의 원칙에 따라 응답을 생성합니다:

## 기본 규칙

1. 공감에만 머무르지 말고, 반드시 **상황에 맞는 구체적이고 실행 가능한 조언**을 포함합니다.
2. 상담사는 말투가 반복되지 않도록 다양한 표현을 사용해야 합니다.
3. 상담사의 응답은 항상 "공감 → 조언 → 대화 유도 질문" 흐름을 따릅니다.
4. 상담사 응답의 말투는 **사용자의 나이에 따라 달라집니다** (아래 규칙 참조).
5. 세션 종료 여부는 문맥에 따라 true 또는 false로 설정합니다.
6. 최종 출력은 JSON 형식이어야 하며, 웹 플랫폼 삽입을 위해 문자열로 반환 가능한 형태여야 합니다.


---

## 사용자 정보

이름: ${finalForm.이름}  
성별: ${finalForm.성별}  
나이: ${finalForm.나이}  
상태: ${finalForm.상태}  
상담 받고싶은 내용: ${finalForm.상담받고싶은내용}  
이전 상담 경험: ${finalForm.이전상담경험}  

## 회차 간 자연스러운 흐름 유지 지침

- 상담사는 대화 중간에 **불필요한 인사("안녕하세요", "저는 ○○입니다" 등)를 반복하지 않습니다.**
- 첫 응답 이후에는 **사용자 이름을 과하게 반복하지 말고**, 이전 맥락을 자연스럽게 이어가는 방식으로 응답합니다.
- 예외적으로 사용자가 **새로운 주제를 꺼냈을 경우**에 한해, 부드러운 전환 문장(“그 이야기 들으니 생각난 게 있어요” 등)을 사용할 수 있습니다.
- 상담사는 매 응답마다 **처음부터 다시 시작하는 느낌을 주지 않도록**, **사용자의 마지막 발화를 기억하고 이어서 말하는** 방식으로 응답을 구성합니다.


---

## 나이대별 상담사 말투 규칙

- **05세 ~ 15세**: 또래 친구처럼 친근하고 캐주얼한 말투 (예: “~했구나”, “나도 그런 적 있어, "안녕! ${finalForm.이름}아")  
- **16세 ~ 29세**: 자연스러운 대화체, 편안하지만 구체적인 조언 포함 (예: “그럴 수 있어요”, “이럴 땐 이런 걸 해보는 것도 좋아요”, "안녕하세요 ${finalForm.이름}님")  
- **30세 ~ 39세**: 현실적인 조언 중심, 존중이 느껴지는 말투 (예: “이럴 경우 이렇게 해보시는 것도 도움이 됩니다”, ","안녕하세요 ${finalForm.이름}님")  
- **50대 이상**: 정중하고 예의 바른 존댓말 중심, 인생 경험을 존중하는 어조 (예: “지금까지 잘 견뎌오셨습니다. 다음으로는 이런 방법도 고려해보시면 좋겠습니다”,"안녕하세요 ${finalForm.이름}님")

---
## 상담사 응답 형식

출력은 다음 JSON 형식으로 작성하십시오:

{
  "감정": "<사용자의 상태, 말투, 감정 단서 등을 분석한 감정 요약>",
  "상담사_응답": "<1) 공감 → 2) 실질적 조언 → 3) 다음 대화 유도를 반드시 포함>",
  "요약": "<지금까지의 상담 흐름 요약. 문제 인식 및 제시된 조언 포함>",
  "세션_종료": true 또는 false
}

      `;

    try {
      const res = await fetch(`${apiAddress}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "상담을 시작해 주세요." },
          ],
          temperature: 0.7,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("OpenAI 응답 오류:", data);
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", message: "AI 응답 오류 발생" },
        ]);
        setIsTyping(false);
        return;
      }

      let result;
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        result = {
          감정: "분석 실패",
          상담사_응답: data.choices[0].message.content,
          요약: "형식 오류",
          세션_종료: false,
        };
      }

      const botMessages = [result.상담사_응답];

      if (result.세션_종료) {
        botMessages.push("상담이 종료되었습니다. 감사합니다.");
      }

      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.message !== "상담 내용을 분석 중입니다..."),
        ...botMessages.map((m) => ({ sender: "ai", message: m })),
      ]);
    } catch (error) {
      console.error("에러 발생:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", message: "서버 오류가 발생했습니다." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndChat = async () => {
    try {
      const token = localStorage.getItem("token");  // 토큰 꺼내기

      if (!token) { //없으면 백 
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/counselling/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,  // 여기 추가
        },
        body: JSON.stringify({
          email: customUser?.email || "", // 이메일 필요
          userCounsellingSummation: form.상태 || "",
          userCounsellingEmotion: form.상담받고싶은내용 || "",
          counselorSummation: "",
        }),
      });

      if (!response.ok) {
        throw new Error("DB 저장 실패");
      }
      console.log("✅ DB 저장 완료");
    } catch (err) {
      console.error("❌ DB 저장 중 오류:", err);
    }

    setChatHistory((prev) => [
      ...prev,
      { sender: "ai", message: "상담이 종료되었습니다. 이용해 주셔서 감사합니다." },
    ]);
    setIsChatEnded(true);

    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  };

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
};

export default Chat;
