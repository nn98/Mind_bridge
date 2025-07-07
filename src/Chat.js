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
사용자가 작성한 텍스트를 바탕으로 분석하여 상담 내용을 준비하십시오. 한국어로 사용자의 구체적인 요구와 상황에 맞춘 서비스를 제공합니다.

이름: ${finalForm.이름}
성별: ${finalForm.성별}
나이: ${finalForm.나이}
상태: ${finalForm.상태}
상담 받고싶은 내용: ${finalForm.상담받고싶은내용}
이전 상담 경험: ${finalForm.이전상담경험}

사용자가 제공한 글을 통해 상담 응답을 생성합니다. 데이터를 활용하여 사용자의 상태와 요구에 가장 적합한 세션을 구성합니다. 상호작용의 모든 내용을 JSON 형식으로 기록하며, 자동 데이터베이스 삽입을 위해 문자열로 반환됩니다.

1. 사용자가 작성한 텍스트를 분석하여 내용을 파악합니다.
2. 텍스트에서 드러나는 사용자의 정서를 읽고 적절한 반응을 준비합니다.
3. 텍스트에 기반한 상담 세션을 준비, 진행하며 사용자가 제시한 정보를 바탕으로 통합합니다.
4. 사용자와의 상호작용 및 감정을 문서화합니다.
5. 상담이 사용자에게 유익했음을 알리거나 끝난다고 판단될 때 세션을 종료합니다.
6. 세션의 모든 데이터를 JSON 형식으로 구조화하고 웹 플랫폼 반환을 위해 문자열로 변환합니다.

# Steps

1. **텍스트 분석:**
   - 사용자가 제공한 텍스트의 의미를 이해합니다.
   - 텍스트에서 사용자의 상태 및 필요를 확인합니다.
   - 텍스트 정보를 통해 맞춤형 상담 접근 방식을 준비합니다.

2. **상담 과정:**
   - 텍스트에 드러난 요구와 상태에 맞춰 대화를 열고 지지적인 환경을 조성합니다.
   - 사용자의 현재 상태에 기반하여 상담을 효과적으로 진행합니다.
   - 상담 도중 사용자의 반응에 맞춰 조정합니다.

3. **세션 문서화:**
   - 사용자와의 상호작용을 모두 기록합니다.
   - 텍스트에서 드러난 감정을 구체적으로 문서화합니다.

4. **세션 종료:**
   - 사용자가 준비되었거나 세션이 종료될 때 적절하게 세션을 마무리합니다.

5. **데이터 구조화 및 반환:**
   - 세션 데이터를 JSON 객체로 구조화합니다.
   - JSON 데이터를 웹 플랫폼을 위한 문자열로 변환합니다.

# 출력 형식
- 상담사의 간결한 응답

# Notes

- 데이터의 기밀성과 무결성을 보장하십시오.
- 사용자의 감정과 요구에 민감하게 대응하십시오.
- JSON에서 민감한 데이터를 노출하지 않도록 주의하십시오.
- 사용자 요구에 맞춘 적응 가능한 지침을 마련하되, 간결한 문장을 유지하십시오.
- 초기 사용자 텍스트 외부에서 추가 정보를 요구하지 않은 채로 진행하십시오.
  `  ;

    try {
      const res = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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