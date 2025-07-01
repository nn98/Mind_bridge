import React from 'react';
import { testQuestions, getDetailedResult } from '../constants/selfTestData';

const scoreMap = {
  '거의 없다': 0,
  '가끔그렇다': 1,
  '자주그렇다': 2,
  '거의매일그렇다': 3,
};

const SelfTest = ({ testType, setTestType, selfAnswers, handleSelfAnswer, handleSelfSubmit, resultText, setSelfAnswers, setResultText }) => {
  const submitAnswers = () => {
    const numericAnswers = selfAnswers.map(ans => scoreMap[ans] ?? 0);
    const totalScore = numericAnswers.reduce((sum, val) => sum + val, 0);
    const result = getDetailedResult(testType, totalScore);
    handleSelfSubmit(result);
  };

  return (
    <section className="form-section2">
      <h2 className="form-title"><strong>성인 테스트</strong></h2>

      <div className="test-type-selector">
        {['우울증', '불안장애', '스트레스'].map((type) => (
          <div
            key={type}
            onClick={() => setTestType(type)}
            className={`test-type-option ${testType === type ? 'active' : ''}`}
          >
            {type}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}></div>
      <h3 className="test-subtitle">한국인 {testType} 척도</h3>
      <p><strong>출처 :</strong> 보건복지부 국립정신건강센터(한국인정신건강척도)</p>
      <p>
        이 검사는 {testType} 정도를 알아보기 위한 것입니다. 최근 2주간 각 문항에 해당하는 증상을 얼마나 자주 경험하였는지 확인하고 해당하는 값을 선택해 주세요.<br />
        (가끔그렇다: 주2일 이상, 자주그렇다: 1주이상, 거의매일그렇다: 거의 2주)
      </p>

      <ul className="self-test-list">
        {testQuestions[testType].map((question, index) => (
          <li key={index} className="self-test-item">
            <p>{index + 1}. {question}</p>
            <div className="self-option-group">
              {['거의 없다', '가끔그렇다', '자주그렇다', '거의매일그렇다'].map((option, i) => (
                <label key={i} className="self-option">
                  <input
                    type="radio"
                    name={`q${index}`}
                    value={option}
                    checked={selfAnswers[index] === option}
                    onChange={() => handleSelfAnswer(index, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '1.5rem' }}>
        <button className="self-button" onClick={submitAnswers}>검사 제출</button>
        <button className="self-button" onClick={() => {
          setSelfAnswers(Array(testQuestions[testType].length).fill(''));
          setResultText('');
        }}
        >
          다시하기
        </button>
      </div>

      {resultText && resultText.categories && (
        <div className="result-card">
          <h2 className="result-title">검사 결과</h2>
          <h3 className="result-subtitle">{resultText.title}</h3>
          <p className="result-description">{resultText.description}</p>
          {Object.entries(resultText.categories).map(([category, items], idx) => (
            <div key={idx} className="result-category-block">
              <p className="result-category-title">✅ {category}</p>
              <ul className="recommendation-list">
                {items.map((item, index) => (
                  <li key={index}>· {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SelfTest;