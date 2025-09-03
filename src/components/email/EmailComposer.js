// src/components/email/EmailComposer.jsx
import {useEffect, useRef, useState} from "react";
import "../../css/Picture.css"; // ← 여기에 아래 CSS를 넣어도 됩니다.

import ToastMessage from "./ToastMessage";
import ImageModal from "./ImageModal";

import useContentEditable from "./hooks/useContentEditable";
import getBearerFromAuthSection from "./utils/auth/getBearerFromAuthSection";

import {fetchMyProfile} from "./services/userService";
import {sendEmailForm} from "./services/emailService";
import {generateImageFromPrompt} from "./services/imageGenService";

function EmailComposer({customUser, isCustomLoggedIn}) {
    const form = useRef();

    // 메일 작성 상태
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // 이미지 생성 모달
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePrompt, setImagePrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // 토스트
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    // 사용자
    const [userInfo, setUserInfo] = useState({name: "", email: ""});
    const [isLoading, setIsLoading] = useState(true);

    // Gmail 창 동작 상태
    const [isCollapsed, setIsCollapsed] = useState(false); // 최소화(헤더만)
    const [isExpanded, setIsExpanded] = useState(false); // 팝아웃/확대 + 배경 딤
    const [isHidden, setIsHidden] = useState(false); // 아래로 숨김(닫기)

    // contentEditable 훅
    const {bind} = useContentEditable(message, setMessage);

    // 1) 부모가 내려준 로그인 정보 우선
    useEffect(() => {
        if (isCustomLoggedIn && customUser) {
            setUserInfo({
                name: customUser.nickname || customUser.fullName || "사용자",
                email: customUser.email || "이메일 정보 없음",
            });
            setIsLoading(false);
            return;
        }

        if (isCustomLoggedIn && !customUser) {
            setIsLoading(true);
            setUserInfo({name: "사용자", email: "정보 로딩 중..."});
            return;
        }

        // 2) 부모 props 없으면 토큰 읽어와 /api/users/account 호출
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const bearer = getBearerFromAuthSection();
                if (!bearer) {
                    if (!mounted) return;
                    setUserInfo({name: "사용자", email: "로그인이 필요합니다."});
                    setIsLoading(false);
                    return;
                }
                const profile = await fetchMyProfile();
                if (!mounted) return;
                setUserInfo(profile);
            } catch (e) {
                if (!mounted) return;
                setUserInfo({name: "사용자", email: "로그인이 필요합니다."});
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
        const plainText = document
            .getElementById("message-editor")
            ?.textContent?.trim();
        if (!subject.trim() || !plainText) {
            displayToast("제목과 내용을 모두 입력해주세요.");
            return;
        }
        try {
            setIsSending(true);
            await sendEmailForm(form.current);
            displayToast("메일이 성공적으로 전송되었습니다!");
            setSubject("");
            setMessage("");
        } catch (error) {
            displayToast(
                "메일 전송에 실패했습니다: " +
                (error?.text || error?.message || "Unknown error")
            );
        } finally {
            setIsSending(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            displayToast("생성할 이미지에 대한 설명을 입력해주세요.");
            return;
        }
        try {
            setIsGenerating(true);
            const imageUrl = await generateImageFromPrompt(imagePrompt);
            const imageHtml = `<br><br><img src="${imageUrl}" alt="${imagePrompt.replace(
                /"/g,
                "&quot;"
            )}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`;
            setMessage((prev) => prev + imageHtml);
            displayToast("이미지가 생성되어 본문에 추가되었습니다!");
            setIsModalOpen(false);
            setImagePrompt("");
        } catch (err) {
            displayToast(`이미지 생성 실패: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Gmail 윈도우 버튼 핸들러
    const onMinimize = () => setIsCollapsed((v) => !v); // 언더바
    const onExpand = () => {
        // ↗ 팝아웃
        setIsHidden(false);
        setIsCollapsed(false);
        setIsExpanded((v) => !v);
    };
    const onClose = (e) => {
        e?.stopPropagation?.();
        setIsExpanded(false);   // 딤 제거
        setIsCollapsed(false);  // 최소화 해제(선택 사항이지만 화면 상태 일관성에 도움)
        setIsHidden(true);      // 창 숨김
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setIsExpanded(false);
                setIsCollapsed(false);
                setIsHidden(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // 팝아웃시 바디 스크롤 잠금/해제
    useEffect(() => {
        if (isExpanded) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [isExpanded]);

    return (
        <>
            <ToastMessage message={toastMessage} show={showToast}/>

            {/* ▽ 팝아웃 배경(딤). 클릭하면 원복 */}
            {isExpanded && (
                <div
                    className="composer-backdrop show"
                    onClick={() => setIsExpanded(false)}
                    aria-hidden="true"
                />
            )}

            {/* 상태 클래스 토글 */}
            <form
                ref={form}
                onSubmit={onSubmit}
                className={`composer-container ${isCollapsed ? "is-collapsed" : ""} ${
                    isHidden ? "is-hidden" : ""
                } ${isExpanded ? "is-expanded" : ""}`}
            >
                {/* 헤더: 창 컨트롤 버튼들 */}
                <div className="composer-header">
                    <div className="win-group">
                        {/* 최소화 */}
                        <button
                            type="button"
                            className="win-btn"
                            onClick={onMinimize}
                            title="최소화"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                stroke="currentColor"
                            >
                                <path d="M5 19h14"/>
                            </svg>
                        </button>
                        {/* 팝아웃/원복 */}
                        <button
                            type="button"
                            className="win-btn"
                            onClick={onExpand}
                            title={isExpanded ? "원래 크기" : "팝아웃"}
                        >
                            {isExpanded ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                >
                                    <path d="M10 14L4 20M4 14v6h6"/>
                                    <path d="M14 10l6-6M14 4h6v6"/>
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                >
                                    <path d="M14 4h6v6"/>
                                    <path d="M10 14l10-10"/>
                                </svg>
                            )}
                        </button>
                        {/* 닫기 */}
                        <button
                            type="button"
                            className="win-btn"
                            onClick={onClose}
                            title="닫기"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                stroke="currentColor"
                            >
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 정보 필드 */}
                <div className="field-row">
                    <label className="field-label">보내는 사람</label>
                    <span className="field-value">
            {isLoading ? "로딩 중..." : `${userInfo.name} <${userInfo.email}>`}
          </span>
                </div>

                <div className="field-row">
                    <label className="field-label">받는사람</label>
                    <span className="field-value">mindbridge2020@gmail.com</span>
                </div>

                <div className="field-row">
                    <label htmlFor="title" className="field-label">
                        제목
                    </label>
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

                {/* 본문 에디터 */}
                <div
                    id="message-editor"
                    className="composer-textarea"
                    style={{overflowY: "auto"}}
                    {...bind}
                />

                {/* 하단 버튼 바(오른쪽 정렬) */}
                <div className="composer-bottom">
                    <button
                        type="submit"
                        className="composer-button send-button"
                        disabled={isSending}
                    >
                        {isSending ? "전송 중..." : "보내기"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="composer-button generate-button"
                    >
                        이미지 생성
                    </button>
                </div>

                {/* EmailJS 템플릿 변수 */}
                <input type="hidden" name="name" value={userInfo.name}/>
                <input type="hidden" name="email" value={userInfo.email}/>
                <textarea
                    name="message"
                    value={message}
                    readOnly
                    style={{display: "none"}}
                />
            </form>

            {/* 숨김 상태에서 다시 띄우는 FAB */}
            <button
                type="button"
                className={`composer-fab ${isHidden ? "show" : ""}`}
                onClick={() => setIsHidden(false)}
            >
                메일 작성
            </button>

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
