// src/components/ResourceLibrary.jsx
import {useEffect, useMemo, useState} from "react";
import "../css/ResourceLibrary.css";
import {testQuestions, getDetailedResult} from "../constants/selfTestData";

/* ───────────── 자료실 데이터 ───────────── */
const resourceData = {
    우울증: {
        title: "우울증에 대하여",
        content: [
            {
                heading: "우울증이란 무엇인가요?",
                text:
                    "우울증은 단순한 기분 저하가 아닌, 생각의 내용, 사고 방식, 동기, 관심사, 수면, 신체 활동 등 전반적인 정신 기능이 지속적으로 저하되어 일상 생활에 심각한 영향을 미치는 상태를 의미합니다. 이는 의지로 극복할 수 있는 문제가 아니며, 전문가의 도움이 필요한 뇌 기능의 문제입니다.",
            },
            {
                heading: "주요 증상은 무엇인가요?",
                text:
                    "거의 매일 지속되는 우울한 기분, 흥미나 즐거움의 현저한 감소, 의욕 저하, 수면 문제(불면 또는 과다수면), 식욕 변화, 집중력 저하, 자기 비난이나 죄책감 등이 2주 이상 지속될 경우 의심해볼 수 있습니다.",
            },
            {
                heading: "어떻게 대처할 수 있나요?",
                text:
                    "혼자 해결하려 하지 않고 전문가의 도움을 받는 것이 중요합니다. 정신건강의학과 방문을 통해 정확한 진단을 받고, 상담 치료나 약물 치료를 병행하는 것이 효과적입니다. 또한 규칙적인 생활 습관, 가벼운 운동, 햇볕 쬐기 등도 증상 완화에 도움이 됩니다.",
            },
        ],
        recommendations: [
            {title: "죽고 싶지만 떡볶이는 먹고 싶어", author: "백세희", description: "가벼운 우울감을 겪는 이들에게 큰 공감과 위로를 주는 상담 에세이."},
            {title: "우울할 땐 뇌과학", author: "앨릭스 코브", description: "우울증의 신경과학적 원인과 실용적 해결책을 과학적으로 제시."},
            {title: "필링 굿", author: "데이비드 D. 번스", description: "CBT의 고전. 왜곡된 생각을 교정하는 구체적 방법을 제시."},
            {title: "잃어버린 연결", author: "요한 하리", description: "사회·환경적 요인에 주목해 우울증을 새 관점에서 조망."},
        ],
    },
    불안장애: {
        title: "불안장애에 대하여",
        content: [
            {
                heading: "불안장애란 무엇인가요?",
                text:
                    "비정상적·병적인 불안과 공포로 일상에 장애를 일으키는 질환을 통칭합니다. 위험하지 않은 상황에서도 과도한 불안, 심장 두근거림, 호흡 곤란 등의 신체 증상이 동반될 수 있습니다.",
            },
            {
                heading: "어떤 종류가 있나요?",
                text:
                    "범불안장애, 공황장애, 사회불안장애, 특정 공포증 등. 유형별 증상과 유발 요인이 달라 정확한 진단이 중요합니다.",
            },
            {
                heading: "어떻게 대처할 수 있나요?",
                text:
                    "인지행동치료(CBT)가 효과적인 치료법으로 알려져 있습니다. 스트레스 관리, 이완 요법, 명상, 필요 시 약물치료 병행을 권장합니다.",
            },
        ],
        recommendations: [
            {title: "불안이라는 친구", author: "아나 K. 디모레이", description: "불안을 없애기보다 함께 살아가는 관점 전환을 돕는 책."},
            {title: "데어", author: "배리 맥도나", description: "DARE 기법으로 공황 발작의 악순환을 끊는 실전 가이드."},
            {title: "불안 해결의 실마리", author: "저드슨 브루어", description: "불안이 습관이 되는 원리를 설명하고 마음챙김 훈련을 제시."},
        ],
    },
    스트레스: {
        title: "스트레스에 대하여",
        content: [
            {
                heading: "스트레스란?",
                text:
                    "스트레스는 외부 요구(업무·학업·관계 등)와 내부 자원 사이의 불균형에서 생기는 심리·생리적 반응입니다. 적정 수준은 동기를 주지만 과도하면 건강을 해칠 수 있습니다.",
            },
            {
                heading: "주요 신호",
                text:
                    "쉽게 피로함, 짜증/분노 증가, 수면의 질 저하, 긴장성 두통/근육통, 집중력 저하, 위장 불편감, 과식·폭식/식욕감소, 회피·지연이 늘어남 등.",
            },
            {
                heading: "대처 전략",
                text:
                    "가시화된 할 일 목록과 우선순위, 20–5 미니 휴식, 규칙적 수면·식사·운동, 카페인/니코틴 과다 회피, 마음챙김 호흡 3분, 회복을 위한 ‘무계획 시간’ 확보 등을 실천해보세요.",
            },
        ],
        recommendations: [
            {title: "번아웃 증후군", author: "크리스티나 마슬라크", description: "직무 스트레스와 소진을 과학적으로 다루는 고전."},
            {title: "스탠퍼드식 걷기", author: "사이토 다카시", description: "짧은 걷기로 스트레스·불안을 완화하는 실전 팁."},
            {title: "숨쉬듯 가볍게", author: "Various", description: "마음챙김 호흡·바디스캔 등 부담 없이 시작하는 이완기법."},
        ],
    },
    ADHD: {
        title: "성인 ADHD에 대하여",
        content: [
            {
                heading: "성인 ADHD란 무엇인가요?",
                text: "아동기에 주로 진단되지만 성인기까지 이어질 수 있습니다. 충동성, 부주의, 과잉행동으로 직장/관계에서 어려움이 생길 수 있습니다."
            },
            {heading: "주요 증상은?", text: "업무·계획 관리 어려움, 마감/약속 잦은 실수, 충동적 결정, 잦은 이직, 감정 기복, 낮은 자존감 등."},
            {heading: "대처 방법", text: "약물 치료가 충동성과 집중력 조절에 효과적입니다. 상담을 통해 시간관리/계획/감정 조절 스킬을 훈련하면 일상 기능 향상에 큰 도움이 됩니다."},
        ],
        recommendations: [
            {title: "성인 ADHD의 모든 것", author: "더글러스 버메스터", description: "진단·치료·생활 전략을 포괄적으로 안내."},
            {title: "집중력의 재발견", author: "에드워드 할로웰, 존 레이티", description: "ADHD 분야의 고전적 필독서."},
            {title: "How to ADHD (YouTube)", author: "Jessica McCabe", description: "실전 팁과 전략을 유쾌하게 제공."},
        ],
    },
    "게임 중독": {
        title: "게임 중독(장애)에 대하여",
        content: [
            {heading: "게임 중독이란?", text: "게임 이용에 대한 통제력을 잃고, 중요한 활동보다 게임을 우선시하며, 부정적 결과에도 지속/확대하는 패턴을 말합니다(WHO 공식 질병)."},
            {heading: "주요 증상", text: "시간/빈도 조절 실패, 학업·업무·관계보다 게임 우선, 문제 발생에도 중단 어려움, 비이용 시 불안/초조/우울감 등."},
            {heading: "대처 방법", text: "문제 인식 → 구체적 목표(주/일/회) 설정 → 대체 취미 탐색. 혼자 조절 어렵다면 상담·치료 기관 도움을 받는 것이 가장 효과적입니다."},
        ],
        recommendations: [
            {title: "스마트폰과 헤어지는 법", author: "캐서린 프라이스", description: "디지털 기기 사용 조절을 위한 구체적 방법."},
            {title: "Irresistible", author: "애덤 알터", description: "기술이 중독적으로 설계되는 심리학적 메커니즘."},
            {title: "디지털 미니멀리즘", author: "칼 뉴포트", description: "기술과의 건강한 경계로 집중을 회복하는 법."},
        ],
    },
    "반항 장애": {
        title: "반항 장애(ODD)에 대하여",
        content: [
            {heading: "ODD란?", text: "아동·청소년기에 나타나는 행동장애로, 권위 인물에 대한 지속적 거부/적대/도전적 행동이 특징입니다."},
            {heading: "주요 증상", text: "쉽게 분노, 어른과 논쟁, 규칙 무시/도발, 남 탓, 짜증과 원한 지속(6개월 이상)."},
            {heading: "대처 방법", text: "일관된 규칙·훈육, 긍정적 행동 칭찬/보상, 부모교육·가족치료·사회성 훈련 등 전문가 개입이 효과적입니다."},
        ],
        recommendations: [
            {title: "아이는 어떻게 성공하는가", author: "폴 터프", description: "비인지 역량의 중요성과 양육법."},
            {title: "폭발하는 아이", author: "로스 W. 그린", description: "갈등을 줄이는 협력적 문제 해결법."},
            {title: "1-2-3 매직", author: "토마스 W. 펠란", description: "문제행동 중단·긍정행동 장려 훈육법."},
        ],
    },
};

