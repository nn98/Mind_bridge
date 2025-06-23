import React, { useState, useRef, useEffect } from 'react';

const questionOrder = [
  '이름을 입력해주세요.',
  '성별을 입력해주세요.',
  '나이를 입력해주세요.',
  '현재 상태를 간단히 적어주세요.',
  '상담받고 싶은 내용을 말씀해주세요.',
  '이전에 상담 경험이 있었나요?'
];

const fieldKeys = [
  '이름',
  '성별',
  '나이',
  '상태',
  '상담받고싶은내용',
  '이전상담경험'
];

function Chat() {
  const [step, setStep] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [form, setForm] = useState({
    이름: '',
    성별: '',
    나이: '',
    상태: '',
    상담받고싶은내용: '',
    이전상담경험: ''
  });
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', message: questionOrder[0] }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSubmit = async () => {
    if (!chatInput.trim()) return;

    const currentKey = fieldKeys[step];
    const updatedValue = currentKey === '나이' ? parseInt(chatInput, 10) : chatInput;

    setChatHistory(prev => [...prev, { sender: 'user', message: chatInput }]);
    setForm(prev => ({ ...prev, [currentKey]: updatedValue }));
    setChatInput('');
    setIsTyping(true);

    if (step < fieldKeys.length - 1) {
      const nextQuestion = questionOrder[step + 1];
      setTimeout(() => {
        setChatHistory(prev => [...prev, { sender: 'ai', message: nextQuestion }]);
        setStep(prev => prev + 1);
        setIsTyping(false);
      }, 700);
    } else {
      await sendToBackend({ ...form, [currentKey]: updatedValue });
    }
  };

  const sendToBackend = async (finalForm) => {
    setChatHistory(prev => [...prev, { sender: 'ai', message: '상담 내용을 분석 중입니다...' }]);
    try {
      const response = await fetch('http://localhost:8080/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm)
      });
      const data = await response.json();

      const botMessages = [
        `감정 분석 결과: ${data.감정}`,
        data.상담사_응답,
        `요약: ${data.요약}`
      ];

      if (data.세션_종료) {
        botMessages.push('세션이 종료되었습니다. 감사합니다.');
      }

      setChatHistory(prev => [
        ...prev.filter(msg => msg.message !== '상담 내용을 분석 중입니다...'),
        ...botMessages.map(m => ({ sender: 'ai', message: m }))
      ]);
    } catch (error) {
      setChatHistory(prev => [...prev, { sender: 'ai', message: '서버 오류가 발생했습니다.' }]);
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="tab-content">
      <h3>AI 상담 챗봇</h3>
      <div className="chat-box">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.message}
          </div>
        ))}
        {chatInput.trim() && (
          <div className="bubble user typing">입력 중...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <input
        type="text"
        placeholder="메시지를 입력하세요..."
        className="input-full"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button className="button" onClick={handleSubmit}>입력</button>
    </div>
  );
}

export default Chat;
