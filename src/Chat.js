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
  '이름', '성별', '나이', '상태', '상담받고싶은내용', '이전상담경험'
];

const API_KEY = ''; //키값 넣기

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

  const handleSubmit = async () => {
    if (!chatInput.trim()) return;

    const currentKey = fieldKeys[step];
    const updatedValue = currentKey === '나이' ? parseInt(chatInput, 10) : chatInput;

    setChatHistory(prev => [...prev, { sender: 'user', message: chatInput }]);
    setForm(prev => ({ ...prev, [currentKey]: updatedValue }));
    setChatInput('');
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
당신은 감정 분석, 심리 상담, 그리고 대화 요약에 특화된 고급 AI 상담사입니다.
당신의 임무는 사용자 정보를 기반으로 세밀한 감정 이해와 공감적인 응답을 통해 심층적인 상담을 제공하는 것입니다.

[사용자 프로필]
- 이름: ${finalForm.이름}
- 성별: ${finalForm.성별}
- 나이: ${finalForm.나이}
- 현재 상태: ${finalForm.상태}
- 상담받고 싶은 내용: ${finalForm.상담받고싶은내용}
- 이전 상담 경험: ${finalForm.이전상담경험}

[분석 및 응답 절차]
1. 사용자의 최근 발화 내용을 기반으로 감정을 **다양하고 세부적으로** 분석하세요.
   - 다음은 감정 분석 예시입니다:  
     - 1차 감정: 불안, 분노, 슬픔, 외로움, 무기력, 우울, 죄책감, 수치심, 초조함, 공허함, 상실감, 혼란, 지침, 자괴감, 후회, 지루함, 억울함, 서운함, 두려움, 자포자기, 억눌림
     - 2차 감정 또는 긍정적 신호: 희망, 안도, 의욕, 감사, 안정감, 유대감, 연결감, 궁금증, 호기심, 성취감, 기대감
     - 1,2차 감정 결과 발화 내용이 중립적이면 감정 결과 중립으로 표현이 가능함
   - 감정은 복합적으로 표기하며 각 감정의 강도도 함께 기술합니다.
   - 예시: "슬픔(강함), 공허함(중간), 희망(약함)"

2. 상담사 응답은 다음 구조를 포함하세요:
   - **정확한 감정 파악 및 공감**: 사용자의 말에 반응하며 감정의 정당성을 인정
   - **정서적 지지 및 안심 표현**: "그럴 수 있어요", "괜찮아요", "충분히 힘드셨겠어요" 등의 말투 사용
   - **탐색 유도형 질문 포함**: 사용자가 스스로를 돌아볼 수 있게 유도
   - **필요 시 가벼운 행동 유도**: 일상 루틴, 감정 표현, 타인과의 연결 등

3. 지금까지의 대화를 기반으로 다음을 포함한 요약을 생성하세요:
   - 주요 고민 및 발화에서 나타난 핵심 감정 키워드
   - 감정의 변화 또는 패턴
   - 상담사가 제공한 주요 개입 또는 정서 반영 요지
   - 향후 상담에서 참고할 만한 포인트 (선택적)

4. 세션 종료 판단 기준:
   - 사용자가 다음과 같은 문장을 사용할 경우: "도움 됐어요", "고마워요", "여기까지 할게요", "다음에 또 이야기할게요" → true
   - 그렇지 않다면 기본값은 false

[출력 형식  반드시 아래 JSON 형태로 출력할 것]
{
  "감정": "<복합 감정 및 강도 표기. 예: '불안(중간), 공허함(강함), 희망(약함)'>",
  "상담사_응답": "<공감적이고 유도적인 상담사 문장. 예: ‘공허하고 무기력한 기분이 계속되셨군요. 그런 감정은 누구에게나 지치는 법이에요. 혹시 가장 힘들게 느껴졌던 순간은 언제였을까요?’>",
  "요약": "<지금까지의 대화 흐름과 감정 변화, 상담사 개입 내용 요약. 최대 500자>",
  "세션_종료": true 또는 false
}
`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
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
        type="text"
        placeholder="메시지를 입력하세요..."
        className="input-full"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={isTyping}
      />
      <button className="button" onClick={handleSubmit} disabled={isTyping}>
        입력
      </button>
    </div>
    
  );
};

export default Chat;
