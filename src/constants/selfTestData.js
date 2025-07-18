export const testQuestions = {
    '우울증': [
        '평소보다 식욕이 없었다',
        '무슨 일을 해도 기운이 없었다',
        '사는 게 허무하게 느껴졌다',
        '자주 울었다',
        '희망을 느끼지 못했다',
        '평소보다 우울했다',
        '평소보다 말수가 줄었다',
        '가족이나 친구에게 짜증을 냈다',
        '밤에 잠을 이루기 어려웠다',
        '자주 피곤함을 느꼈다',
        '다른 사람들과 이야기하기 싫었다',
        '어떤 일에도 집중이 잘 안 되었다',
    ],
    '불안장애': [
        '사소한 일에도 걱정이 많다',
        '예상치 못한 일에 쉽게 당황한다',
        '자주 심장이 두근거린다',
        '숨이 가빠지는 느낌이 든다',
        '긴장을 잘 풀지 못한다',
        '불안한 예감이 든다',
        '일상적인 상황에서도 과하게 불안해진다',
        '사람 많은 곳에서 불편함을 느낀다',
        '두려움이 쉽게 생긴다',
        '내가 잘하고 있는지 불안하다',
        '나쁜 일이 일어날까 두렵다',
        '불안해서 잠들기 어렵다',
    ],
    '스트레스': [
        '최근 집중이 잘 안 된다',
        '잠들기 어려운 경우가 많다',
        '쉽게 짜증이 난다',
        '피로감이 자주 느껴진다',
        '매사에 무기력하다',
        '일상이 지루하게 느껴진다',
        '몸이 자주 뻐근하거나 아프다',
        '업무나 학업이 버겁게 느껴진다',
        '다른 사람과 갈등이 자주 생긴다',
        '감정 조절이 어렵다',
        '휴식 시간이 있어도 쉬는 느낌이 들지 않는다',
        '불규칙한 식사로 스트레스를 느낀다',
    ]
};

