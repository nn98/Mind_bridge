// src/components/email/EmailComposer.jsx
import { useEffect, useRef, useState } from 'react';
import '../../css/Picture.css';

import ToastMessage from './ToastMessage';
import ImageModal from './ImageModal';

import useContentEditable from './hooks/useContentEditable';
import getBearerFromAuthSection from './utils/auth/getBearerFromAuthSection';

import { fetchMyProfile } from './services/userService';
import { sendEmailForm } from './services/emailService';
import { generateImageFromPrompt } from './services/imageGenService';

function EmailComposer({ customUser, isCustomLoggedIn }) {
    const form = useRef();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [userInfo, setUserInfo] = useState({ name: '', email: '' });
    const [isLoading, setIsLoading] = useState(true);

    // contentEditable 훅
    const { bind } = useContentEditable(message, setMessage);

    // 1) 부모가 내려준 로그인 정보 우선
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

        // 2) 부모 props 없으면 토큰 읽어와 /api/users/profile 호출
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
                const profile = await fetchMyProfile();
                if (!mounted) return;
                setUserInfo(profile);
            } catch (e) {
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

    const displayToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const plainText = document.getElementById('message-editor')?.textContent?.trim();
        if (!subject.trim() || !plainText) {
            displayToast('제목과 내용을 모두 입력해주세요.');
            return;
        }
        try {
            setIsSending(true);
            await sendEmailForm(form.current);
            displayToast('메일이 성공적으로 전송되었습니다!');
            setSubject('');
            setMessage('');
        } catch (error) {
            displayToast('메일 전송에 실패했습니다: ' + (error?.text || error?.message || 'Unknown error'));
        } finally {
            setIsSending(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            displayToast('생성할 이미지에 대한 설명을 입력해주세요.');
            return;
        }
        try {
            setIsGenerating(true);
            const imageUrl = await generateImageFromPrompt(imagePrompt);
            const imageHtml = `<br><br><img src="${imageUrl}" alt="${imagePrompt.replace(/"/g, '&quot;')}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`;
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

    return (
        <>
            <ToastMessage message={toastMessage} show={showToast} />

            <form ref={form} onSubmit={onSubmit} className="composer-container">
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
                        name="title" // EmailJS 템플릿에서 사용하는 변수명 유지
                        placeholder="제목을 입력하세요"
                        className="field-input"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <div id="message-editor" className="composer-textarea" style={{ overflowY: 'auto' }} {...bind} />
                    {/* EmailJS 템플릿 변수명은 기존처럼 name/email/message 사용 */}
                    <input type="hidden" name="name" value={userInfo.name} />
                    <input type="hidden" name="email" value={userInfo.email} />
                    <textarea name="message" value={message} readOnly style={{ display: 'none' }} />
                </div>
            </form>

            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imagePrompt={imagePrompt}
                setImagePrompt={setImagePrompt}
                onGenerate={handleGenerateImage}
                isGenerating={isGenerating}
            />
        </>
    );
}

export default EmailComposer;
