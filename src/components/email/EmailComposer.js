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

        // 2) 부모 props 없으면 토큰 읽어와 /api/users/profile 호출
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
    const onClose = () => setIsHidden(true); // X 닫기(아래로)

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
            <style>
                {`
          /***** EmailComposer.css — Aurora Glass Theme (Light Forced) *****/

          /* =======================
             ✅ 항상 라이트 모드 강제
          ======================= */
          :root,
          html,
          body {
              color-scheme: light !important;
          }

          /* ========== 기본 컬러 토큰(라이트 고정) ========== */
          :root {
              --bg: #ffffff;
              --bg-2: #f7f9fc;

              --surface: rgba(255, 255, 255, .85);
              --surface-strong: rgba(255, 255, 255, .95);
              --border: rgba(17, 24, 39, .08);

              --text: #111827;
              --text-weak: #6b7280;

              /* 상단 라인/프라이머리 그라데이션 */
              --brand-1: #8b5cf6;
              /* 보라 */
              --brand-2: #22d3ee;
              /* 민트 */
              --brand-3: #34d399;
              /* 그린 */

              /* 보조 버튼 */
              --accent-1: #10b981;
              --accent-2: #34d399;

              --glow: 0 20px 60px rgba(139, 92, 246, .22);

              --radius: 18px;
              --radius-sm: 12px;
              --speed: .18s;
          }

          /* 전역 폰트/배경 */
          html,
          body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
              font-optical-sizing: auto;
              background: var(--bg-2);
              color: var(--text);
              font-family: 'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, 'Noto Sans KR', sans-serif;
          }

          /* =========================
             Composer — 글래스 카드 (우하단 고정 + 슬라이드)
          ========================= */
          .composer-container {
              position: fixed;
              right: 150px;
              /* 필요시 조절 */
              bottom: 0;
              /* 필요시 32px 등으로 */
              margin: 0 !important;

              max-width: 420px;
              width: min(420px, calc(100vw - 64px));
              max-height: calc(100vh - 64px);

              background: rgba(255, 255, 255, .72);
              border: 1px solid var(--border);
              border-radius: var(--radius);
              box-shadow: var(--glow), 0 10px 28px rgba(0, 0, 0, .06);
              overflow: hidden;
              isolation: isolate;
              
              /* 레이아웃 수정: flexbox로 자식 요소들을 수직 정렬 */
              display: flex;
              flex-direction: column;

              /* 애니메이션 */
              transform: translateY(0);
              transition:
                  transform .25s cubic-bezier(.2, .7, .2, 1),
                  width .2s ease,
                  height .2s ease,
                  box-shadow .2s ease;
              will-change: transform, width, height;
              z-index: 1000;
          }

          /* 상단 그라데이션 라인 */
          .composer-container::before {
              content: "";
              position: absolute;
              inset: 0 0 auto 0;
              height: 5px;
              background: linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3));
              opacity: .9;
              z-index: 2;
              border-radius: var(--radius) var(--radius) 0 0;
          }

          /* 뒤쪽 은은한 블러 */
          .composer-container::after {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              z-index: 0;
              -webkit-backdrop-filter: blur(14px);
              backdrop-filter: blur(14px);
              background: radial-gradient(50% 40% at 50% 0%, rgba(255, 255, 255, .16), transparent 60%);
          }

          /* 내부는 블러 위 */
          .composer-container>* {
              position: relative;
              z-index: 1;
          }

          /* ▼ 상태: 아래로 숨김 */
          .composer-container.is-hidden {
              transform: translateY(calc(100% + 32px));
              pointer-events: none;
          }

          /* ▼ 상태: 헤더만 보이게 접기 */
          .composer-container.is-collapsed {
              height: 56px;
              overflow: hidden;
          }

          /* ▼ 상태: 팝아웃(확대) */
          .composer-container.is-expanded {
              /* 우하단 고정값 무시하고 화면 중앙으로 */
              left: 50%;
              top: 50%;
              right: auto;
              bottom: auto;

              /* 크기 크게 */
              width: min(920px, calc(100vw - 64px));
              height: min(80vh, calc(100vh - 64px));
              max-height: none;

              /* 가운데 정렬 */
              transform: translate(-50%, -50%);

              /* 더 강한 그림자 */
              box-shadow: 0 24px 80px rgba(124, 58, 237, .18), 0 10px 24px rgba(0, 0, 0, .08);
              border-radius: 20px;
          }

          /* 팝아웃용 배경 딤 */
          .composer-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, .45);
              opacity: 0;
              transition: opacity .2s ease;
              z-index: 999;
              /* 창(1000) 바로 아래 */
          }

          .composer-backdrop.show {
              opacity: 1;
          }

          /* 상단 버튼 바 */
          .composer-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px 20px;
              background: var(--surface);
              border-bottom: 1px solid var(--border);
              min-height: 56px;
              /* 접힘 높이 */
              flex-shrink: 0;
          }

          /* Gmail 스타일 윈도 버튼 그룹 */
          .composer-header .win-group {
              margin-left: auto;
              display: flex;
              gap: 6px;
          }

          .win-btn {
              height: 30px;
              min-width: 30px;
              border-radius: 8px;
              background: #eef2ff;
              border: 1px solid rgba(0, 0, 0, .06);
              display: grid;
              place-items: center;
              cursor: pointer;
              transition: background .15s ease, transform .06s ease, box-shadow .15s ease;
          }

          .win-btn:hover {
              background: #e5eaff;
              box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
          }

          .win-btn:active {
              transform: translateY(1px);
          }

          .win-btn svg {
              width: 16px;
              height: 16px;
              stroke: #374151;
          }

          /* 다시 올리는 FAB(숨김 상태) */
          .composer-fab {
              position: fixed;
              right: 32px;
              bottom: 32px;
              height: 48px;
              padding: 0 16px;
              border-radius: 999px;
              color: #fff;
              background: linear-gradient(135deg, #8b5cf6 55%, #22d3ee);
              box-shadow: 0 10px 24px rgba(99, 102, 241, .25);
              font-weight: 800;
              opacity: 0;
              pointer-events: none;
              transform: translateY(20px);
              transition: opacity .2s ease, transform .2s ease;
          }

          .composer-fab.show {
              opacity: 1;
              pointer-events: auto;
              transform: translateY(0);
          }

          /* 버튼 */
          .composer-button {
              border: 1px solid transparent;
              padding: 10px 18px;
              border-radius: var(--radius-sm);
              font-weight: 800;
              font-size: 14px;
              color: #fff;
              cursor: pointer;
              transition: transform .06s ease, box-shadow var(--speed), filter var(--speed), opacity var(--speed);
              display: inline-flex;
              align-items: center;
              gap: 8px;
          }

          .composer-button:disabled {
              opacity: .6;
              cursor: not-allowed;
          }

          /* 보내기(파랑) */
          .send-button {
              background: #0d6efd;
              box-shadow: 0 10px 26px rgba(13, 110, 253, .22);
              border-color: rgba(13, 110, 253, .25);
              
          }

          .send-button:hover:not(:disabled) {
              transform: translateY(-1px);
              filter: brightness(1.02);
              box-shadow: 0 14px 34px rgba(13, 110, 253, .32);
          }

          /* 이미지 생성(초록) */
          .generate-button {
              background: #198754;
              box-shadow: 0 10px 26px rgba(16, 185, 129, .22);
              border-color: rgba(16, 185, 129, .25);
          }

          .generate-button:hover:not(:disabled) {
              transform: translateY(-1px);
              filter: brightness(1.02);
              box-shadow: 0 14px 34px rgba(16, 185, 129, .30);
          }

          /* 필드 행 (라벨/값) */
          .field-row {
              display: grid;
              grid-template-columns: 120px 1fr;
              align-items: center;
              gap: 12px;
              padding: 12px 20px;
              background: #fff;
              border-bottom: 1px solid var(--border);
              flex-shrink: 0;
          }

          .field-label {
              font-size: 14px;
              font-weight: 800;
              color: #374151;
          }

          .field-value {
              font-size: 14px;
              color: var(--text);
          }

          .field-input {
              border: none;
              outline: none;
              background: transparent;
              font-size: 14px;
              padding: 8px 0;
              color: var(--text);
          }

          /* 본문 입력 영역 */
          .composer-textarea {
              width: 100%;
              height: 420px;
              border: none;
              outline: none;
              resize: none;
              padding: 18px 20px;
              font-size: 15px;
              line-height: 1.7;
              background: linear-gradient(180deg, var(--surface-strong), var(--surface));
              flex-grow: 1; /* 남은 공간을 채우도록 수정 */
              overflow-y: auto; /* 스크롤바 유지 */
          }

          .composer-textarea::placeholder {
              color: #9fb0cc;
          }

          /* 스크롤바(웹킷) */
          .composer-textarea::-webkit-scrollbar {
              width: 10px;
          }

          .composer-textarea::-webkit-scrollbar-thumb {
              background: #cfd4da;
              border-radius: 8px;
          }

          .composer-textarea::-webkit-scrollbar-track {
              background: transparent;
          }

          /* =========================
             하단 버튼바
          ========================= */
          .composer-bottom {
              display: flex;
              justify-content: flex-end;
              gap: 10px;
              padding: 16px 20px;
              background: var(--surface-strong);
              border-top: 1px solid var(--border);
              flex-shrink: 0;
          }


          /* =========================
             Toast
          ========================= */
          .toast-message {
              position: fixed;
              left: 50%;
              bottom: 28px;
              transform: translateX(-50%);
              min-width: 260px;
              max-width: min(90vw, 520px);
              padding: 14px 18px;
              border-radius: var(--radius-sm);
              background: #2b2f38;
              color: #fff;
              text-align: center;
              box-shadow: 0 10px 24px rgba(0, 0, 0, .22);
              z-index: 100;
              line-height: 1.5;
              font-weight: 600;
              visibility: hidden;
              opacity: 0;
              transition: opacity var(--speed), visibility var(--speed);
          }

          .toast-message.show {
              visibility: visible;
              opacity: 1;
          }

          /* =========================
             Modal (접미사 3)
          ========================= */
          .modal-overlay3 {
              position: fixed;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, .55);
              z-index: 1001; /* Z-index 수정 */
              padding: 16px;
          }

          .modal-content3 {
              width: 100%;
              max-width: 560px;
              background: #fff;
              border-radius: var(--radius);
              box-shadow: 0 10px 30px rgba(0, 0, 0, .22);
              border: 1px solid var(--border);
              overflow: hidden;
          }

          .modal-header3 {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 18px 20px;
              background: var(--surface);
              border-bottom: 1px solid var(--border);
          }

          .modal-title3 {
              font-size: 18px;
              font-weight: 800;
              color: #343a40;
          }

          .modal-close-button3 {
              border: none;
              background: transparent;
              color: #6c757d;
              font-size: 28px;
              line-height: 1;
              width: 36px;
              height: 36px;
              border-radius: 10px;
              cursor: pointer;
              display: grid;
              place-items: center;
              transition: background var(--speed), color var(--speed);
          }

          .modal-close-button3:hover {
              color: #343a40;
              background: rgba(0, 0, 0, .04);
          }

          .modal-body3 {
              padding: 22px;
          }

          .modal-text3 {
              font-size: 14px;
              color: #495057;
              margin-bottom: 14px;
              line-height: 1.6;
          }

          .modal-textarea3 {
              width: 100%;
              padding: 12px;
              font-size: 14px;
              border: 1px solid #ced4da;
              border-radius: var(--radius-sm);
              transition: border-color .15s ease, box-shadow .15s ease;
              box-sizing: border-box;
              resize: none;
          }

          .modal-textarea3:focus {
              outline: none;
              border-color: var(--accent-1);
              box-shadow: 0 0 0 3px rgba(16, 185, 129, .15);
          }

          .modal-footer3 {
              display: flex;
              justify-content: flex-end;
              gap: 10px;
              padding: 16px 20px;
              background: var(--surface);
              border-top: 1px solid var(--border);
          }

          /* =========================
             접근성 & 반응형
          ========================= */
          .composer-button:focus-visible,
          .modal-close-button3:focus-visible,
          .modal-textarea3:focus-visible {
              box-shadow: 0 0 0 3px rgba(34, 211, 238, .22);
              outline: none;
          }

          @media (max-width:768px) {
              .composer-container {
                  right: 16px;
                  bottom: 16px;
                  width: calc(100vw - 32px);
                  max-height: calc(100vh - 32px);
              }

              .composer-fab {
                  right: 16px;
                  bottom: 16px;
              }

              .composer-header {
                  gap: 8px;
              }

              .field-row {
                  padding: 12px 16px;
                  grid-template-columns: 104px 1fr;
              }

              .composer-textarea {
                  height: 360px;
                  padding: 16px;
              }

              .modal-content3 {
                  max-width: 100%;
              }
          }

          /* 모션 민감 사용자 배려 */
          @media (prefers-reduced-motion: reduce) {
              * {
                  animation: none !important;
                  transition: none !important;
              }
          }

          /* 팝아웃(확대) 상태 - 가로폭 제한 해제 + 에디터도 키우기 */
          .composer-container.is-expanded {
              left: 50%;
              top: 50%;
              right: auto;
              bottom: auto;

              /* ✅ 가로폭 제한 해제 */
              max-width: none;
              /* ← 이 줄이 핵심 */
              width: min(920px, calc(100vw - 64px));

              /* 세로도 키우기 */
              max-height: none;
              height: min(80vh, calc(100vh - 64px));

              transform: translate(-50%, -50%);
              box-shadow: 0 24px 80px rgba(124, 58, 237, .18), 0 10px 24px rgba(0, 0, 0, .08);
              border-radius: 20px;
          }

          /* 팝아웃 시 본문 에디터 높이도 확대 (오프셋은 필요에 따라 조절) */
          .composer-container.is-expanded .composer-textarea {
              height: calc(80vh - 220px);
              /* 헤더+필드 3줄 합친 높이만큼 빼기 */
          }
        `}
            </style>
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