export const getDetailedResult = (testType, score) => {
    const results = {
        '우울증': [
            {
                range: [0, 4],
                title: '정상 범주의 기분 상태',
                description: `일상생활에서 별다른 우울 증상을 보이지 않는 건강한 상태입니다. 감정 조절과 일상 기능 수행이 원활하며, 스스로 삶을 긍정적으로 평가할 수 있습니다.`,
                categories: {
                    '유지 전략': [
                        '긍정적인 대인 관계 유지',
                        '정기적인 운동 및 취미 생활 지속'
                    ]
                }
            },
            {
                range: [5, 9],
                title: '경미한 우울감',
                description: `약간의 우울 증상이 간헐적으로 나타날 수 있으며, 스트레스 상황에서 기분 기복이 생길 수 있습니다. 아직 기능 저하는 심하지 않지만 예방적 개입이 유효합니다.`,
                categories: {
                    '자기 관리 전략': [
                        '충분한 수면과 영양 섭취',
                        '주기적인 운동 및 일기 쓰기'
                    ],
                    '사회적 연결 유지': [
                        '친한 친구와의 대화 시간 늘리기',
                        '소소한 취미나 소모임 참여하기'
                    ]
                }
            },
            {
                range: [10, 14],
                title: '중등도 수준의 우울장애',
                description: `하루 대부분 우울한 기분이 지속되며, 이유 없이 눈물이 나기도 합니다. 무기력감이 심하고, 집중력이 저하되어 일상적인 업무 수행에 어려움이 있을 수 있습니다. 평소 좋아하던 활동에도 흥미를 잃고, 인간관계를 피하려는 경향이 있으며, 수면장애(불면증 또는 과다수면)와 식습관 변화(식욕 저하 또는 폭식)가 나타날 수 있습니다.

중등도 수준의 우울을 방치하면 더 악화될 수 있습니다. 자존감이 낮아지고, 자신을 비난하는 생각이 반복되는 패턴에 굳어질 수 있지요. 일상에서 할 수 있는 작은 변화라도 천천히 실천하며 전문가의 도움을 받는 것이 중요합니다. 가능한 빨리 전문가를 찾아가 상담을 받으시길 권해 드립니다.`,
                categories: {
                    '전문가 상담 고려하기': [
                        '인지행동치료(CBT)를 통해 부정적인 사고 패턴 변화시키기',
                        '상담사와의 대화를 통해 감정을 객관적으로 조망하기'
                    ],
                    '일상적인 루틴 회복 노력': [
                        '기상 시간을 일정하게 유지하며, 최소한의 활동이라도 수행하기(예: 샤워하기, 침대 정리)',
                        '무리한 목표보다는 실현 가능한 작은 목표부터 실천하기(예: 하루 5분 운동)'
                    ],
                    '신체 활동 증가': [
                        '가벼운 운동 등 신체 움직임을 활용해 기분을 조절할 수 있도록 함',
                        '자연 속에서 걷기, 요가, 가벼운 스트레칭 등 몸을 움직이는 습관 들이기'
                    ],
                    '감정 표현 및 스트레스 해소': [
                        '자신의 감정을 일기나 글로 써보며 정리하기',
                        '음악 감상, 미술 활동 등으로 감정을 표현하는 방법 찾기'
                    ]
                }
            },
            {
                range: [15, 60],
                title: '고위험 수준의 우울장애',
                description: `심한 무기력감, 절망감, 자살 사고 등이 동반될 수 있는 상태입니다. 감정 조절이 매우 어렵고 일상생활 수행이 불가능할 수 있으며 즉각적인 전문 개입이 요구됩니다.`,
                categories: {
                    '긴급 개입 필요': [
                        '정신건강의학과 전문의 상담 즉시 필요',
                        '가까운 정신건강센터 또는 상담전화(1577-0199) 연결'
                    ],
                    '가족 및 지지체계 활용': [
                        '가족이나 가까운 친구에게 현재 상태 알리기',
                        '위기 시 혼자 있지 않도록 하기'
                    ]
                }
            }
        ],
        '불안장애': [
            {
                range: [0, 4],
                title: '정상 범주의 불안 수준',
                description: `일상적인 긴장감 외에 특별한 불안 증상을 보이지 않으며, 일과 대인관계 등 기능에 영향을 주지 않습니다.`,
                categories: {
                    '유지 활동': [
                        '편안한 수면과 식사 유지',
                        '감사 일기 쓰기 또는 명상'
                    ]
                }
            },
            {
                range: [5, 9],
                title: '가벼운 불안 증상',
                description: `불안감이 간헐적으로 느껴지지만 일상생활에는 큰 지장이 없는 수준입니다. 스트레스 상황에서 불안이 악화될 수 있어 예방적 관리가 권장됩니다.`,
                categories: {
                    '감정 인식 및 조절': [
                        '호흡 조절 훈련 및 명상 습관화',
                        '스트레스 일기 작성'
                    ]
                }
            },
            {
                range: [10, 14],
                title: '중등도 수준의 불안장애',
                description: `지속적인 긴장감과 불안으로 인해 일상생활에서 집중력 저하, 예민함, 가슴 두근거림 등의 신체 증상이 동반될 수 있습니다. 불안 자극에 과도하게 반응하고, 예상하지 못한 상황에도 쉽게 당황하거나 회피하려는 경향이 나타납니다. 

이러한 불안이 반복되면 스트레스에 더욱 취약해지고 회피 행동이 강화될 수 있으므로 적절한 관리가 필요합니다.`,
                categories: {
                    '전문가 상담 고려하기': [
                        '불안 관련 인지행동치료(CBT) 시행 고려',
                        '상담 치료를 통해 불안 사고를 인식하고 조절하기'
                    ],
                    '일상 루틴 관리': [
                        '불안 유발 상황을 일지에 기록하고, 대응 전략 준비하기',
                        '예측 가능한 일상 패턴 형성하여 안정감 주기'
                    ],
                    '신체 이완 활동': [
                        '복식 호흡, 명상, 스트레칭 등 규칙적으로 실천하기',
                        '자연과 가까운 공간에서 걷기 및 이완 활동 수행'
                    ],
                    '감정 표현 연습': [
                        '감정 상태를 기록하거나 미술/음악 활동으로 표현하기',
                        '감정 표현에 대한 부정적 인식 완화하기'
                    ]
                }
            },
            {
                range: [15, 60],
                title: '고위험 수준의 불안장애',
                description: `심각한 불안 증상이 지속적으로 나타나며, 이는 개인의 일상생활, 대인관계, 직무 수행 등 전반적인 기능에 큰 지장을 초래할 수 있습니다. 강한 불안감, 갑작스러운 공황 발작, 특정 상황 또는 장소에 대한 과도한 회피 행동, 신체적 긴장감(가슴 두근거림, 근육 긴장, 소화 장애 등)이 동반되며, 이는 자율신경계 이상 반응으로도 이어질 수 있습니다. 이 단계에서는 스스로 증상을 조절하거나 완화하기 어렵기 때문에 전문 정신건강 서비스의 즉각적인介入이 필요합니다.`,
                categories: {
                    '즉각적 상담 및 치료 필요': [
                        '정신건강의학과 전문의 내원 또는 정신건강복지센터 방문 권고',
                        '인지행동치료(CBT)와 약물치료(항불안제, SSRI 등) 병행 고려',
                        '정신건강상담 및 위기개입 서비스 연계',
                        '일상 기능 유지를 위한 가족 또는 보호자의 적극적인 협조 필요'
                    ]
                }
            }
        ],
        '스트레스': [
            {
                range: [0, 4],
                title: '정상 수준의 스트레스',
                description: `스트레스에 잘 대처하고 있으며 정서적 회복력이 양호한 상태입니다.`,
                categories: {
                    '유지 방안': [
                        '충분한 휴식과 긍정적인 피드백 자주 사용하기'
                    ]
                }
            },
            {
                range: [5, 9],
                title: '경미한 스트레스 상태',
                description: `가벼운 스트레스 반응이 있으며 주의 깊은 감정 관찰이 필요합니다. 스트레스 요인을 분석하고 일상생활 패턴을 조정할 수 있습니다.`,
                categories: {
                    '생활 패턴 조정': [
                        '잠, 식사, 운동의 규칙적인 루틴 만들기'
                    ]
                }
            },
            {
                range: [10, 14],
                title: '중등도 수준의 스트레스 상태',
                description: `지속적인 스트레스로 인해 피로, 두통, 수면 문제, 짜증 등의 증상이 나타날 수 있습니다. 일상에서의 효율성과 만족도가 낮아지고, 작은 일에도 쉽게 반응하거나 감정 기복이 커질 수 있습니다.

스트레스가 누적되기 전, 본인의 스트레스 신호를 인식하고 이를 완화할 수 있는 방법을 실천하는 것이 중요합니다.`,
                categories: {
                    '전문가 상담 고려하기': [
                        '상담사를 통해 스트레스 반응에 대한 이해를 높이기',
                        '스트레스 평가 후 필요 시 전문 개입 연계'
                    ],
                    '생활 리듬 조정': [
                        '수면, 식사, 휴식 시간 일정하게 유지하기',
                        '일과 중 중간 휴식시간 확보하여 긴장 해소하기'
                    ],
                    '신체 활동 및 취미': [
                        '가벼운 유산소 운동 또는 몸을 움직이는 취미 찾기',
                        '몰입 가능한 활동을 통해 스트레스 발산하기'
                    ],
                    '감정 조절 전략': [
                        '호흡 조절, 자기 위로 대화 등 실천',
                        '감정을 일지에 기록하며 객관적으로 바라보기'
                    ]
                }
            },
            {
                range: [15, 60],
                title: '심각한 스트레스 상태',
                description: `지속적이고 높은 수준의 스트레스로 인해 심리적 소진(burnout), 신체적 증상(만성 피로, 두통, 소화장애, 심계항진 등), 수면 장애, 집중력 저하, 짜증과 분노의 빈도 증가 등이 복합적으로 나타나는 단계입니다. 스트레스와 관련된 정신 질환(우울증, 불안장애 등)으로 발전할 가능성이 매우 높으며, 고혈압, 심장질환, 면역 저하 등의 신체 질환과도 밀접한 연관이 있습니다. 반드시 전문적인 진단과 치료 개입이 필요한 시기입니다.`,
                categories: {
                    '의학적 및 정신건강적 개입 필요': [
                        '내과·정신건강의학과 진료 후 정밀 평가 권장',
                        '심리 상담 및 스트레스 관리 프로그램 참여',
                        '약물 치료(수면제, 항우울제 등) 필요 시 전문의와의 상의 후 시작',
                        '업무·일상생활에서의 휴식 또는 환경 조정 필요',
                        '스트레스 관련 건강검진(호르몬, 심혈관 기능 등) 병행 고려'
                    ]
                }
            }
        ]
    };

    const matched = results[testType]?.find(({ range }) => score >= range[0] && score <= range[1]);
    return matched || { title: '알 수 없음', description: '', categories: {} };
};

