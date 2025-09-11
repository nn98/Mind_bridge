// src/components/layout/RedirectLayout.jsx
import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import "../../css/RedirectLayout.css";

export default function RedirectLayout({message = "감정 분석 페이지는 로그인 후 이용 가능합니다.", target = "/chat"}) {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(target);
        }, 3000); // 2초 후 이동

        return () => clearTimeout(timer);
    }, [navigate, target]);

    return (
        <div className="redirect-layout">
            <div className="redirect-card">
                <h2 className="redirect-title">잠시만 기다려 주세요…</h2>
                <p className="redirect-message">{message}</p>
                <p className="redirect-sub">3초 후 상담 페이지로 이동합니다.</p>
                <div className="redirect-spinner" aria-hidden="true"></div>
            </div>
        </div>
    );
}
