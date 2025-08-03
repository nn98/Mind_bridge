import { useState } from 'react';
import '../css/ResourceLibrary.css';

const resourceData = {
    '우울증': {
        title: '우울증에 대하여',
        content: [
            {
                heading: '우울증이란 무엇인가요?',
                text: '우울증은 단순한 기분 저하가 아닌, 생각의 내용, 사고 방식, 동기, 관심사, 수면, 신체 활동 등 전반적인 정신 기능이 지속적으로 저하되어 일상 생활에 심각한 영향을 미치는 상태를 의미합니다. 이는 의지로 극복할 수 있는 문제가 아니며, 전문가의 도움이 필요한 뇌 기능의 문제입니다.'
            },
            {
                heading: '주요 증상은 무엇인가요?',
                text: '거의 매일 지속되는 우울한 기분, 흥미나 즐거움의 현저한 감소, 의욕 저하, 수면 문제(불면 또는 과다수면), 식욕 변화, 집중력 저하, 자기 비난이나 죄책감 등이 2주 이상 지속될 경우 의심해볼 수 있습니다.'
            },
            {
                heading: '어떻게 대처할 수 있나요?',
                text: '가장 중요한 것은 혼자 해결하려 하지 않고 전문가의 도움을 받는 것입니다. 정신건강의학과 방문을 통해 정확한 진단을 받고, 상담 치료나 약물 치료를 병행하는 것이 효과적입니다. 또한, 규칙적인 생활 습관, 가벼운 운동, 햇볕 쬐기 등도 증상 완화에 도움이 됩니다.'
            }
        ],
        recommendations: [
            { title: '죽고 싶지만 떡볶이는 먹고 싶어', author: '백세희', description: '가벼운 우울감을 겪는 이들에게 큰 공감과 위로를 주는 상담 에세이입니다.' },
            { title: '우울할 땐 뇌과학', author: '앨릭스 코브', description: '우울증의 신경과학적 원인을 설명하고 실용적인 해결책을 과학적으로 제시합니다.' },
            { title: '필링 굿', author: '데이비드 D.번스', description: '인지행동치료(CBT)의 교과서로 불리는 책으로, 우울한 감정을 일으키는 왜곡된 생각을 스스로 교정하는 구체적인 방법을 제시합니다.' },
            { title: '잃어버린 연결', author: '요한 하리', description: '우울증의 원인을 단순히 뇌의 화학적 불균형이 아닌, 사회적, 환경적 요인과의 연결이 끊어진 상태로 보고 새로운 관점의 해법을 제시합니다.' }
        ]
    },
    '불안장애': {
        title: '불안장애에 대하여',
        content: [
            {
                heading: '불안장애란 무엇인가요?',
                text: '불안장애는 다양한 형태의 비정상적이고 병적인 불안과 공포로 인하여 일상 생활에 장애를 일으키는 정신 질환을 통칭합니다. 위험한 상황이 아닌데도 불구하고 과도한 불안감, 심장 두근거림, 호흡 곤란 등의 신체적 증상이 동반될 수 있습니다.'
            },
            {
                heading: '어떤 종류가 있나요?',
                text: '범불안장애, 공황장애, 사회불안장애, 특정 공포증 등 다양한 종류가 있습니다. 각 유형에 따라 증상과 유발 요인이 다르므로 정확한 진단이 중요합니다.'
            },
            {
                heading: '어떻게 대처할 수 있나요?',
                text: '인지행동치료(CBT)가 가장 효과적인 치료법 중 하나로 알려져 있습니다. 스트레스 관리 기법, 이완 요법, 명상 등을 배우는 것도 도움이 됩니다. 필요한 경우 약물 치료가 병행될 수 있으니 전문가와 상담하는 것이 중요합니다.'
            }
        ],
        recommendations: [
            { title: '불안이라는 친구', author: '아나 K. 디모레이', description: '불안을 없애야 할 적이 아닌, 함께 살아가는 친구로 바라보도록 도와주는 책입니다.' },
            { title: '데어', author: '배리 맥도나', description: '불안을 억누르는 대신 받아들이는 DARE 기법을 통해 공황 발작을 멈추는 법을 알려줍니다.' },
            { title: '불안 해결의 실마리', author: '저드슨 브루어', description: '불안이 습관이 되는 원리를 설명하고, 마음챙김을 통해 불안의 고리를 끊는 훈련법을 소개합니다.' },
        ]
    },
    'ADHD': {
        title: '성인 ADHD에 대하여',
        content: [
            {
                heading: '성인 ADHD란 무엇인가요?',
                text: '주의력결핍 과잉행동장애(ADHD)는 아동기에 주로 진단되지만, 많은 경우 성인기까지 증상이 이어집니다. 성인 ADHD는 충동성, 부주의, 과잉행동의 특징을 보이며, 직장 생활이나 대인 관계에서 어려움을 겪는 원인이 될 수 있습니다.'
            },
            {
                heading: '주요 증상은 무엇인가요?',
                text: '업무나 계획을 체계적으로 관리하기 어려움, 약속이나 마감일을 자주 잊음, 충동적인 결정, 잦은 이직, 감정 기복, 낮은 자존감 등이 대표적인 증상입니다.'
            },
            {
                heading: '어떻게 대처할 수 있나요?',
                text: '성인 ADHD는 치료 가능한 질환입니다. 약물 치료를 통해 집중력과 충동성을 조절하는 것이 매우 효과적이며, 상담을 통해 시간 관리 기술, 계획 세우기, 감정 조절 방법 등을 배우는 것이 일상 기능 향상에 큰 도움이 됩니다.'
            }
        ],
        recommendations: [
            { title: '성인 ADHD의 모든 것', author: '더글러스 버메스터', description: '성인 ADHD의 진단, 증상, 치료 및 일상생활 전략에 대해 포괄적으로 다룹니다.' },
            { title: '집중력의 재발견', author: '에드워드 할로웰, 존 레이티', description: '성인 ADHD 분야의 고전적인 필독서로, ADHD의 어려움과 강점을 깊이 있게 탐구합니다.' },
            { title: 'How to ADHD (유튜브 채널)', author: 'Jessica McCabe', description: 'ADHD 당사자에게 실질적으로 도움이 되는 다양한 팁과 전략을 유쾌하게 알려주는 영상 자료입니다.' },
        ]
    },
    '게임 중독': {
        title: '게임 중독(장애)에 대하여',
        content: [
            {
                heading: '게임 중독이란 무엇인가요?',
                text: '게임 중독(Gaming Disorder)은 게임 이용에 대한 통제력을 잃고, 다른 중요한 삶의 활동보다 게임을 우선시하며, 부정적인 결과가 발생함에도 불구하고 게임을 지속하거나 확대하는 행동 패턴을 의미합니다. 이는 세계보건기구(WHO)에서 공식적으로 질병으로 인정한 상태입니다.'
            },
            {
                heading: '주요 증상은 무엇인가요?',
                text: '게임 시간이나 빈도를 조절하지 못함, 일상생활(학업, 업무, 대인관계)보다 게임을 우선시함, 게임 때문에 문제가 생겨도 멈추지 못함, 게임을 하지 않을 때 불안, 초조, 우울감을 느낌 등이 대표적인 증상입니다.'
            },
            {
                heading: '어떻게 대처할 수 있나요?',
                text: '가장 먼저 스스로 문제를 인식하는 것이 중요합니다. 구체적인 게임 시간 목표를 설정하고, 게임 외에 즐거움을 느낄 수 있는 다른 취미 활동을 찾는 것이 도움이 됩니다. 혼자서 조절이 어렵다면, 주저하지 말고 상담 센터나 병원을 방문하여 전문가의 도움을 받는 것이 가장 효과적인 방법입니다.'
            }
        ],
        recommendations: [
            { title: '스마트폰과 헤어지는 법', author: '캐서린 프라이스', description: '디지털 기기 사용을 조절하고 현실 세계에 더 집중할 수 있는 구체적인 방법을 제시합니다.' },
            { title: '이resistible', author: '애덤 알터', description: '게임 등 다양한 디지털 기술이 어떻게 우리의 행동을 중독적으로 설계하는지 심리학적으로 분석합니다.' },
            { title: '디지털 미니멀리즘', author: '칼 뉴포트', description: '기술과의 건강한 관계 맺기를 통해 정말 중요한 것에 집중하는 삶의 방식을 제안합니다.' },
        ]
    },
    '반항 장애': {
        title: '반항 장애(ODD)에 대하여',
        content: [
            {
                heading: '반항 장애란 무엇인가요?',
                text: '적대적 반항 장애(Oppositional Defiant Disorder)는 주로 아동 및 청소년기에 나타나는 행동 장애입니다. 권위적인 인물(부모, 교사 등)에 대해 지속적으로 거부적이고, 적대적이며, 도전적인 행동 패턴을 보이는 것이 특징이며, 이는 일반적인 아동의 반항 수준을 넘어섭니다.'
            },
            {
                heading: '주요 증상은 무엇인가요?',
                text: '쉽게 화를 내거나 분노를 터뜨림, 어른과 잦은 논쟁, 의도적으로 규칙을 무시하거나 화나게 함, 자신의 실수를 남 탓으로 돌림, 쉽게 짜증을 내고 원한을 품는 모습 등이 6개월 이상 지속될 경우 의심할 수 있습니다.'
            },
            {
                heading: '어떻게 대처할 수 있나요?',
                text: '가정과 학교의 일관성 있는 훈육과 규칙 설정이 중요합니다. 긍정적인 행동에 대해 칭찬과 보상을 해주는 것이 효과적이며, 부모 교육 훈련이나 가족 치료, 아동의 사회 기술 훈련 등 전문가의 개입이 필요한 경우가 많습니다. 정확한 진단을 위해 전문가와 상담하는 것이 우선입니다.'
            }
        ],
        recommendations: [
            { title: '아이는 어떻게 성공하는가', author: '폴 터프', description: '의지력, 자제력 등 성공적인 삶에 필요한 비인지적 능력의 중요성과 양육법을 다룹니다.' },
            { title: '폭발하는 아이', author: '로스 W. 그린', description: '쉽게 좌절하고 분노를 터뜨리는 아이들을 이해하고, 갈등을 줄이는 협력적 문제 해결법을 제시합니다.' },
            { title: '1-2-3 매직', author: '토마스 W. 펠란', description: '문제 행동을 멈추고 긍정적 행동을 장려하는 간단하고 효과적인 훈육법을 알려주는 부모 교육 필독서입니다.' },
        ]
    },
};

const ResourceLibrary = () => {
    const [selectedTopic, setSelectedTopic] = useState(Object.keys(resourceData)[0]);
    const currentResource = resourceData[selectedTopic];

    return (
        <div className="resource-library-container">
            <h1 className="library-title">마음 자료실</h1>
            <div className="library-layout">
                <aside className="library-sidebar">
                    <nav>
                        <ul>
                            {Object.keys(resourceData).map(topic => (
                                <li key={topic}>
                                    <button
                                        className={`sidebar-button ${selectedTopic === topic ? 'active' : ''}`}
                                        onClick={() => setSelectedTopic(topic)}
                                    >
                                        {topic}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
                <main className="library-content">
                    <h2>{currentResource.title}</h2>
                    {currentResource.content.map((section, index) => (
                        <section key={index} className="content-section">
                            <h3>{section.heading}</h3>
                            <p>{section.text}</p>
                        </section>
                    ))}

                    {currentResource.recommendations && currentResource.recommendations.length > 0 && (
                        <section className="recommendations-section">
                            <h3>추천 도서 및 자료</h3>
                            <div className="recommendations-list">
                                {currentResource.recommendations.map((item, index) => (
                                    <div key={index} className="recommendation-card">
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
