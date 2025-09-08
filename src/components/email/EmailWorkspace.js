import {useCallback, useEffect, useMemo, useState} from "react";
import "../../css/EmailWorkspace.css";
import EmailComposer from "./EmailComposer";

// 이 파일 안에 간단 템플릿/샘플 (원하면 별도 constants로 분리 가능)
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

export default function EmailWorkspace() {
    // 좌/중 패널 state
    const [me, setMe] = useState({name: "", email: ""});
    useEffect(() => {
        // 화면 상단 "보내는 사람"은 EmailComposer에서 이미 불러오니,
        // 여기선 단순 플레이스홀더. (원하면 실제 fetchMyProfile로 교체)
        setMe({name: "사용자", email: "me@example.com"});
    }, []);

    const [useSignature, setUseSignature] = useState(true);

    // 첨부 드롭존(작업공간 미리보기 용 — 실제 전송은 EmailComposer 내부 로직 사용)
    const [attachments, setAttachments] = useState([]);
    const onDropFiles = (files) => {
        const list = Array.from(files);
        setAttachments((prev) => [...prev, ...list]);
    };

    // 최근 수신자/임시저장 (로컬 스토리지)
    const RECENTS_KEY = "mb_recent_recipients";
    const DRAFT_KEY = "mb_email_drafts_v1";

    const [recentRecipients, setRecentRecipients] = useState(() => {
        const saved = localStorage.getItem(RECENTS_KEY);
        return saved ? JSON.parse(saved) : ["mindbridge2020@gmail.com", "support@mindbridge.app"];
    });

    const pushRecent = (mail) => {
        const next = [mail, ...recentRecipients.filter((m) => m !== mail)].slice(0, 12);
        setRecentRecipients(next);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        // EmailComposer는 받는사람이 span 고정이라 바로 주입은 불가.
        alert(`받는 사람으로 ${mail}을(를) 사용할 수 있습니다. (Composer는 고정표시)`);
    };

    const [drafts, setDrafts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(DRAFT_KEY)) || [];
        } catch {
            return [];
        }
    });

    // 👉 EmailComposer 내부 DOM을 직접 읽어 임시저장/불러오기 (현재 컴포저가 내부상태형이라 브리지 방식 사용)
    const readComposer = () => {
        const subjectEl = document.querySelector('input[name="title"]');
        const editor = document.getElementById("message-editor");
        return {
            subject: subjectEl?.value || "",
            html: editor?.innerHTML || "",
            text: editor?.textContent || ""
        };
    };

    const writeComposer = ({subject, html}) => {
        const subjectEl = document.querySelector('input[name="title"]');
        const editor = document.getElementById("message-editor");

        if (subjectEl) {
            subjectEl.value = subject || "";
            subjectEl.dispatchEvent(new Event("input", {bubbles: true})); // onChange 트리거
        }
        if (editor) {
            editor.innerHTML = html || "";
            editor.dispatchEvent(new Event("input", {bubbles: true}));   // useContentEditable 트리거
        }
    };

    const saveDraft = useCallback(() => {
        const {subject, html, text} = readComposer();
        if (!subject && !text) {
            alert("저장할 내용이 없습니다.");
            return;
        }
        const draft = {
            id: crypto.randomUUID(),
            subject,
            html,
            savedAt: Date.now(),
        };
        const next = [draft, ...drafts].slice(0, 50);
        setDrafts(next);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        alert("현재 작성중인 메일을 임시저장 했습니다.");
    }, [drafts]);

    const loadDraft = (d) => writeComposer({subject: d.subject, html: d.html});
    const deleteDraft = (id) => {
        const next = drafts.filter((x) => x.id !== id);
        setDrafts(next);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    };

    // 템플릿 적용 (현재 컴포저에 직접 주입)
    const applyTemplate = (tpl) => {
        const baseBody = tpl.body.replace(/\n/g, "<br/>");
        const html = useSignature ? `${baseBody}<br/><br/>${DEFAULT_SIGNATURE(me).replace(/\n/g, "<br/>")}` : baseBody;
        writeComposer({subject: tpl.subject, html});
    };

    // 간단 통계 (임시저장 개수 등)
    const stats = useMemo(() => ({
        draftsCount: drafts.length
    }), [drafts]);

    return (
        <div className="email-workspace">
            {/* 왼쪽 패널 */}
            <aside className="ew-left">
                <section className="ew-card">
                    <div className="ew-card-head">템플릿</div>
                    <div className="ew-templates">
                        {TEMPLATES.map((tpl) => (
                            <button key={tpl.id} className="ew-chip" onClick={() => applyTemplate(tpl)}>
                                {tpl.title}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ew-card">
                    <div className="ew-card-head">최근 수신자</div>
                    <div className="ew-list">
                        {recentRecipients.map((mail) => (
                            <button key={mail} className="ew-list-item" onClick={() => pushRecent(mail)}>
                                {mail}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ew-card">
                    <div className="ew-card-head">
                        임시 저장
                        <button className="ew-mini" onClick={saveDraft} title="현재 내용을 임시저장">저장</button>
                    </div>
                    <div className="ew-drafts">
                        {drafts.length === 0 && <div className="ew-empty">아직 저장된 임시 메일이 없어요.</div>}
                        {drafts.map((d) => (
                            <div key={d.id} className="ew-draft-row">
                                <button className="ew-draft-load" onClick={() => loadDraft(d)}>
                                    {d.subject || "(제목 없음)"} <span
                                    className="ew-dim">• {new Date(d.savedAt).toLocaleString()}</span>
                                </button>
                                <button className="ew-draft-del" onClick={() => deleteDraft(d.id)}>삭제</button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="ew-card">
                    <div className="ew-card-head">서명</div>
                    <label className="ew-toggle">
                        <input type="checkbox" checked={useSignature}
                               onChange={(e) => setUseSignature(e.target.checked)}/>
                        <span>메일 하단에 기본 서명 자동 추가</span>
                    </label>
                    {useSignature && <pre className="ew-signature-preview">{DEFAULT_SIGNATURE(me)}</pre>}
                </section>
            </aside>

            {/* 중앙 패널 */}
            <main className="ew-center">
                <section className="ew-hero">
                    <h2>이메일 작업공간</h2>
                    <p>템플릿으로 빠르게 시작하고, 파일을 끌어다 첨부해 보세요.</p>
                    <div className="ew-quick">
                        <button onClick={saveDraft}>현재 내용 임시저장</button>
                        <label className="ew-file">
                            파일 첨부
                            <input type="file" multiple onChange={(e) => onDropFiles(e.target.files)}/>
                        </label>
                    </div>
                </section>

                <section className="ew-dropzone"
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => {
                             e.preventDefault();
                             onDropFiles(e.dataTransfer.files);
                         }}>
                    <div className="ew-drop-inner">여기로 파일을 드래그해서 첨부하세요</div>
                    {attachments.length > 0 && (
                        <div className="ew-attach-list">
                            {attachments.map((f, idx) => (
                                <div key={idx} className="ew-attach-item">
                                    <span className="ew-name">{f.name}</span>
                                    <span className="ew-size">{(f.size / 1024).toFixed(1)} KB</span>
                                    <button className="ew-x"
                                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}>제거
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="ew-stats">
                    <div className="ew-stat">
                        <div className="ew-stat-label">임시저장 개수</div>
                        <div className="ew-stat-value">{stats.draftsCount}개</div>
                    </div>
                </section>
            </main>

            {/* 우측 하단 고정된 EmailComposer (기존 파일 그대로 사용) */}
            <EmailComposer/>
        </div>
    );
}