/* ───────────── SelfTest (단일 타입 잠금) ───────────── */
const scoreMap = {"거의 없다": 0, "가끔그렇다": 1, "자주그렇다": 2, "거의매일그렇다": 3};

function InlineSelfTestLocked({type = "우울증"}) {
    const [answers, setAnswers] = useState(Array(testQuestions[type]?.length || 0).fill(""));
    const [result, setResult] = useState("");

    useEffect(() => {
        setAnswers(Array(testQuestions[type]?.length || 0).fill(""));
        setResult("");
    }, [type]);

    const onChange = (idx, val) => {
        setAnswers((prev) => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const onSubmit = () => {
        const scores = answers.map((a) => scoreMap[a] ?? 0);
        const total = scores.reduce((s, v) => s + v, 0);
        setResult(getDetailedResult(type, total));
    };

    return (
        <section className="selftest-card">
            <div className="selftest-head">
                <h2>{type} 자가검사</h2>
                <span className="type-lock">이 검사는 선택한 주제에 맞게 고정됩니다</span>
            </div>

            <div className="selftest-meta">
                <h3>한국인 {type} 척도</h3>
                <p className="test-source"><strong>출처 :</strong> 보건복지부 국립정신건강센터(한국인정신건강척도)</p>
                <p className="test-guide">
                    최근 2주간 각 문항의 경험 빈도를 선택해 주세요.<br/>
                    (가끔그렇다: 주2일 이상, 자주그렇다: 1주 이상, 거의매일그렇다: 거의 2주)
                </p>
            </div>

            <ul className="self-test-list">
                {testQuestions[type]?.map((q, i) => (
                    <li key={i} className="self-test-item">
                        <p className="question">{i + 1}. {q}</p>
                        <div className="self-option-group">
                            {["거의 없다", "가끔그렇다", "자주그렇다", "거의매일그렇다"].map((opt) => (
                                <label key={opt} className="self-option">
                                    <input
                                        type="radio"
                                        name={`q${i}`}
                                        value={opt}
                                        checked={answers[i] === opt}
                                        onChange={() => onChange(i, opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="self-button-group">
                <button className="self-button primary" onClick={onSubmit}>검사 제출</button>
                <button
                    className="self-button ghost"
                    onClick={() => {
                        setAnswers(Array(testQuestions[type].length).fill(""));
                        setResult("");
                    }}
                >
                    다시하기
                </button>
            </div>

            {result && result.categories && (
                <div className="result-card">
                    <h3 className="result-title">{result.title}</h3>
                    <p className="result-description">{result.description}</p>
                    {Object.entries(result.categories).map(([cat, items], idx) => (
                        <div key={idx} className="result-category-block">
                            <p className="result-category-title">✅ {cat}</p>
                            <ul className="recommendation-list">
                                {items.map((item, j) => (<li key={j}>· {item}</li>))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

/* ───────────── 레이아웃 (상단 주제 탭 + 좌측 사이드 탭) ───────────── */
const AVAILABLE_TEST_TYPES = ["우울증", "불안장애", "스트레스"];

const ResourceLibrary = () => {
    const topics = Object.keys(resourceData);
    const [selectedTopic, setSelectedTopic] = useState(topics[0]);
    const [view, setView] = useState("overview"); // overview | selftest | recommendations

    const current = resourceData[selectedTopic];
    const hasSelfTest = AVAILABLE_TEST_TYPES.includes(selectedTopic);

    // 주제 바뀌면 개요로, 또는 자가검사 탭 숨김 보호
    useEffect(() => {
        if (!hasSelfTest && view === "selftest") setView("overview");
    }, [selectedTopic]); // eslint-disable-line

    return (
        <div className="rl-root">
            {/* 상단: 제목 + 주제 탭 */}
            <header className="library-header">
                <h1 className="library-title">마음 자료실</h1>
                <nav className="topic-tabs">
                    {topics.map((t) => (
                        <button
                            key={t}
                            className={`topic-tab ${selectedTopic === t ? "active" : ""}`}
                            onClick={() => setSelectedTopic(t)}
                        >
                            {t}
                        </button>
                    ))}
                </nav>
            </header>

            {/* 본문: 좌측 사이드 탭 + 콘텐츠 */}
            <div className="library-grid">
                <aside className="content-sidenav">
                    <button
                        className={`side-tab ${view === "overview" ? "active" : ""}`}
                        onClick={() => setView("overview")}
                    >
                        <span className="dot overview"/> 개요
                    </button>

                    {hasSelfTest && (
                        <button
                            className={`side-tab ${view === "selftest" ? "active" : ""}`}
                            onClick={() => setView("selftest")}
                        >
                            <span className="dot selftest"/> 자가검사
                        </button>
                    )}

                    <button
                        className={`side-tab ${view === "recommendations" ? "active" : ""}`}
                        onClick={() => setView("recommendations")}
                    >
                        <span className="dot rec"/> 추천자료
                    </button>
                </aside>

                <main className="content-main">
                    {view === "overview" && (
                        <div className="overview">
                            <h2 className="content-title">{current.title}</h2>
                            {current.content.map((section, idx) => (
                                <section key={idx} className="content-card">
                                    <h3>{section.heading}</h3>
                                    <p>{section.text}</p>
                                </section>
                            ))}
                        </div>
                    )}

                    {view === "selftest" && hasSelfTest && (
                        <InlineSelfTestLocked type={selectedTopic}/>
                    )}

                    {view === "recommendations" && current.recommendations && (
                        <section className="recommendations-section">
                            <h2 className="content-title">추천 도서 및 자료</h2>
                            <div className="recommendations-list">
                                {current.recommendations.map((item, idx) => (
                                    <div key={idx} className="recommendation-card">
                                        <p className="rec-title">{item.title}</p>
                                        <p className="rec-author">{item.author}</p>
                                        <p className="rec-description">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ResourceLibrary;
