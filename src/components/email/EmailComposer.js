// src/components/email/EmailComposer.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import "../../css/Picture.css";

import ToastMessage from "./ToastMessage";
import ImageModal from "./ImageModal";

import useContentEditable from "./hooks/useContentEditable";
import getBearerFromAuthSection from "./utils/auth/getBearerFromAuthSection";

import {fetchMyProfile} from "./services/userService";
import {sendEmailForm} from "./services/emailService";
import {generateImageFromPrompt} from "./services/imageGenService";

/* ──────────────────────────
   배경 작업공간에 사용할 상수/유틸
────────────────────────── */
const TEMPLATES = [
    {
        id: "welcome",
        title: "환영 안내",
        subject: "MindBridge 이용 안내드립니다",
        body:
            "안녕하세요,\n\nMindBridge 서비스 이용을 환영합니다.\n아래 링크에서 계정 설정/주요 기능을 확인해 주세요.\n\n감사합니다.",
    },
    {
        id: "reply",
        title: "문의 회신",
        subject: "[문의 회신] 문의 주신 건에 대한 답변드립니다",
        body:
            "안녕하세요,\n\n문의 주신 내용 확인하여 아래와 같이 안내드립니다.\n- 문제 요약:\n- 조치 사항:\n- 추가 확인 필요:\n\n추가로 궁금한 점 있으시면 언제든 회신 주세요.",
    },
    {
        id: "follow",
        title: "후속 안내",
        subject: "지난 메일 관련 후속 안내드립니다",
        body:
            "안녕하세요,\n\n지난 메일 관련하여 후속 안내드립니다.\n첨부된 자료를 확인해 주시고 의견 부탁드립니다.\n\n감사합니다.",
    },
];

const DEFAULT_SIGNATURE = (me) =>
    `-- \n${me?.name || "MindBridge Team"}\n${me?.email || ""}\nMindBridge`;

const RECENTS_KEY = "mb_recent_recipients";
const DRAFT_KEY = "mb_email_drafts_v1";

