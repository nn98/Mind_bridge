import { useState, useRef, useEffect } from 'react';
import emailjs from 'emailjs-com';
import '../css/Picture.css';

const Toast = ({ message, show }) => (
  <div className={`toast-message ${show ? 'show' : ''}`}>
    {message}
  </div>
);

function EmailComposer({ customUser, isCustomLoggedIn }) {
  const form = useRef();
  const editorRef = useRef(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isCustomLoggedIn && !customUser) {
      setIsLoading(true);
      setUserInfo({ name: '사용자', email: '정보 로딩 중...' });
      return;
    }

    // 로그인 완료 상태
    if (isCustomLoggedIn && customUser) {
      setUserInfo({
        name: customUser.nickname || '사용자',
        email: customUser.email || '이메일 정보 없음'
      });
    }
    else {
      setUserInfo({
        name: '사용자',
        email: '로그인이 필요합니다.'
      });
    }
    setIsLoading(false);

  }, [customUser, isCustomLoggedIn]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== message) {
      editorRef.current.innerHTML = message;
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [message]);

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sendEmail = (e) => {
    e.preventDefault();
    if (!subject.trim() || !editorRef.current.textContent.trim()) {
      displayToast('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setIsSending(true);

    const serviceID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
    const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

    emailjs.sendForm(serviceID, templateID, form.current, publicKey)
      .then(() => {
        displayToast('메일이 성공적으로 전송되었습니다!');
        setSubject('');
        setMessage('');
      }, (error) => {
        displayToast('메일 전송에 실패했습니다: ' + error.text);
      })
      .finally(() => setIsSending(false));
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      displayToast('생성할 이미지에 대한 설명을 입력해주세요.');
      return;
    }
    setIsGenerating(true);

    const apiKey = process.env.REACT_APP_KEY;
    const apiAddress = process.env.REACT_APP_PICTURE_ADDRESS || 'https://api.openai.com/v1/images/generations';

    const promptTemplate = `
  쿄애니(京都アニメーション, Kyoto Animation) 스타일의 귀여운 $Picture 일러스트입니다.

  1. 그림은 $Picture 에서 요구하는 사항을 우선시 하며 가장 중요한 것은 감정이 보여야 한다.

  2. 요구하는 사항은 상담 결과를 제공하며 상황에 맞게 그림을 그려줘야 한다.

  3. 상담받는 사람이 볼 수 있기에 그림체는 강압적이지 않게 보여야 한다.

  `;

    try {
      const res = await fetch(apiAddress, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: promptTemplate,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error.message);

      const data = await res.json();
      const newImageUrl = data.data.data[0].url;
      const imageHtml = `<br><br><img src="${newImageUrl}" alt="${imagePrompt}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`;
      setMessage(prevMessage => prevMessage + imageHtml);

      displayToast('이미지가 생성되어 본문에 추가되었습니다!');
      setIsModalOpen(false);
      setImagePrompt('');

    } catch (err) {
      displayToast(`이미지 생성 실패: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentChange = (e) => {
    setMessage(e.currentTarget.innerHTML);
  };

  return (
    <>
      <Toast message={toastMessage} show={showToast} />
      <form ref={form} onSubmit={sendEmail} className="composer-container">
        <div className="composer-header">
          <button type="submit" className="composer-button send-button" disabled={isSending}>
            {isSending ? '전송 중...' : '보내기'}
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)} className="composer-button generate-button">
            이미지 생성
          </button>
        </div>

        <div className="field-row">
          <label className="field-label">보내는 사람</label>
          <span className="field-value">{isLoading ? '로딩 중...' : `${userInfo.name} <${userInfo.email}>`}</span>
        </div>

        <div className="field-row">
          <label className="field-label">받는사람</label>
          <span className="field-value">mindbridge2020@gmail.com</span>
        </div>

        <div className="field-row">
          <label htmlFor="title" className="field-label">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="제목을 입력하세요"
            className="field-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <div
            ref={editorRef}
            id="message-editor"
            className="composer-textarea"
            style={{ overflowY: 'auto' }}
            contentEditable="true"
            onInput={handleContentChange}
            suppressContentEditableWarning={true}
          ></div>
          <input type="hidden" name="name" value={userInfo.name} />
          <input type="hidden" name="email" value={userInfo.email} />
          <textarea
            name="message"
            value={message}
            readOnly
            style={{ display: 'none' }}
          />
        </div>
      </form>

      {isModalOpen && (
        <div className="modal-overlay3" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content3" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header3">
              <h3 className="modal-title3">AI 이미지 생성</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-button3">&times;</button>
            </div>
            <div className="modal-body3">
              <p className="modal-text3">
                생성하고 싶은 이미지에 대한 설명을 자세히 입력해주세요. <br />
                예시: "따뜻한 햇살 아래에서 편안하게 웃고 있는 사람"
              </p>
              <textarea
                rows="4"
                placeholder="이미지 설명 입력..."
                className="modal-textarea3"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-footer3">
              <button
                onClick={handleGenerateImage}
                className="composer-button generate-button"
                disabled={isGenerating}
              >
                {isGenerating ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailComposer;