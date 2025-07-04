import React, { useState, useRef, useEffect } from 'react';
const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

const questionOrder = [
  '이름을 입력해주세요.',
  '성별을 입력해주세요.',
  '나이를 입력해주세요.',
  '현재 상태를 간단히 적어주세요.',
  '상담받고 싶은 내용을 말씀해주세요.',
  '이전에 상담 경험이 있었나요?'
];

const fieldKeys = [
  '이름', '성별', '나이', '상태', '상담받고싶은내용', '이전상담경험'
];

const REACT_APP_KEY = `${apiKey}`; //키값 넣기

const Chat = () => {
  const [step, setStep] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([{ sender: 'ai', message: questionOrder[0] }]);
  const [form, setForm] = useState({
    이름: '', 성별: '', 나이: '', 상태: '', 상담받고싶은내용: '', 이전상담경험: ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (!chatInput.trim()) return;

    const currentKey = fieldKeys[step];
    const updatedValue = currentKey === '나이' ? parseInt(chatInput, 10) : chatInput;

    setChatHistory(prev => [...prev, { sender: 'user', message: chatInput }]);
    setForm(prev => ({ ...prev, [currentKey]: updatedValue }));
    setChatInput('');
    inputRef.current?.focus();

    setIsTyping(true);

    if (step < fieldKeys.length - 1) {
      // 다음 질문 출력
      setTimeout(() => {
        setChatHistory(prev => [...prev, { sender: 'ai', message: questionOrder[step + 1] }]);
        setStep(prev => prev + 1);
        setIsTyping(false);
      }, 700);
    } else {
      // 모든 질문 끝났으면 OpenAI API 호출
      await sendToOpenAI({ ...form, [currentKey]: updatedValue });
    }
  };

  const sendToOpenAI = async (finalForm) => {
    setChatHistory(prev => [...prev, { sender: 'ai', message: '상담 내용을 분석 중입니다...' }]);

    const systemPrompt = `
당신은 감정 분석과 상담 요약에 특화된 전문 상담사입니다.
다음 사용자 정보를 바탕으로 대화를 분석하고 상담 응답을 구성하세요:

이름: ${finalForm.이름}
성별: ${finalForm.성별}
나이: ${finalForm.나이}
상태: ${finalForm.상태}
상담 받고싶은 내용: ${finalForm.상담받고싶은내용}
이전 상담 경험: ${finalForm.이전상담경험}

다음 사항을 수행하세요:
1. 사용자의 발화에서 감정을 분석합니다. (예: 불안, 분노, 슬픔, 좌절 등)
2. 상담사로서 공감적인 첫 응답을 제공합니다.
3. 지금까지의 대화 내용을 바탕으로 요약을 제공합니다.
4. 세션이 종료된다고 판단되면 true를, 계속 진행 중이면 false를 반환합니다.

출력 형식은 다음 JSON 형식이어야 합니다:
{
  "감정": "<감정 분석 결과>",
  "상담사_응답": "<공감적이고 유도적인 문장>",
  "요약": "<지금까지의 상담 흐름 요약>",
  "세션_종료": true 또는 false
}
  `  ;

    try {
      const res = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${REACT_APP_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '상담을 시작해 주세요.' }
          ],
          temperature: 0.7
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('OpenAI 응답 오류:', data);
        setChatHistory(prev => [...prev, { sender: 'ai', message: 'AI 응답 오류 발생' }]);
        setIsTyping(false);
        return;
      }

      let result;
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        result = {
          감정: '분석 실패',
          상담사_응답: data.choices[0].message.content,
          요약: '형식 오류',
          세션_종료: false
        };
      }

      const botMessages = [
        result.상담사_응답
      ];

      if (result.세션_종료) {
        botMessages.push('상담이 종료되었습니다. 감사합니다.');
      }

      setChatHistory(prev => [
        ...prev.filter(msg => msg.message !== '상담 내용을 분석 중입니다...'),
        ...botMessages.map(m => ({ sender: 'ai', message: m }))
      ]);
    } catch (error) {
      console.error('에러 발생:', error);
      setChatHistory(prev => [...prev, { sender: 'ai', message: '서버 오류가 발생했습니다.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="tab-content">
      <h3>AI 상담 챗봇</h3>
      <div className="chat-box" style={{ maxHeight: 400, overflowY: 'auto' }}>
        {chatHistory.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.message}
          </div>
        ))}
        {isTyping && <div className="bubble ai typing">AI 응답 생성 중...</div>}
        <div ref={chatEndRef} />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="메시지를 입력하세요..."
        className="input-full"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        readOnly={isTyping}
      />
      <button className="chat-button" onClick={handleSubmit} disabled={isTyping}>
        입력
      </button>
    </div>

  );
};

export default Chat;