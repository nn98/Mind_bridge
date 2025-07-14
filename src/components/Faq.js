import { useState } from "react";
import "../css/Faq.css";

const faqList = [
    {
        question: "AI 상담 정확성",
        answer: "Mind Bridge는 자연어 이해와 공감 대화를 기반으로 실제 사람처럼 대화를 시도합니다.",
    },
    {
        question: "개인정보 보안",
        answer: "모든 데이터는 철저한 암호화와 보안 시스템으로 보호되고 있습니다.",
    },
    {
        question: "이용 요금",
        answer: "기본 상담은 무료이며, 향후 기능 추가에 따라 유료 옵션이 생길 수 있습니다.",
    },
    {
        question: "AI 상담",
        answer: "페이지 하단 1:1 채팅 상담을 클릭시 상담을 진행 할 수 있습니다",
    },
    {
        question: "로그인",
        answer:
            "로그인은 페이지 상단 우측에 있으며 기존 회원가입이 되어있는 유저는 로그인이 바로 가능합니다. 로그인이 되어 있지 않으시다면 상단 우측 회원가입을 클릭 하셔서 회원가입 먼저 부탁드립니다.",
    },
    {
        question: "회원가입",
        answer:
            "회원가입은 Mind Bridge 자체 회원가입이 존재하며, 구글 아이디를 이용한 소셜 회원가입도 가능합니다.",
    },
    {
        question: "게시판",
        answer:
            "게시판은 회원전용입니다. 글 작성을 원하시면 회원가입 먼저 부탁드립니다. 감사합니다.",
    },
    {
        question: "지도",
        answer:
            "지도는 페이지 우측 사이드에 있으며 클릭시 유저 근처 병원 목록과 병원 클릭시 현 위치부터 병원까지 거리가 표시 됩니다.",
    },
    {
        question: "자가진단",
        answer:
            "자가진단은 페이지 상단에 페이지 이동 버튼이 존재하며 로그인 없이 Mind Bridge페이지 방문자는 이용 금액 없이 간단한 자가 진단이 가능합니다.",
    },
];

const Faq = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleQuestion = (index) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="faq-container">
            <h2 className="faq-title">자주 묻는 질문 </h2>

            <div className="faq-buttons">
                {faqList.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => toggleQuestion(idx)}
                        className={`faq-button ${openIndex === idx ? "active" : ""}`}
                    >
                        {item.question}
                    </button>
                ))}
            </div>

            {openIndex !== null && (
                <div className="faq-answer-box">
                    <strong>수달이:</strong> {faqList[openIndex].answer}
                </div>
            )}
        </div>
    );
};

export default Faq;