/* ──────────────────────────
   컴포넌트
────────────────────────── */
function EmailComposer({customUser, isCustomLoggedIn}) {
    const form = useRef(null);
    const fileInputRef = useRef(null);

    // 메일 작성 상태
    const [toEmail, setToEmail] = useState("mindbridge2020@gmail.com");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState(""); // contentEditable HTML과 동기
    const [isSending, setIsSending] = useState(false);

    // 첨부파일(드롭/선택)
    const [attachments, setAttachments] = useState([]);

    // 이미지 생성 모달
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePrompt, setImagePrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // 토스트
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const displayToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // 사용자
    const [userInfo, setUserInfo] = useState({name: "", email: ""});
    const [isLoading, setIsLoading] = useState(true);

    // Gmail 창 동작 상태
    const [isCollapsed, setIsCollapsed] = useState(false); // 최소화(헤더만)
    const [isExpanded, setIsExpanded] = useState(false);   // 팝아웃/확대 + 배경 딤
    const [isHidden, setIsHidden] = useState(false);       // 아래로 숨김(닫기)

    // contentEditable 훅 (message <-> editor 동기화)
    const {bind} = useContentEditable(message, setMessage);

    // 배경 작업공간 상태
    const [useSignature, setUseSignature] = useState(true);
    const [recentRecipients, setRecentRecipients] = useState(() => {
        const saved = localStorage.getItem(RECENTS_KEY);
        return saved ? JSON.parse(saved) : ["mindbridge2020@gmail.com", "support@mindbridge.app"];
    });
    const [drafts, setDrafts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(DRAFT_KEY)) || [];
        } catch {
            return [];
        }
    });

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
            } catch (_e) {
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

    // 전송
    const onSubmit = async (e) => {
        e.preventDefault();

        // contentEditable의 플레인 텍스트 기준 검증
        const plainText = document.getElementById("message-editor")?.textContent?.trim();
        if (!subject.trim() || !plainText) {
            displayToast("제목과 내용을 모두 입력해주세요.");
            return;
        }

        try {
            setIsSending(true);

            // 첨부파일이 있다면 FormData로, 없으면 기존처럼 form 전달
            const hasFiles = attachments.length > 0;

            if (hasFiles) {
                const fd = new FormData(form.current);
                fd.set("to", toEmail); // 받는사람
                attachments.forEach((f) => fd.append("attachments", f, f.name));
                await sendEmailForm(fd);
            } else {
                // hidden input(name="to")가 폼에 있으니 그대로 전송
                await sendEmailForm(form.current);
            }

            // 오늘 보낸 메일 카운트(+1)
            const todayKey = `mb_sent_${new Date().toDateString()}`;
            const sentToday = Number(localStorage.getItem(todayKey) || "0") + 1;
            localStorage.setItem(todayKey, String(sentToday));

            // 최근 수신자 갱신
            if (toEmail?.trim()) {
                const next = [toEmail.trim(), ...recentRecipients.filter(e => e !== toEmail.trim())].slice(0, 12);
                setRecentRecipients(next);
                localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
            }

            displayToast("메일이 성공적으로 전송되었습니다!");
            setSubject("");
            setMessage("");
            setAttachments([]);
        } catch (error) {
            displayToast(
                "메일 전송에 실패했습니다: " +
                (error?.text || error?.message || "Unknown error")
            );
        } finally {
            setIsSending(false);
        }
    };

    // 이미지 생성
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            displayToast("생성할 이미지에 대한 설명을 입력해주세요.");
            return;
        }
        try {
            setIsGenerating(true);
            const imageUrl = await generateImageFromPrompt(imagePrompt.trim());
            const safeAlt = imagePrompt.replace(/"/g, "&quot;");
            const imageHtml = `<br><br><img src="${imageUrl}" alt="${safeAlt}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`;
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

    // 창 컨트롤
    const onMinimize = () => setIsCollapsed((v) => !v); // 언더바
    const onExpand = () => {
        setIsHidden(false);
        setIsCollapsed(false);
        setIsExpanded((v) => !v);
    };
    const onClose = (e) => {
        e?.stopPropagation?.();
        setIsExpanded(false);
        setIsCollapsed(false);
        setIsHidden(true);
    };

    // ESC로 닫기
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

    // 팝아웃 시 바디 스크롤 잠금
    useEffect(() => {
        if (!isExpanded) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isExpanded]);

    /* ──────────────────────────
       배경 작업공간 동작
    ────────────────────────── */
    const applyTemplate = (tpl) => {
        setSubject(tpl.subject);
        const baseBody = tpl.body.replace(/\n/g, "<br/>");
        const withSig = useSignature
            ? `${baseBody}<br/><br/>${DEFAULT_SIGNATURE(userInfo).replace(/\n/g, "<br/>")}`
            : baseBody;
        setMessage(withSig);
    };

    const saveDraft = () => {
        const id = (crypto?.randomUUID && crypto.randomUUID()) || `d_${Date.now()}_${Math.random()}`;
        const draft = {id, toEmail, subject, html: message, savedAt: Date.now()};
        const next = [draft, ...drafts].slice(0, 50);
        setDrafts(next);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        displayToast("현재 작성중인 메일을 임시저장 했습니다.");
    };

    const loadDraft = (d) => {
        setToEmail(d.toEmail || toEmail);
        setSubject(d.subject || "");
        setMessage(d.html || "");
    };

    const deleteDraft = (id) => {
        const next = drafts.filter((x) => x.id !== id);
        setDrafts(next);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    };

    const pushRecent = (mail) => {
        setToEmail(mail);
        const next = [mail, ...recentRecipients.filter((m) => m !== mail)].slice(0, 12);
        setRecentRecipients(next);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    };

    // 오늘 통계
    const stats = useMemo(() => {
        const todayKey = `mb_sent_${new Date().toDateString()}`;
        const sentToday = Number(localStorage.getItem(todayKey) || "0");
        return {sentToday, draftsCount: drafts.length};
    }, [drafts]);

    // 파일 선택
    const handleFilePick = (e) => {
        const list = Array.from(e.target.files || []);
        if (list.length) setAttachments(prev => [...prev, ...list]);
        // 같은 파일 다시 고를 수 있게 value 초기화
        e.target.value = "";
    };

    // 드래그&드롭 첨부
    const handleDrop = (e) => {
        e.preventDefault();
        const list = Array.from(e.dataTransfer.files || []);
        if (list.length) setAttachments(prev => [...prev, ...list]);
    };

    return (
        <>
            {/* ──────────────────────────
          배경 작업공간 (간단 인라인 스타일)
      ────────────────────────── */}
            <div
                className="email-workspace-lite"
                style={{
                    minHeight: "100vh",
                    padding: "24px 24px 120px",
                    background:
                        "radial-gradient(1200px 600px at 70% 20%, rgba(161,140,209,.25), transparent 60%), radial-gradient(900px 500px at 30% 80%, rgba(194,178,255,.25), transparent 60%), linear-gradient(180deg,#ffffff 0%, #f6f3ff 100%)",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "280px 1fr",
                        gap: 20,
                        maxWidth: 1280,
                        margin: "0 auto",
                    }}
                >
                    {/* 왼쪽 패널 */}
                    <aside style={{display: "flex", flexDirection: "column", gap: 16}}>
                        {/* 템플릿 */}
                        <section style={cardStyle()}>
                            <div style={cardHeadStyle()}>템플릿</div>
                            <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
                                {TEMPLATES.map((tpl) => (
                                    <button key={tpl.id} style={chipStyle()} onClick={() => applyTemplate(tpl)}>
                                        {tpl.title}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 최근 수신자 */}
                        <section style={cardStyle()}>
                            <div style={cardHeadStyle()}>최근 수신자</div>
                            <div style={{display: "grid", gap: 6}}>
                                {recentRecipients.map((mail) => (
                                    <button
                                        key={mail}
                                        style={listItemStyle()}
                                        onClick={() => pushRecent(mail)}
                                    >
                                        {mail}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 임시저장 */}
                        <section style={cardStyle()}>
                            <div style={{
                                ...cardHeadStyle(),
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                임시 저장
                                <button style={miniBtnStyle()} onClick={saveDraft}>저장</button>
                            </div>
                            <div style={{display: "grid", gap: 8}}>
                                {drafts.length === 0 && (
                                    <div style={{color: "#6b7280", fontSize: 13}}>아직 저장된 임시 메일이 없어요.</div>
                                )}
                                {drafts.map((d) => (
                                    <div key={d.id} style={{display: "flex", gap: 8}}>
                                        <button style={{...listItemStyle(), flex: 1}} onClick={() => loadDraft(d)}>
                                            {d.subject || "(제목 없음)"}{" "}
                                            <span
                                                style={{color: "#6b7280"}}>• {new Date(d.savedAt).toLocaleString()}</span>
                                        </button>
                                        <button
                                            onClick={() => deleteDraft(d.id)}
                                            style={{
                                                border: "none",
                                                borderRadius: 10,
                                                background: "#fee",
                                                color: "#b00",
                                                padding: "0 10px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 서명 */}
                        <section style={cardStyle()}>
                            <div style={cardHeadStyle()}>서명</div>
                            <label style={{display: "flex", alignItems: "center", gap: 8, fontSize: 14}}>
                                <input type="checkbox" checked={useSignature}
                                       onChange={(e) => setUseSignature(e.target.checked)}/>
                                <span>메일 하단에 기본 서명 자동 추가</span>
                            </label>
                            {useSignature && (
                                <pre
                                    style={{
                                        marginTop: 10,
                                        background: "#fff",
                                        border: "1px dashed rgba(17,24,39,.08)",
                                        borderRadius: 12,
                                        padding: 10,
                                        whiteSpace: "pre-wrap",
                                        color: "#6b7280",
                                    }}
                                >
                  {DEFAULT_SIGNATURE(userInfo)}
                </pre>
                            )}
                        </section>
                    </aside>

                    {/* 중앙 패널 */}
                    <main style={{display: "grid", gap: 16}}>
                        {/* 히어로/퀵액션 */}
                        <section style={heroStyle()}>
                            <h2 style={{margin: 0}}>이메일 작업공간</h2>
                            <p style={{margin: "6px 0 0 0", color: "#6b7280"}}>
                                템플릿으로 빠르게 시작하고, 파일을 끌어다 첨부해 보세요.
                            </p>
                            <div style={{display: "flex", gap: 10, marginTop: 10}}>
                                <button style={primaryBtnStyle()} onClick={saveDraft}>현재 내용 임시저장</button>
                                <label style={{...primaryBtnStyle(), cursor: "pointer"}}>
                                    파일 첨부
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFilePick}
                                        style={{display: "none"}}
                                    />
                                </label>
                                <input
                                    type="email"
                                    placeholder="받는사람 이메일 입력"
                                    value={toEmail}
                                    onChange={(e) => setToEmail(e.target.value)}
                                    style={{
                                        flex: 1,
                                        border: "1px solid rgba(17,24,39,.08)",
                                        borderRadius: 10,
                                        padding: "8px 12px",
                                        minWidth: 200,
                                    }}
                                />
                            </div>
                        </section>

                        {/* 드롭존 */}
                        <section
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            style={{
                                border: "2px dashed rgba(126,87,194,.35)",
                                background: "#fff",
                                borderRadius: 16,
                                minHeight: 140,
                                display: "grid",
                                alignItems: "center",
                                padding: 12,
                            }}
                        >
                            <div style={{textAlign: "center", color: "#6b7280"}}>
                                여기로 파일을 드래그해서 첨부하거나, 위의 <b>파일 첨부</b> 버튼을 누르세요.
                            </div>
                            {attachments.length > 0 && (
                                <div style={{display: "grid", gap: 8, marginTop: 10}}>
                                    {attachments.map((f, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr auto auto",
                                                alignItems: "center",
                                                gap: 10,
                                                background: "#fafafa",
                                                border: "1px solid rgba(17,24,39,.08)",
                                                borderRadius: 12,
                                                padding: "8px 10px",
                                            }}
                                        >
                                            <span style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>{f.name}</span>
                                            <span style={{
                                                color: "#6b7280",
                                                fontSize: 13
                                            }}>{(f.size / 1024).toFixed(1)} KB</span>
                                            <button
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                style={{
                                                    border: "none",
                                                    background: "#eee",
                                                    borderRadius: 8,
                                                    padding: "4px 8px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                제거
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* 통계 */}
                        <section style={{display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12}}>
                            <div style={statCardStyle()}>
                                <div style={{color: "#6b7280", fontSize: 12}}>오늘 보낸 메일</div>
                                <div style={{fontWeight: 800, fontSize: 20, marginTop: 4}}>{stats.sentToday}건</div>
                            </div>
                            <div style={statCardStyle()}>
                                <div style={{color: "#6b7280", fontSize: 12}}>임시저장 개수</div>
                                <div style={{fontWeight: 800, fontSize: 20, marginTop: 4}}>{stats.draftsCount}개</div>
                            </div>
                            <div style={statCardStyle()}>
                                <div style={{color: "#6b7280", fontSize: 12}}>받는사람</div>
                                <div style={{
                                    fontWeight: 800,
                                    fontSize: 16,
                                    marginTop: 4,
                                    wordBreak: "break-all"
                                }}>{toEmail || "-"}</div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* ──────────────────────────
          토스트
      ────────────────────────── */}
            <ToastMessage message={toastMessage} show={showToast}/>

            {/* 팝아웃 배경(딤) */}
            {isExpanded && (
                <div
                    className="composer-backdrop show"
                    onClick={() => setIsExpanded(false)}
                    aria-hidden="true"
                />
            )}

            {/* 상태 클래스 토글: 우하단 고정 컴포저 */}
            <form
                ref={form}
                onSubmit={onSubmit}
                className={`composer-container ${isCollapsed ? "is-collapsed" : ""} ${isHidden ? "is-hidden" : ""} ${isExpanded ? "is-expanded" : ""}`}
            >
                {/* 헤더: 창 컨트롤 버튼들 */}
                <div className="composer-header">
                    <div className="win-group">
                        {/* 최소화 */}
                        <button type="button" className="win-btn" onClick={onMinimize} title="최소화">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                <path d="M5 19h14"/>
                            </svg>
                        </button>
                        {/* 팝아웃/원복 */}
                        <button type="button" className="win-btn" onClick={onExpand}
                                title={isExpanded ? "원래 크기" : "팝아웃"}>
                            {isExpanded ? (
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                    <path d="M10 14L4 20M4 14v6h6"/>
                                    <path d="M14 10l6-6M14 4h6v6"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                    <path d="M14 4h6v6"/>
                                    <path d="M10 14l10-10"/>
                                </svg>
                            )}
                        </button>
                        {/* 닫기 */}
                        <button type="button" className="win-btn" onClick={onClose} title="닫기">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
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
                    <span className="field-value">{toEmail}</span>
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

                {/* 본문 에디터 (contentEditable) */}
                <div
                    id="message-editor"
                    className="composer-textarea"
                    style={{overflowY: "auto"}}
                    {...bind}
                />

                {/* 하단 버튼 바(오른쪽 정렬) */}
                <div className="composer-bottom">
                    <button type="submit" className="composer-button send-button" disabled={isSending}>
                        {isSending ? "전송 중..." : "보내기"}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(true)}
                            className="composer-button generate-button">
                        이미지 생성
                    </button>
                </div>

                {/* ❗백엔드에서 읽는 히든 필드들 */}
                <input type="hidden" name="to" value={toEmail}/>
                <input type="hidden" name="name" value={userInfo.name}/>
                <input type="hidden" name="email" value={userInfo.email}/>
                {/* contentEditable HTML을 전달하기 위한 hidden textarea */}
                <textarea name="message" value={message} readOnly style={{display: "none"}}/>
            </form>

            {/* 숨김 상태에서 다시 띄우는 FAB */}
            <button
                type="button"
                className={`composer-fab ${isHidden ? "show" : ""}`}
                onClick={() => setIsHidden(false)}
            >
                메일 작성
            </button>

            {/* 이미지 생성 모달 */}
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

/* ──────────────────────────
   작은 스타일 유틸 (인라인 카드/버튼)
────────────────────────── */
const cardStyle = () => ({
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(17,24,39,.08)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 10px 30px rgba(126,87,194,.12)",
    backdropFilter: "blur(8px)",
});

const heroStyle = () => ({
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(17,24,39,.08)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 30px rgba(126,87,194,.12)",
});

const cardHeadStyle = () => ({
    fontWeight: 700,
    color: "#111827",
    marginBottom: 10,
});

const chipStyle = () => ({
    border: "1px solid rgba(17,24,39,.08)",
    background: "#fff",
    padding: "8px 10px",
    borderRadius: 999,
    cursor: "pointer",
    color: "#111",
});

const listItemStyle = () => ({
    textAlign: "left",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(17,24,39,.08)",
    background: "#fff",
    cursor: "pointer",
    color: "#111",
});

const miniBtnStyle = () => ({
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 8,
    background: "#7e57c2",
    color: "#fff",
    border: "none",
    cursor: "pointer",
});

const primaryBtnStyle = () => ({
    border: "none",
    background: "#7e57c2",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
});

const statCardStyle = () => ({
    background: "#fff",
    border: "1px solid rgba(17,24,39,.08)",
    borderRadius: 14,
    padding: 14,
});

export default EmailComposer;
