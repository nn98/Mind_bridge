import React, { useState } from 'react';

const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_PICTURE_ADDRESS;

const promptTemplate = `
쿄애니(京都アニメーション, Kyoto Animation) 스타일의 귀여운 $Picture 일러스트입니다.
1. 그림은 $Picture 에서 요구하는 사항을 우선시 하며 가장 중요한 것은 감정이 보여야 한다.
2. 요구하는 사항은 상담 결과를 제공하며 상황에 맞게 그림을 그려줘야 한다.
3. 상담받는 사람이 볼 수 있기에 그림체는 강압적이지 않게 보여야 한다.
`;

function App() {
  const [userInput, setUserInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async () => {
    setLoading(true);
    setError('');
    setImageUrl('');

    try {
      const finalPrompt = promptTemplate.replace(/\$Picture/g, userInput.trim() || 'dog');

      const res = await fetch(apiAddress, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: finalPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error.message || 'API 요청 실패');
      }

      const data = await res.json();
      setImageUrl(data.data[0].url);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '60px auto',
        padding: '30px 24px',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        background: '#fff',
        fontFamily: 'Pretendard, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', color: '#333' }}>상담 감정 일러스트 생성기</h1>

      <input
        type="text"
        placeholder="감정 또는 상황을 입력하세요"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '1rem',
          borderRadius: 8,
          border: '1px solid #ccc',
          marginBottom: 16,
        }}
      />

      <button
        onClick={generateImage}
        disabled={loading || !userInput.trim()}
        style={{
          backgroundColor: '#6c63ff',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: 8,
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'background 0.3s',
        }}
      >
        {loading ? '이미지를 생성 중...' : '이미지 생성'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>⚠️ {error}</p>}

      {imageUrl && (
        <div style={{ marginTop: 24 }}>
          <img
            src={imageUrl}
            alt="생성된 일러스트"
            style={{
              width: '100%',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
