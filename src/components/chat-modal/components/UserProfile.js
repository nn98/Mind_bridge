// src/components/UserProfile.jsx
import {useEffect, useState} from "react";
import axios from "axios";
import SessionHistory from "./SessionHistory";
import {BACKEND_URL, MENTAL_STATES} from "../constants";
import PasswordChangeModal from "./PasswordChangeModal";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useAuth} from "../../../AuthContext";

// ✅ 추가: Redirect 안내 페이지
import RedirectLayout from "../../layout/RedirectLayout";

const UserProfile = () => {
    const {profile, applyProfileUpdate, logoutSuccess} = useAuth();
    const isLoggedIn = !!profile;

    const [userInfo, setUserInfo] = useState({
        fullName: "",
        nickname: "",
        email: "",
        phoneNumber: "",
        gender: "",
        age: "",
        mentalState: "",
        chatGoal: "",
    });

    const [editedInfo, setEditedInfo] = useState({...userInfo});
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const userId = profile?.id;

    const normalizeUser = (raw, fallback = {}) => {
        const data = raw?.data ?? raw;
        return {
            nickname: data?.nickname ?? fallback.nickname ?? "",
            email: data?.email ?? fallback.email ?? "",
            age: data?.age ?? fallback.age ?? "",
            gender: data?.gender ?? fallback.gender ?? "",
            phoneNumber: data?.phoneNumber ?? fallback.phoneNumber ?? "",
            mentalState: data?.mentalState ?? fallback.mentalState ?? "선택되지 않음",
            chatGoal: data?.chatGoal ?? fallback.chatGoal ?? "",
            fullName: data?.fullName ?? fallback.fullName ?? "",
        };
    };

    useEffect(() => {
        if (!isLoggedIn) {
            setIsLoading(false);
            return;
        }
        const normalized = normalizeUser(profile, {});
        setUserInfo(normalized);
        setEditedInfo(normalized);
        setIsLoading(false);
    }, [isLoggedIn, profile]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setEditedInfo((prev) => ({...prev, [name]: value}));
    };

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setIsEditing(false);
        setEditedInfo(userInfo);
    };

    const handleSave = async () => {
        try {
            const payload = {...editedInfo};
            await axios.patch(`${BACKEND_URL}/api/users/account`, payload, {
                withCredentials: true,
                headers: {"Content-Type": "application/json"},
            });
            setUserInfo(payload);
            applyProfileUpdate(payload);
            setIsEditing(false);
            toast.success("회원 정보가 저장되었습니다.");
        } catch (err) {
            toast.error("저장 실패");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {withCredentials: true});
            logoutSuccess();
            window.location.href = "/";
        } catch (err) {
            window.location.href = "/login";
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${BACKEND_URL}/api/users/account`, {withCredentials: true});
            logoutSuccess();
            toast.success("회원 탈퇴가 완료되었습니다.");
            window.location.href = "/";
        } catch (err) {
            toast.error("회원 탈퇴 실패");
        }
    };

    // ✅ 로딩 처리
    if (isLoading) return <div>로딩 중...</div>;

    // ✅ 로그인 안 된 경우: Redirect 안내 페이지 보여주고 2초 뒤 "/" 로 이동
    if (!isLoggedIn) {
        return (
            <RedirectLayout
                message="회원 프로필은 로그인 후 이용 가능합니다."
                target="/"
            />
        );
    }

    return (
        <>
            <div className="user-profile">
                {/* ===== 상단 프로필 카드 ===== */}
                <div className="profile-card">
                    <div className="avatar">👤</div>
                    <div className="info">
                        <div className="name-row">
                            <h2>{userInfo.fullName || "이름 없음"}</h2>
                            <button className="edit-btn" onClick={handleEdit}>
                                ✏ 수정
                            </button>
                        </div>

                        <p>{userInfo.email}</p>
                        <div className="status-badge">
                            <select defaultValue="online">
                                <option value="online">활동중 🟢</option>
                                <option value="away">자리비움 🟡</option>
                                <option value="hidden">숨김 ⚪</option>
                            </select>
                        </div>
                        <span className="badge">
                            {userInfo.age ? `${userInfo.age}세` : "나이 미입력"}
                        </span>
                    </div>
                </div>

                {/* ===== 기본 정보 ===== */}
                <div className="profile-section">
                    <h3>기본 정보</h3>

                    {/* 성명 */}
                    <div className="profile-field">
                        <span>성명</span>
                        {isEditing ? (
                            <input
                                type="text"
                                name="fullName"
                                value={editedInfo.fullName}
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.fullName || "─"}</p>
                        )}
                    </div>

                    {/* 닉네임 */}
                    <div className="profile-field">
                        <span>닉네임</span>
                        {isEditing ? (
                            <input
                                type="text"
                                name="nickname"
                                value={editedInfo.nickname}
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.nickname || "─"}</p>
                        )}
                    </div>

                    {/* 이메일 */}
                    <div className="profile-field">
                        <span>이메일</span>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={editedInfo.email}
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.email}</p>
                        )}
                    </div>

                    {/* 전화번호 */}
                    <div className="profile-field">
                        <span>전화번호</span>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={editedInfo.phoneNumber}
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.phoneNumber || "─"}</p>
                        )}
                    </div>

                    {/* 성별 */}
                    <div className="profile-field">
                        <span>성별</span>
                        {isEditing ? (
                            <select name="gender" value={editedInfo.gender} onChange={handleChange}>
                                <option value="">선택</option>
                                <option value="남성">남성</option>
                                <option value="여성">여성</option>
                                <option value="기타">기타</option>
                            </select>
                        ) : (
                            <p>{userInfo.gender || "─"}</p>
                        )}
                    </div>

                    {/* 나이 */}
                    <div className="profile-field">
                        <span>나이</span>
                        {isEditing ? (
                            <input
                                type="number"
                                name="age"
                                value={editedInfo.age}
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.age || "─"}</p>
                        )}
                    </div>

                    {/* 나의 상태 */}
                    <div className="profile-field">
                        <span>나의 상태</span>
                        {isEditing ? (
                            <select
                                name="mentalState"
                                value={editedInfo.mentalState}
                                onChange={handleChange}
                            >
                                {MENTAL_STATES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p>{userInfo.mentalState}</p>
                        )}
                    </div>

                    {isEditing && (
                        <div className="profile-actions">
                            <button className="chat-button save" onClick={handleSave}>
                                저장
                            </button>
                            <button className="chat-button cancel" onClick={handleCancel}>
                                취소
                            </button>
                        </div>
                    )}
                </div>

                {/* ===== 상담 이력 ===== */}
                <div className="profile-section">
                    <SessionHistory userId={userId}/>
                </div>

                {/* ===== 계정 관리 ===== */}
                <div className="account-actions">
                    <button
                        className="account-button"
                        onClick={() => setIsPasswordModalOpen(true)}
                    >
                        비밀번호 변경
                    </button>
                    <button className="account-button danger" onClick={handleDeleteAccount}>
                        회원 탈퇴
                    </button>
                </div>
            </div>

            {/* 비밀번호 변경 모달 */}
            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onLogout={handleLogout}
            />

            <ToastContainer position="top-center"/>
        </>
    );
};

export default UserProfile;
