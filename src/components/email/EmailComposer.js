// src/components/email/EmailComposer.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import "../../css/Picture.css";

import ToastMessage from "./ToastMessage";
import ImageModal from "./ImageModal";

import useContentEditable from "./hooks/useContentEditable";
import {sendEmailForm} from "./services/emailService";
import {generateImageFromPrompt} from "./services/imageGenService";
import {useAuth} from "../../AuthContext";

/* ───────── 상수 ───────── */
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

const RECENTS_PREFIX = "mb_recent_recipients";
const DRAFT_PREFIX = "mb_email_drafts_v1";
const SNIPPET_PREFIX = "mb_snippets_v1";

/* ───────── 컴포넌트 ───────── */
function EmailComposer({customUser, isCustomLoggedIn}) {
    const form = useRef(null);

    // 🔐 DashboardLayout과 동일하게 auth 사용
    const {profile} = useAuth();
    const isLoggedIn = !!profile;
    const role = String(profile?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

    // 메일 작성 상태
    const [toEmail, setToEmail] = useState("");
    const [cc, setCc] = useState("");
    const [bcc, setBcc] = useState("");

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState(""); // contentEditable HTML과 동기
    const [isSending, setIsSending] = useState(false);

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
    const [userInfo, setUserInfo] = useState({id: "", name: "", email: ""});
    const [isLoading, setIsLoading] = useState(true);

    // 창 상태
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    // contentEditable 바인딩
    const {bind} = useContentEditable(message, setMessage);

    // 사용자 키(로컬스토리지 네임스페이스)
    const userKey = useMemo(
        () => (userInfo?.id || userInfo?.email || "guest").toString().toLowerCase(),
        [userInfo]
    );
    const RECENTS_KEY = useMemo(() => `${RECENTS_PREFIX}:${userKey}`, [userKey]);
    const DRAFT_KEY = useMemo(() => `${DRAFT_PREFIX}:${userKey}`, [userKey]);
    const SNIPPET_KEY = useMemo(() => `${SNIPPET_PREFIX}:${userKey}`, [userKey]);

    // 최근 수신자/임시저장/스니펫 (사용자별)
    const [recentRecipients, setRecentRecipients] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [newSnippet, setNewSnippet] = useState("");

    // 보내기 취소(Undo Send)
    const [undoEnabled, setUndoEnabled] = useState(true);
    const [undoSeconds, setUndoSeconds] = useState(10);
    const undoTimerRef = useRef(null);
    const [pending, setPending] = useState(false);
    const [pendingLeft, setPendingLeft] = useState(0);
    const pendingIntervalRef = useRef(null);

    // 사용자/프로필 로딩: profile → customUser → guest
    useEffect(() => {
        setIsLoading(true);

        if (profile) {
            const p = profile;
            setUserInfo({
                id: p.id || p.userId || p.email || "me",
                name: p.nickname || p.fullName || p.name || "사용자",
                email: p.email || "이메일 정보 없음",
            });
            setIsLoading(false);
            return;
        }

        if (isCustomLoggedIn && customUser) {
            setUserInfo({
                id: customUser.id || customUser.userId || customUser.email || "me",
                name: customUser.nickname || customUser.fullName || "사용자",
                email: customUser.email || "이메일 정보 없음",
            });
            setIsLoading(false);
            return;
        }

        setUserInfo({id: "guest", name: "사용자", email: "로그인이 필요합니다."});
        setIsLoading(false);
    }, [profile, customUser, isCustomLoggedIn]);

    // 사용자 키 변경 시 로컬 데이터 로드
    useEffect(() => {
        try {
            setRecentRecipients(JSON.parse(localStorage.getItem(RECENTS_KEY)) || []);
        } catch {
            setRecentRecipients([]);
        }
        try {
            setDrafts(JSON.parse(localStorage.getItem(DRAFT_KEY)) || []);
        } catch {
            setDrafts([]);
        }
        try {
            setSnippets(JSON.parse(localStorage.getItem(SNIPPET_KEY)) || []);
        } catch {
            setSnippets([]);
        }
    }, [RECENTS_KEY, DRAFT_KEY, SNIPPET_KEY]);

    /* ───── 전송 로직 ───── */
    const doSend = async (override = null) => {
        try {
            setIsSending(true);

            if (override) {
                const fd = new FormData(form.current);
                if (override.to) fd.set("to", override.to);
                if (override.cc !== undefined) fd.set("cc", override.cc);
                if (override.bcc !== undefined) fd.set("bcc", override.bcc);
                await sendEmailForm(fd);
            } else {
                await sendEmailForm(form.current);
            }

            // 통계 + 최근 수신자(사용자별)
            const todayKey = `mb_sent_${new Date().toDateString()}:${userKey}`;
            const sentToday = Number(localStorage.getItem(todayKey) || "0") + 1;
            localStorage.setItem(todayKey, String(sentToday));

            if (toEmail?.trim()) {
                const next = [
                    toEmail.trim(),
                    ...recentRecipients.filter((e) => e !== toEmail.trim()),
                ].slice(0, 12);
                setRecentRecipients(next);
                localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
            }

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

    const onSubmit = async (e) => {
        e.preventDefault();
        // contentEditable의 플레인 텍스트 기준 검증
        const plainText = document
            .getElementById("message-editor")
            ?.textContent?.trim();
        if (!subject.trim() || !plainText) {
            displayToast("제목과 내용을 모두 입력해주세요.");
            return;
        }

        if (undoEnabled && undoSeconds > 0) {
            // 지연 전송 모드
            setPending(true);
            setPendingLeft(undoSeconds);

            // 카운트다운
            pendingIntervalRef.current = setInterval(() => {
                setPendingLeft((n) => {
                    if (n <= 1) {
                        clearInterval(pendingIntervalRef.current);
                    }
                    return Math.max(0, n - 1);
                });
            }, 1000);

            // 실제 전송 예약
            undoTimerRef.current = setTimeout(async () => {
                setPending(false);
                await doSend();
            }, undoSeconds * 1000);

            return;
        }

        // 즉시 전송
        await doSend();
    };

    const cancelPendingSend = () => {
        if (!pending) return;
        clearTimeout(undoTimerRef.current);
        clearInterval(pendingIntervalRef.current);
        setPending(false);
        setPendingLeft(0);
        displayToast("전송이 취소되었습니다.");
    };

    /* ───── 이미지 생성 ───── */
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            displayToast("생성할 이미지에 대한 설명을 입력해주세요.");
            return;
        }
        try {
            setIsGenerating(true);
            const url = await generateImageFromPrompt(imagePrompt.trim());
            const safeAlt = imagePrompt.replace(/"/g, "&quot;");
            setMessage(
                (prev) =>
                    `${prev}<br><br><img src="${url}" alt="${safeAlt}" style="max-width: 400px; height: auto; display: block; margin: 16px auto; border-radius: 8px;" />`
            );
            displayToast("이미지가 생성되어 본문에 추가되었습니다!");
            setIsModalOpen(false);
            setImagePrompt("");
        } catch (err) {
            displayToast(`이미지 생성 실패: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    /* ───── 창 컨트롤 ───── */
    const onMinimize = () => setIsCollapsed((v) => !v);
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

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setIsExpanded(false);
                setIsCollapsed(false);
                setIsHidden(true);
                cancelPendingSend();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (!isExpanded) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isExpanded]);

    /* ───── 작업공간 로직(사용자별 저장) ───── */
    const [useSignature, setUseSignature] = useState(true);

    const applyTemplate = (tpl) => {
        if (!(isAdmin && isLoggedIn)) return; // 🔐 어드민 전용
        setSubject(tpl.subject);
        const baseBody = tpl.body.replace(/\n/g, "<br/>");
        const withSig = useSignature
            ? `${baseBody}<br/><br/>${DEFAULT_SIGNATURE(userInfo).replace(
                /\n/g,
                "<br/>"
            )}`
            : baseBody;
        setMessage(withSig);
    };

    const saveDraft = () => {
        const id =
            (crypto?.randomUUID && crypto.randomUUID()) ||
            `d_${Date.now()}_${Math.random()}`;
        const draft = {
            id,
            owner: userKey,
            toEmail,
            subject,
            html: message,
            savedAt: Date.now(),
        };
        const next = [draft, ...drafts].slice(0, 50);
        setDrafts(next);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        displayToast("현재 작성중인 메일을 임시저장 했습니다.");
    };

    const loadDraft = (d) => {
        if (d.owner && d.owner !== userKey) return;
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
        const next = [mail, ...recentRecipients.filter((m) => m !== mail)].slice(
            0,
            12
        );
        setRecentRecipients(next);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    };

    const addSnippet = () => {
        const t = newSnippet.trim();
        if (!t) return;
        const item =
            (crypto?.randomUUID && {id: crypto.randomUUID(), text: t}) || {
                id: `s_${Date.now()}`,
                text: t,
            };
        const next = [item, ...snippets].slice(0, 50);
        setSnippets(next);
        localStorage.setItem(SNIPPET_KEY, JSON.stringify(next));
        setNewSnippet("");
    };

    const deleteSnippet = (id) => {
        const next = snippets.filter((s) => s.id !== id);
        setSnippets(next);
        localStorage.setItem(SNIPPET_KEY, JSON.stringify(next));
    };

    const insertSnippet = (text) => {
        setMessage((prev) =>
            prev ? `${prev}<br/>${text.replace(/\n/g, "<br/>")}` : text.replace(/\n/g, "<br/>")
        );
    };

    // 오늘 통계 (사용자별 키)
    const stats = useMemo(() => {
        const todayKey = `mb_sent_${new Date().toDateString()}:${userKey}`;
        const sentToday = Number(localStorage.getItem(todayKey) || "0");
        const plainText =
            document.getElementById("message-editor")?.textContent || "";
        const wordCount = plainText.trim()
            ? plainText.trim().split(/\s+/).length
            : 0;
        const readMin = Math.max(1, Math.ceil(wordCount / 200));
        // 링크 간단 검사
        const links = message.match(/https?:\/\/[^\s"<]+/g) || [];
        const suspicious = (message.match(/\bwww\.[^\s"<]+/g) || []).filter(
            (u) => !/^https?:\/\//.test(u)
        );
        return {sentToday, draftsCount: drafts.length, wordCount, readMin, links, suspicious};
    }, [drafts, message, userKey]);

    return (
        <>
            {/* ───── 배경 작업공간 (관리자 전용 템플릿 + 사용자별 기능) ───── */}
            <div className="email-workspace-lite">
                <div className="ews-grid">
                    {/* 왼쪽 패널 */}
                    <aside className="ews-aside">
                        {/* 템플릿 (관리자만) */}
                        {isAdmin && isLoggedIn && (
                            <section className="ews-card">
                                <div className="ews-card-head">템플릿 (관리자 전용)</div>
                                <div className="ews-templates">
                                    {TEMPLATES.map((tpl) => (
                                        <button
                                            key={tpl.id}
                                            className="ews-chip"
                                            onClick={() => applyTemplate(tpl)}
                                        >
                                            {tpl.title}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 최근 수신자 */}
                        <section className="ews-card">
                            <div className="ews-card-head">최근 수신자</div>
                            <div className="ews-list">
                                {recentRecipients.map((mail) => (
                                    <button
                                        key={mail}
                                        className="ews-list-item"
                                        onClick={() => pushRecent(mail)}
                                    >
                                        {mail}
                                    </button>
                                ))}
                                {recentRecipients.length === 0 && (
                                    <div className="ews-empty">최근 수신자가 없습니다.</div>
                                )}
                            </div>
                        </section>

                        {/* 임시저장 */}
                        <section className="ews-card">
                            <div className="ews-card-head with-action">
                                <span>임시 저장</span>
                                <button className="ews-mini" onClick={saveDraft}>
                                    저장
                                </button>
                            </div>
                            <div className="ews-drafts">
                                {drafts.length === 0 && (
                                    <div className="ews-empty">아직 저장된 임시 메일이 없어요.</div>
                                )}
                                {drafts.map((d) => (
                                    <div key={d.id} className="ews-draft-row">
                                        <button className="ews-draft-load" onClick={() => loadDraft(d)}>
                                            {d.subject || "(제목 없음)"}{" "}
                                            <span className="ews-dim">
                        • {new Date(d.savedAt).toLocaleString()}
                      </span>
                                        </button>
                                        <button
                                            className="ews-draft-del"
                                            onClick={() => deleteDraft(d.id)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 서명 토글 */}
                        <section className="ews-card">
                            <div className="ews-card-head">서명</div>
                            <label className="ews-toggle">
                                <input
                                    type="checkbox"
                                    checked={useSignature}
                                    onChange={(e) => setUseSignature(e.target.checked)}
                                />
                                <span>메일 하단에 기본 서명 자동 추가</span>
                            </label>
                            {useSignature && (
                                <pre className="ews-signature-preview">
                  {DEFAULT_SIGNATURE(userInfo)}
                </pre>
                            )}
                        </section>
                    </aside>

                    {/* 중앙 패널 */}
                    <main className="ews-center">
                        <section className="ews-hero">
                            <h2>이메일 작업공간</h2>
                            <h4>CC/BCC, 보내기 취소, 테스트 발송, 스니펫을 사용할 수 있어요.</h4>
                            <p>mindbridge2020@gmail.com 해당 메일은 문의 전용 메일입니다 보내고 싶은 메일을 입력해주세요.</p>

                            {/* CC/BCC & 액션 */}
                            <div className="ews-actions">
                                <input
                                    className="ews-input"
                                    type="email"
                                    placeholder="받는사람 이메일 입력 (쉼표로 여러 명)"
                                    value={toEmail}
                                    onChange={(e) => setToEmail(e.target.value)}
                                />
                                <input
                                    className="ews-input"
                                    type="text"
                                    placeholder="CC (쉼표로 여러 명)"
                                    value={cc}
                                    onChange={(e) => setCc(e.target.value)}
                                />
                                <input
                                    className="ews-input"
                                    type="text"
                                    placeholder="BCC (쉼표로 여러 명)"
                                    value={bcc}
                                    onChange={(e) => setBcc(e.target.value)}
                                />
                            </div>

                            <div className="ews-actions mt-8">
                                <button className="ews-primary" onClick={saveDraft}>
                                    현재 내용 임시저장
                                </button>
                                <button
                                    className="ews-primary outline"
                                    onClick={() => {
                                        if (
                                            !userInfo?.email ||
                                            userInfo.email.includes("필요") ||
                                            userInfo.email === "이메일 정보 없음"
                                        ) {
                                            displayToast("내 이메일 정보가 없어 테스트 발송이 불가합니다.");
                                            return;
                                        }
                                        // 나에게 테스트 발송 (To만 내 메일로 override)
                                        doSend({to: userInfo.email, cc: "", bcc: ""});
                                    }}
                                >
                                    나에게 테스트 발송
                                </button>

                                <label className="ews-toggle ml-auto">
                                    <input
                                        type="checkbox"
                                        checked={undoEnabled}
                                        onChange={(e) => setUndoEnabled(e.target.checked)}
                                    />
                                    <span>보내기 취소 활성화</span>
                                </label>

                                <select
                                    className="ews-input w-100"
                                    value={undoSeconds}
                                    onChange={(e) => setUndoSeconds(Number(e.target.value))}
                                    disabled={!undoEnabled}
                                    aria-label="보내기 취소 지연"
                                >
                                    <option value={5}>5초</option>
                                    <option value={10}>10초</option>
                                    <option value={20}>20초</option>
                                </select>
                            </div>
                        </section>

                        {/* 빠른 스니펫 */}
                        <section className="ews-card">
                            <div className="ews-card-head with-action">
                                <span>빠른 스니펫</span>
                                <div className="ews-row">
                                    <input
                                        className="ews-input"
                                        placeholder="자주 쓰는 문구를 입력 후 추가"
                                        value={newSnippet}
                                        onChange={(e) => setNewSnippet(e.target.value)}
                                    />
                                    <button className="ews-mini" onClick={addSnippet}>
                                        추가
                                    </button>
                                </div>
                            </div>
                            <div className="ews-templates">
                                {snippets.map((s) => (
                                    <div key={s.id} className="ews-snippet-chip">
                                        <button className="ews-chip" onClick={() => insertSnippet(s.text)}>
                                            삽입
                                        </button>
                                        <span className="ews-snippet-text">{s.text}</span>
                                        <button className="ews-x" onClick={() => deleteSnippet(s.id)}>
                                            삭제
                                        </button>
                                    </div>
                                ))}
                                {snippets.length === 0 && (
                                    <div className="ews-empty">등록된 스니펫이 없습니다.</div>
                                )}
                            </div>
                        </section>

                        {/* 사용자별 통계 + 링크 점검 */}
                        <section className="ews-stats">
                            <div className="ews-stat-card">
                                <div className="ews-stat-label">오늘 보낸 메일</div>
                                <div className="ews-stat-value">{stats.sentToday}건</div>
                            </div>
                            <div className="ews-stat-card">
                                <div className="ews-stat-label">임시저장 개수</div>
                                <div className="ews-stat-value">{drafts.length}개</div>
                            </div>
                            <div className="ews-stat-card">
                                <div className="ews-stat-label">본문 길이</div>
                                <div className="ews-stat-value">
                                    {stats.wordCount}단어 • 약 {stats.readMin}분
                                </div>
                            </div>
                            <div className="ews-stat-card links">
                                <div className="ews-stat-label">링크 점검</div>
                                <div className="ews-links">
                                    {stats.links.length === 0 && stats.suspicious.length === 0 && (
                                        <div className="ews-dim">감지된 링크 없음</div>
                                    )}
                                    {stats.links.map((u, i) => (
                                        <div key={`ok-${i}`} className="ok">
                                            {u}
                                        </div>
                                    ))}
                                    {stats.suspicious.map((u, i) => (
                                        <div key={`warn-${i}`} className="warn">
                                            프로토콜 누락: {u} → https://{u}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* ───── 토스트 & 팝아웃 딤 ───── */}
            <ToastMessage message={toastMessage} show={showToast}/>
            {isExpanded && (
                <div
                    className="composer-backdrop show"
                    onClick={() => setIsExpanded(false)}
                    aria-hidden="true"
                />
            )}

            {/* ───── 우하단 고정 컴포저 ───── */}
            <form
                ref={form}
                onSubmit={onSubmit}
                className={`composer-container ${isCollapsed ? "is-collapsed" : ""} ${
                    isHidden ? "is-hidden" : ""
                } ${isExpanded ? "is-expanded" : ""}`}
            >
                <div className="composer-header">
                    <div className="win-group">
                        <button type="button" className="win-btn" onClick={onMinimize} title="최소화">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                <path d="M5 19h14"/>
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="win-btn"
                            onClick={onExpand}
                            title={isExpanded ? "원래 크기" : "팝아웃"}
                        >
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
            {isLoading
                ? "로딩 중..."
                : `${userInfo.name || "사용자"} <${userInfo.email || "-"}>`}
          </span>
                </div>

                <div className="field-row">
                    <label className="field-label">받는사람</label>
                    <span className="field-value">{toEmail}</span>
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
                <div id="message-editor" className="composer-textarea" {...bind} />

                {/* 보내기 취소 배너 */}
                {pending && (
                    <div className="ews-undo">
                        <span>전송까지 {pendingLeft}초…</span>
                        <button type="button" className="ews-mini danger" onClick={cancelPendingSend}>
                            취소
                        </button>
                    </div>
                )}

                {/* 하단 버튼 */}
                <div className="composer-bottom">
                    <button type="submit" className="composer-button send-button" disabled={isSending || pending}>
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

                {/* 히든 필드 (EmailJS 템플릿 변수와 매칭) */}
                {/* 템플릿에서 {{to}}, {{cc}}, {{bcc}}, {{subject}}, {{message}} 사용 권장 */}
                <input type="hidden" name="to" value={toEmail}/>
                <input type="hidden" name="cc" value={cc}/>
                <input type="hidden" name="bcc" value={bcc}/>
                <input type="hidden" name="name" value={userInfo.name || ""}/>
                <input type="hidden" name="email" value={userInfo.email || ""}/>
                <textarea name="message" value={message} readOnly style={{display: "none"}}/>
            </form>

            {/* FAB */}
            <button type="button" className={`composer-fab ${isHidden ? "show" : ""}`}
                    onClick={() => setIsHidden(false)}>
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

export default EmailComposer;
