// src/components/EmotionAnalysisPage.jsx
import { useState } from 'react';
import '../css/EmotionAnalysisPage.css';

const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

const emotionMessages = {
  happiness: [
    "행복한 순간을 마음껏 즐기세요! 그 기쁨이 오래도록 함께하길 바라요.",
    "당신의 행복이 주변까지 밝게 만드네요. 멋진 하루예요!",
    "웃는 모습이 정말 아름다워요. 계속해서 좋은 일만 가득하길 응원합니다.",
    "당신의 웃음이 훗 날 다른 사람에게 홀 씨 처럼 날아가 그 사람도 당신 처럼 웃을수 있게 해주세요."
  ],
  sadness: [
    "괜찮아요. 지금 느끼는 감정은 자연스러운 거예요. 충분히 슬퍼해도 괜찮아요.",
    "힘든 시간을 보내고 계시는군요. 당신은 혼자가 아니에요. 제가 곁에 있을게요.",
    "이 슬픔도 언젠가는 지나갈 거예요. 당신의 마음에도 곧 따스한 햇살이 비출 거예요.",
    "지금 당장 힘이 들고 언제 끝날지 모르는 길을 걷고 있다고 느낀다면 잠시 그 길에 앉아 숨을 돌려도 괜찮습니다 그 길은 그래도 되는 길입니다."
  ],
  anger: [
    "화가 나는 것은 당연한 감정이에요. 그 마음을 존중해요.",
    "잠시 심호흡을 하며 마음을 가다듬어 보는 건 어떨까요?",
    "답답한 마음이 풀릴 수 있도록, 당신의 이야기를 들어줄 사람이 필요하다면 언제든 찾아주세요.",
    "마음을 비우고 웃으려 노력하지 않아도 됩니다 때로는 남들에게 내 이야기를 해 볼 필요도 있어요."
  ],
  anxiety: [
    "불안한 마음이 드는군요. 안전하고 편안한 곳에서 잠시 쉬어가세요.",
    "미래에 대한 걱정보다, 지금 이 순간의 당신에게 집중해보세요. 당신은 충분히 잘하고 있어요.",
    "두려움은 용기의 또 다른 이름이래요. 당신 안의 용기를 믿어보세요.",
    "두려움이란 내가 아직 못 이겨낸걸 이겨 내 볼 수 있는 기회입니다 자기 자신을 믿어보세요."
  ],
  calmness: [
    "평온한 마음을 느끼고 계시는군요. 그 안정감이 당신을 더욱 단단하게 만들어 줄 거예요.",
    "마음의 평화를 찾으셨다니 다행이에요. 그 고요함을 즐겨보세요.",
    "차분한 당신의 모습이 보기 좋아요. 그 에너지를 다른 사람에게도 나눠주세요.",
    "따듯한 봄의 햇빛 처럼 보고만 있어도 마음이 편해지는 사람이 될 것입니다 그 감정을 다른 사람들과 나눠주세요."
  ],
  default: [
    "당신의 마음속 이야기를 들려주셔서 감사해요.",
    "어떤 감정이든 소중해요. 당신의 모든 감정을 존중하고 응원합니다.",
    "오늘 하루도 정말 수고 많으셨어요.",
    "당신이 있기에 웃는 사람들이 있습니다 감사합니다."
  ]
};

const emotionNames = {
  happiness: '행복',
  sadness: '슬픔',
  anger: '분노',
  anxiety: '불안',
  calmness: '평온',
};

/**
 * mode: "page" | "modal"
 * - "page": 대시보드 메인 영역에서 페이지로 사용
 * - "modal": 배경 딤 + 닫기 버튼 (모달처럼)
 *
 * 포커스 이슈 방지:
 * - 함수 내부에서 새 컴포넌트(Wrapper) 선언하지 않음
 * - key로 강제 리마운트 유발하지 않음
 */
export default function EmotionAnalysisPage({ mode = "page", isOpen, onClose }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (mode === "modal" && !isOpen) return null;

  const handleAnalyze = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const prompt = `
다음 문장을 감정별로 비율(%)로 분석해줘.
감정 카테고리: 행복, 슬픔, 분노, 불안, 평온
문장: "${text}"
결과는 JSON 형식으로 응답해줘. 예:
{ "happiness": 40, "sadness": 20, "anger": 10, "anxiety": 10, "calmness": 20 }`;

      const response = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        }),
      });
      const data = await response.json();
      if (!data.data.choices || data.data.choices.length === 0) throw new Error('OpenAI 응답 없음');
      const content = data.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');
      const percentages = JSON.parse(jsonMatch[0]);
      const dominantEmotion = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );
      const messages = emotionMessages[dominantEmotion] || emotionMessages.default;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setResult({ percentages, dominantEmotion, message: randomMessage });
    } catch (error) {
      console.error('OpenAI 호출/분석 오류:', error);
      alert('감정 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setText('');
    setResult(null);
    if (typeof onClose === 'function') onClose();
  };

  // 모달 모드일 때만 isOpen 체크 (명시적으로 true일 때만 렌더)
  if (mode === 'modal' && !isOpen) return null;

  // 공통 본문
  const Content = (
    <div className="analysis-card">
      {mode === 'modal' && (
        <button onClick={handleClose} id="emotion-modal-close-btn" aria-label="닫기">&times;</button>
      )}

      <h1 className="analysis-title">마음 상태 분석기</h1>
      <p className="analysis-subtitle">오늘 당신의 마음은 어떤가요? 당신의 이야기를 들려주세요.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="analysis-textarea"
        placeholder="예: 오늘 너무 행복한 하루였어. 친구랑 맛있는 것도 먹고 이야기도 많이 나눴거든."
      />

      <button
        onClick={handleAnalyze}
        disabled={isLoading || !text.trim()}
        className="analysis-button"
        type="button"
      >
        {isLoading ? <span>분석 중...</span> : '마음 분석하기'}
      </button>

      {isLoading && (
        <div className="loading-spinner-container">
          <div className="loading-spinner" />
        </div>
      )}

      {result && (
        <div className="results-section">
          <h2 className="results-title">분석 결과</h2>

          {result.percentages && (
            <div className="progress-bars-container">
              {Object.entries(result.percentages)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, value]) => {
                  const v = Number(value);
                  return (
                    <div key={emotion}>
                      <div className="progress-bar-label">
                        <span className="progress-bar-emotion-name">{emotionNames[emotion]}</span>
                        <span className="progress-bar-percentage">{v.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className={`progress-bar-fill ${emotion}`}
                          style={{ width: `${v}%` }}
                        >
                          {v > 10 && <span>{v.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className={`result-message-box ${result.dominantEmotion}`}>
            <p className="result-message-text">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );

  // 모달/페이지 모드 분기 (컴포넌트 선언 없이 div만 전환)
  if (mode === 'modal') {
    return (
      <div className="emotion-modal-backdrop" onClick={handleClose}>
        <div className="emotion-modal-content" onClick={(e) => e.stopPropagation()}>
          {Content}
        </div>
      </div>
    );
  }

  return <div className="emotion-page">{Content}</div>;
}
