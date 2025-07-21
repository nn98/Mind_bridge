import React, { useState } from 'react';
import '../css/EmotionAnalysisPage.css';
const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

// 각 감정별 키워드 (기존 메시지 활용)
const emotionMessages = {
  happiness: [
    "행복한 순간을 마음껏 즐기세요! 그 기쁨이 오래도록 함께하길 바라요.",
    "당신의 행복이 주변까지 밝게 만드네요. 멋진 하루예요!",
    "웃는 모습이 정말 아름다워요. 계속해서 좋은 일만 가득하길 응원합니다."
  ],
  sadness: [
    "괜찮아요. 지금 느끼는 감정은 자연스러운 거예요. 충분히 슬퍼해도 괜찮아요.",
    "힘든 시간을 보내고 계시는군요. 당신은 혼자가 아니에요. 제가 곁에 있을게요.",
    "이 슬픔도 언젠가는 지나갈 거예요. 당신의 마음에도 곧 따스한 햇살이 비출 거예요."
  ],
  anger: [
    "화가 나는 것은 당연한 감정이에요. 그 마음을 존중해요.",
    "잠시 심호흡을 하며 마음을 가다듬어 보는 건 어떨까요?",
    "답답한 마음이 풀릴 수 있도록, 당신의 이야기를 들어줄 사람이 필요하다면 언제든 찾아주세요."
  ],
  anxiety: [
    "불안한 마음이 드는군요. 안전하고 편안한 곳에서 잠시 쉬어가세요.",
    "미래에 대한 걱정보다, 지금 이 순간의 당신에게 집중해보세요. 당신은 충분히 잘하고 있어요.",
    "두려움은 용기의 또 다른 이름이래요. 당신 안의 용기를 믿어보세요."
  ],
  calmness: [
    "평온한 마음을 느끼고 계시는군요. 그 안정감이 당신을 더욱 단단하게 만들어 줄 거예요.",
    "마음의 평화를 찾으셨다니 다행이에요. 그 고요함을 즐겨보세요.",
    "차분한 당신의 모습이 보기 좋아요. 그 에너지를 다른 사람에게도 나눠주세요."
  ],
  default: [
    "당신의 마음속 이야기를 들려주셔서 감사해요.",
    "어떤 감정이든 소중해요. 당신의 모든 감정을 존중하고 응원합니다.",
    "오늘 하루도 정말 수고 많으셨어요."
  ]
};

const emotionNames = {
  happiness: '행복',
  sadness: '슬픔',
  anger: '분노',
  anxiety: '불안',
  calmness: '평온',
};

const EmotionAnalysisPage = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {

    setIsLoading(true);
    setResult(null);

    try {
      const prompt = `
다음 문장을 감정별로 비율(%)로 분석해줘.
감정 카테고리: 행복, 슬픔, 분노, 불안, 평온
문장: "${text}"

결과는 JSON 형식으로 응답해줘. 예:
{
  "happiness": 40,
  "sadness": 20,
  "anger": 10,
  "anxiety": 10,
  "calmness": 20
}
`;

      const response = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        }),
      });

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenAI 응답이 없습니다.');
      }

      const content = data.choices[0].message.content;

      // JSON 추출 (간단 정규식)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');

      const percentages = JSON.parse(jsonMatch[0]);

      const dominantEmotion = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );

      const messages = emotionMessages[dominantEmotion] || emotionMessages.default;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      setResult({
        percentages,
        dominantEmotion,
        message: randomMessage,
      });
    } catch (error) {
      console.error('OpenAI 호출/분석 오류:', error);
      alert('감정 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="emotion-analysis-page">
      <div className="analysis-card">
        <h1 className="analysis-title">마음 상태 분석기</h1>
        <p className="analysis-subtitle">
          오늘 당신의 마음은 어떤가요? 당신의 이야기를 들려주세요.
        </p>

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
        >
          {isLoading ? <span className="loading-indicator">분석 중</span> : '마음 분석하기'}
        </button>

        {isLoading && (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {result && (
          <div className="results-section">
            <h2 className="results-title">분석 결과</h2>

            {result.percentages && (
              <div className="progress-bars-container">
                {Object.entries(result.percentages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, value]) => (
                    <div key={emotion}>
                      <div className="progress-bar-label">
                        <span className="progress-bar-emotion-name">{emotionNames[emotion]}</span>
                        <span className="progress-bar-percentage">{value.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className={`progress-bar-fill ${emotion}`}
                          style={{ width: `${value}%` }}
                        >
                          {value > 10 && <span>{value.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className={`result-message-box ${result.dominantEmotion}`}>
              <p className="result-message-text">{result.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionAnalysisPage;
