import { Routes, Route, Navigate } from "react-router-dom";

// CSS
import "./css/App.css";
import "./css/chat.css";
import "./css/feature.css";
import "./css/header.css";
import "./css/hero.css";
import "./css/login.css";
import "./css/map.css";
import "./css/small_translate.css";
import "./css/FloatingChatButton.css";
import "./css/selfTest.css";
import "./css/result.css";
import "./css/HospitalRegionPage.css";
import "./css/dashboard.css";
import "./css/theme.css";

// Pages & Layout
import Map from "./components/Map";
import Picture from "./components/Picture";
import SelfTest from "./components/SelfTest";
import AboutSection from "./components/about/AboutSection/AboutSectionMain";
import { BoardSection } from "./components/board/BoardSectionmain";
import AuthSection from "./components/authSection/AuthSection/index";
import FloatingSidebar from "./components/FloatingSidebar";
import Faq from "./components/Faq";
import HospitalRegionPage from "./components/HospitalRegionPage";
import EmotionAnalysisPage from "./components/EmotionAnalysisPage";
import ResourceLibrary from "./components/ResourceLibrary";
import AdminPage from "./components/admin/AdminPage";
import KakaoWaitPage from "./components/KakaoWaitPage";
import UserProfile from "./components/chat-modal/components/UserProfile";
import HelpPage from "./components/HelpPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import AuthLoadingPage from "./components/auth/AuthLoadingPage";
import ChatConsult from "./components/dashboard/ChatConsult";

// Route Guards
import PrivateRoute from "./components/route-guards/PrivateRoute";
import AdminRoute from "./components/route-guards/AdminRoute";

// 전역 UI 셸 제어를 위해 간단 토글만 유지
import { useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

const App = () => {
    const location = useLocation();

    // 헤더/플로팅/FAQ/지도 표시 제어만 남김
    const [mapVisible, setMapVisible] = useState(false);
    const [faqVisible, setFaqVisible] = useState(false);
    const [scrollTarget, setScrollTarget] = useState(null);
    const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);

    // 인증/관리자 페이지 또는 대시보드에서 셸 감춤
    const isAuthPageOrAdmin = useMemo(
        () =>
            ["/login", "/signup", "/find-id", "/find-password", "/admin"].includes(
                location.pathname
            ),
        [location.pathname]
    );
    const isDashboard = location.pathname === "/";
    const hideShell = isAuthPageOrAdmin || isDashboard;

    return (
        <>
            {!hideShell && (
                <>
                    <FloatingSidebar scrollTargetSelector=".dash-content" />
                </>
            )}
            {faqVisible && !hideShell && <Faq />}
            {mapVisible && !hideShell && (
                <div
                    style={{
                        position: "fixed",
                        top: "150px",
                        right: "150px",
                        zIndex: 1000,
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        borderRadius: "12px",
                        padding: "10px",
                    }}
                >
                    <h2 style={{ textAlign: "center" }}>내 주변 병원 지도</h2>
                    <Map />
                </div>
            )}

            <Routes>
                {/* 보호된 레이아웃 + 하위 라우트 */}
                <Route element={<PrivateRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<ChatConsult />} />
                        <Route path="/emotion" element={<EmotionAnalysisPage mode="page" />} />
                        <Route path="/img" element={<Picture />} />
                        <Route path="/board" element={<BoardSection />} />
                        <Route path="/hospital-region" element={<HospitalRegionPage />} />
                        <Route path="/library" element={<ResourceLibrary />} />
                        <Route path="/map" element={<Map />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route
                            path="/contact"
                            element={<div style={{ padding: 16 }}><h1>문의하기</h1></div>}
                        />
                    </Route>
                </Route>

                {/* 관리자 전용 */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>

                {/* 인증/공용 라우트 */}
                <Route path="/login" element={<AuthSection type="login" />} />
                <Route path="/logout" element={<AuthSection type="logout" />} />
                <Route path="/signup" element={<AuthSection type="signup" />} />
                <Route path="/find-id" element={<AuthSection type="find-id" />} />
                <Route path="/find-password" element={<AuthSection type="find-password" />} />
                <Route path="/login/wait" element={<KakaoWaitPage />} />
                <Route path="/auth/loading" element={<AuthLoadingPage />} />

                {/* 레거시/기타 */}
                <Route
                    path="/legacy-home"
                    element={
                        <AboutSection
                            refs={{}} // 필요시 ref 전달
                            scrollTarget={scrollTarget}
                            setScrollTarget={setScrollTarget}
                            setIsEmotionModalOpen={setIsEmotionModalOpen}
                        />
                    }
                />
                <Route
                    path="/self"
                    element={
                        <SelfTest
                            testType={"우울증"}
                            setTestType={() => {}}
                            selfAnswers={Array(20).fill("")}
                            handleSelfAnswer={() => {}}
                            handleSelfSubmit={() => {}}
                            resultText={""}
                            setSelfAnswers={() => {}}
                            setResultText={() => {}}
                        />
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default App;
