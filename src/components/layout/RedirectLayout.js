// src/components/layout/RedirectLayout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/RedirectLayout.css";

export default function RedirectLayout({
                                           message = "감정 분석 페이지는 로그인 후 이용 가능합니다.",
                                           target = "/chat",
                                           delay = 3000 //  기본 3초 (ms 단위)
                                       }) {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(target);
        }, delay);

        return () => clearTimeout(timer);
    }, [navigate, target, delay]);

    // ✅ 초 단위로 변환
    const seconds = Math.round(delay / 1000);

    // ✅ target에 따라 안내 문구 다르게 표시
    const targetLabel =
        target === "/login"
            ? "로그인 페이지"
            : target === "/"
                ? "상담 페이지"
                : target === "/chat"
                    ? "상담 페이지"
                    : "다음 페이지";

    return (
        <div className="redirect-layout">
            <div className="redirect-card">
                <h2 className="redirect-title">잠시만 기다려 주세요…</h2>
                <p className="redirect-message">{message}</p>
                <p className="redirect-sub">
                    {seconds}초 후 {targetLabel}로 이동합니다.
                </p>
                <div className="redirect-spinner" aria-hidden="true"></div>
            </div>
        </div>
    );
}
