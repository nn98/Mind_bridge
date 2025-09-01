// src/components/EmailComposer.jsx
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import emailjs from 'emailjs-com';
import '../css/Picture.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Toast = ({ message, show }) => (
  <div className={`toast-message ${show ? 'show' : ''}`}>{message}</div>
);

/** AuthSection과 동일한 규약:
 * - localStorage("token")에 토큰 저장
 * - axios.defaults.headers.common.Authorization 로 기본 헤더 세팅
 * 이 규약을 그대로 따라 /api/users/me 에서 이메일을 가져온다.
 */
function getBearerFromAuthSection() {
  // 1) axios 기본 헤더 우선
  const fromAxios = axios.defaults?.headers?.common?.Authorization;
  if (fromAxios) return fromAxios;

  // 2) localStorage("token")
  const t = localStorage.getItem('token');
  if (!t) return null;
  // 이미 Bearer 접두어가 있다면 그대로, 아니면 붙여줌
  return t.toLowerCase().startsWith('bearer ') ? t : `Bearer ${t}`;
}

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

  // 1) 먼저 부모가 내려준 로그인 정보 사용
  useEffect(() => {
    if (isCustomLoggedIn && customUser) {
      setUserInfo({
        name: customUser.nickname || customUser.fullName || '사용자',
        email: customUser.email || '이메일 정보 없음',
      });
      setIsLoading(false);
      return;
    }

    if (isCustomLoggedIn && !customUser) {
      setIsLoading(true);
      setUserInfo({ name: '사용자', email: '정보 로딩 중...' });
      return;
    }

    // 2) 부모 props가 없으면, AuthSection 방식으로 토큰을 읽어 /api/users/me에서 불러오기
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const bearer = getBearerFromAuthSection();
        if (!bearer) {
          if (!mounted) return;
          setUserInfo({ name: '사용자', email: '로그인이 필요합니다.' });
          setIsLoading(false);
          return;
        }

        // AuthSection과 동일하게 withCredentials 사용
        const res = await axios.get(`${BACKEND_URL}/api/users/profile`, {
          withCredentials: true,
        });

        const raw = res?.data;
        const u = raw?.data ?? raw;
        const email = u?.email ?? '이메일 정보 없음';
        const name = u?.nickname || u?.fullName || u?.name || '사용자';

        if (!mounted) return;
        setUserInfo({ name, email });
      } catch (err) {
        if (!mounted) return;
        setUserInfo({ name: '사용자', email: '로그인이 필요합니다.' });
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customUser, isCustomLoggedIn]);

  // contentEditable ↔ state 동기화(커서 유지)
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

  const displayToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sendEmail = (e) => {
    e.preventDefault();
    if (!subject.trim() || !editorRef.current?.textContent?.trim()) {
      displayToast('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setIsSending(true);

    const serviceID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
    const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

    emailjs
      .sendForm(serviceID, templateID, form.current, publicKey)
      .then(() => {
        displayToast('메일이 성공적으로 전송되었습니다!');
        setSubject('');
        setMessage('');
      })
      .catch((error) => {
        displayToast('메일 전송에 실패했습니다: ' + (error?.text || error?.message || 'Unknown error'));
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
쿄애니(京都アニメーション, Kyoto Animation) 스타일의 귀여운 일러스트입니다.
1. 아래 설명을 최우선 반영: "${imagePrompt}"
2. 상담 맥락에 어울리도록 감정이 느껴지게.
3. 강압적이지 않고 편안한 분위기.
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const newImageUrl = data?.data?.[0]?.url
        ? data.data[0].url
        : data?.data?.[0]?.b64_json
          ? `data:image/png;base64,${data.data[0].b64_json}`
          : null;

      if (!newImageUrl) throw new Error('이미지 응답 파싱 실패');

      const imageHtml = `<br><br><img src="${newImageUrl}" alt="${imagePrompt.replace(/"/g, '&quot;')}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`;
      setMessage((prev) => prev + imageHtml);

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
          <span className="field-value">
            {isLoading ? '로딩 중...' : `${userInfo.name} <${userInfo.email}>`}
          </span>
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
            name="title"  // 현재 EmailJS 템플릿이 'title'을 참조한다면 유지하세요. (subject 쓰면 'subject'로 변경)
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
            contentEditable
            onInput={handleContentChange}
            suppressContentEditableWarning
          />
          {/* EmailJS 템플릿 변수명은 기존처럼 name/email 사용 */}
          <input type="hidden" name="name" value={userInfo.name} />
          <input type="hidden" name="email" value={userInfo.email} />
          <textarea name="message" value={message} readOnly style={{ display: 'none' }} />
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
              />
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
