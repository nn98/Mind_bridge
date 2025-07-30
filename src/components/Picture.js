import React, { useState, useEffect } from 'react';

const Toast = ({ message, show }) => (

  <div style={{
    visibility: show ? 'visible' : 'hidden',
    opacity: show ? 1 : 0,
    minWidth: 250,
    marginLeft: '-125px',
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '16px',
    position: 'fixed',
    zIndex: 1,
    left: '50%',
    bottom: '30px',
    transition: 'visibility 0.5s, opacity 0.5s linear'
  }}>
    {message}
  </div>
);

function App() {
  const [userInput, setUserInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gallery, setGallery] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [aspectRatio, setAspectRatio] = useState('1024x1024');
  const [imageFilter, setImageFilter] = useState('none');

  const apiKey = process.env.REACT_APP_KEY;
  const apiAddress = process.env.REACT_APP_PICTURE_ADDRESS;

  const promptTemplate = `
  쿄애니(京都アニメーション, Kyoto Animation) 스타일의 귀여운 $Picture 일러스트입니다.
  1. 그림은 $Picture 에서 요구하는 사항을 우선시 하며 가장 중요한 것은 감정이 보여야 한다.
  2. 요구하는 사항은 상담 결과를 제공하며 상황에 맞게 그림을 그려줘야 한다.
  3. 상담받는 사람이 볼 수 있기에 그림체는 강압적이지 않게 보여야 한다.
  `;

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    try {
      const savedGallery = localStorage.getItem('illustrationGallery');
      if (savedGallery) setGallery(JSON.parse(savedGallery));
    } catch (e) { console.error("갤러리 로딩에 실패했습니다.", e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('illustrationGallery', JSON.stringify(gallery));
  }, [gallery]);

  const generateImage = async () => {
    if (!userInput.trim()) {
      setError('생성할 이미지에 대한 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setImageUrl('');
    setImageFilter('none');

    try {
      const finalPrompt = promptTemplate.replace(/\$Picture/g, userInput.trim());

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
          size: aspectRatio,
          quality: 'standard',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error.message || 'API 요청 실패');
      }

      const data = await res.json();
      const newImageUrl = data.data[0].url;

      setImageUrl(newImageUrl);
      if (!gallery.includes(newImageUrl)) {
        setGallery([newImageUrl, ...gallery].slice(0, 10));
      }
      displayToast('이미지가 성공적으로 생성되었습니다!');

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };


  const sendEmail = () => {
    if (!email.trim()) { setError('전송할 이메일 주소를 입력해주세요.'); return; }
    setEmailSending(true);
    setError('');
    setTimeout(() => {
      displayToast(`'${email}'로 메일이 전송되었습니다. (테스트)`);
      setEmailSending(false);
    }, 1000);
  };

  const downloadImage = () => {
    window.open(imageUrl, '_blank');
    displayToast('새 탭에서 이미지를 열었습니다. 우클릭으로 저장하세요!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      displayToast('이미지 주소가 클립보드에 복사되었습니다.');
    }, () => { setError('주소 복사에 실패했습니다.'); });
  };

  const clearGallery = () => {
    setGallery([]);
    displayToast('갤러리를 모두 비웠습니다.');
  };

  const AspectRatioButton = ({ value, label }) => {
    const isSelected = aspectRatio === value;
    return (
      <button
        onClick={() => setAspectRatio(value)}
        style={{
          padding: '8px 16px',
          border: isSelected ? '2px solid #6c63ff' : '2px solid #ccc',
          borderRadius: 8,
          background: isSelected ? '#e9e7ff' : '#fff',
          color: isSelected ? '#6c63ff' : '#555',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
      >{label}</button>
    );
  }

  return (
    <>
      <Toast message={toastMessage} show={showToast} />
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '30px 24px', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: '#fff', fontFamily: 'Pretendard, sans-serif' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', color: '#333', textAlign: 'center' }}>상담 감정 일러스트 생성기</h1>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="감정 또는 상황을 입력하세요"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ width: '100%', padding: '12px 50px 12px 16px', fontSize: '1rem', borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: 16 }}>
          <AspectRatioButton value="1024x1024" label="1:1" />
          <AspectRatioButton value="1024x1792" label="9:16" />
          <AspectRatioButton value="1792x1024" label="16:9" />
        </div>

        <button onClick={generateImage} disabled={loading || !userInput.trim()} style={{ backgroundColor: '#6c63ff', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 8, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', transition: 'background 0.3s' }}>
          {loading ? '이미지를 생성 중...' : '이미지 생성'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}

        {imageUrl && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <img src={imageUrl} alt="생성된 일러스트" style={{ width: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', filter: imageFilter, transition: 'filter 0.3s ease' }} />

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button title="흑백 필터" onClick={() => setImageFilter('grayscale(100%)')} style={{ background: '#6c63ff', border: '1px solid #ccc', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>흑백</button>
              <button title="옛날 사진 느낌의 필터" onClick={() => setImageFilter('sepia(100%)')} style={{ background: '#6c63ff', border: '1px solid #ccc', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>옛날 사진 느낌의 필터</button>
              <button title="필터 초기화" onClick={() => setImageFilter('none')} style={{ background: '#6c63ff', border: '1px solid #ccc', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>원본</button>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button title="이미지 다운로드" onClick={downloadImage} style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }}>다운로드</button>
              <button title="이미지 주소 복사" onClick={copyToClipboard} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }}>주소 복사</button>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <input type="email" placeholder="전송할 이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc' }} />
              <button onClick={sendEmail} disabled={emailSending || !email.trim()} style={{ backgroundColor: '#e9e7ff', color: 'black', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: emailSending ? 'not-allowed' : 'pointer' }}>{emailSending ? '전송 중...' : '전송하기'}</button>
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div style={{ marginTop: 32, borderTop: '1px solid #eee', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#555', margin: 0 }}>최근 이미지</h2>
              <button onClick={clearGallery} style={{ background: 'none', border: '1px solid #ccc', color: '#555', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>갤러리 비우기</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {gallery.map((imgSrc) => (<img key={imgSrc} src={imgSrc} alt="갤러리 이미지" onClick={() => { setImageUrl(imgSrc); setImageFilter('none'); }} style={{ width: 80, height: 80, borderRadius: 8, margin: '0 8px 8px 0', cursor: 'pointer', objectFit: 'cover', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
