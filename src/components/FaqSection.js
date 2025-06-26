import React from 'react';

const faqList = [
  { q: 'Q. AI 상담이 실제 사람처럼 이야기하나요?', a: 'A. Mind Bridge는 자연어 이해와 공감 대화를 기반으로 상담 서비스를 제공드리기 위해 노력하고 있습니다' },
  { q: 'Q. 개인 정보는 안전한가요?', a: 'A. 철저한 암호화와 보안 시스템으로 보호되고 있습니다' },
  { q: 'Q. 이용 요금이 있나요?', a: 'A. 기본 상담은 무료로 진행되며 추후 업데이트를 통해 기능이 추가되면 유료 버전이 생길수도 있습니다' }
];

const FaqSection = () => {
  return (
    <section className="form-section">
      <h2>자주 묻는 질문</h2>
      {faqList.map((item, i) => (
        <p key={i}><strong>{item.q}</strong><br />{item.a}</p>
      ))}
    </section>
  );
};

export default FaqSection;
