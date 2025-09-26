import {useEffect, useState} from "react";
import axios from "axios";
import {BACKEND_URL, MENTAL_STATES} from "../constants";
import PasswordChangeModal from "./PasswordChangeModal";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useAuth} from "../../../AuthContext";

// 추가
import RedirectLayout from "../../layout/RedirectLayout";
import SessionList from "./SessionList";
import SessionDetailModal from "./SessionDetailModal"; // 오른쪽 세션 리스트뷰

const UserProfile = () => {
    const {profile, applyProfileUpdate, logoutSuccess} = useAuth();
    const isLoggedIn = !!profile;

    const GENDER_MAP = {
        male: "남성",
        female: "여성",
        other: "기타",
    };
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

    const [sel, setSel] = useState(null);

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
            const payload = Object.fromEntries(
                Object.entries({...editedInfo}).map(([key, value]) => [
                    key,
                    value === "" ? null : value
                ])
            );
            await axios.patch(`${BACKEND_URL}/api/users/account`, payload, {
                withCredentials: true,
                headers: {"Content-Type": "application/json"},
            });
            setUserInfo(payload);
            applyProfileUpdate(payload);
            setIsEditing(false);
            toast.success("회원 정보가 저장되었습니다.");
        } catch (err) {
            handleSaveError(err);
        }
    };

    // ✅ 에러 처리 전용 함수
    const handleSaveError = (error) => {
        const response = error.response?.data;

        if (!response) {
            toast.error("네트워크 연결을 확인해주세요.");
            return;
        }

        if (response.field && response.detail) {
            const fieldName = getFieldDisplayName(response.field);
            toast.error(`${fieldName}: ${response.detail}`);
            focusErrorField(response.field);
            return;
        }

        if (response.errors) {
            const firstError = Object.entries(response.errors)[0];
            if (firstError) {
                const [field, messages] = firstError;
                const fieldName = getFieldDisplayName(field);
                toast.error(`${fieldName}: ${messages[0]}`);
                focusErrorField(field);
            }
            return;
        }

        toast.error(response.detail || "저장에 실패했습니다.");
    };

    const getFieldDisplayName = (field) => {
        const fieldNames = {
            'nickname': '닉네임',
            'email': '이메일',
            'phoneNumber': '전화번호',
            'age': '나이',
            'gender': '성별',
            'fullName': '이름',
            'mentalState': '정신상태',
            'chatGoal': '채팅 목표',
            'chatStyle': '채팅 스타일'
        };
        return fieldNames[field] || field;
    };

    const focusErrorField = (fieldName) => {
        setTimeout(() => {
            const element = document.querySelector(`[name="${fieldName}"]`);
            if (element) {
                element.focus();
                element.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        }, 100);
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

    const handleDeleteAccount = () => {
        toast(
            ({closeToast}) => (
                <div style={{textAlign: "center"}}>
                    <p style={{marginBottom: "10px", fontSize: "16px", fontWeight: "bold"}}>
                        회원 탈퇴를 하시겠습니까?
                    </p>
                    <p style={{marginBottom: "12px", fontSize: "15px"}}>
                        탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                    </p>
                    <div style={{display: "flex", justifyContent: "center", gap: "8px"}}>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(`${BACKEND_URL}/api/users/account`, {
                                        withCredentials: true,
                                    });
                                    logoutSuccess();

                                    // ✅ 탈퇴 성공 토스트
                                    toast.success("회원 탈퇴가 완료되었습니다.", {
                                        position: "top-center",
                                        autoClose: 2000,
                                        theme: "colored",
                                    });

                                    closeToast(); // confirm toast 닫기

                                    // ✅ 성공 메시지를 2초 보여준 뒤 페이지 이동
                                    setTimeout(() => (window.location.href = "/"), 2000);
                                } catch (err) {
                                    toast.error("회원 탈퇴 실패", {
                                        position: "top-center",
                                        autoClose: 2000,
                                        theme: "colored",
                                    });
                                }
                            }}
                            style={{
                                background: "#d9534f",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            확인
                        </button>
                        <button
                            onClick={closeToast}
                            style={{
                                background: "#ccc",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            ),
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,

                // ✅ 토스트 박스 자체 크기 조정
                style: {
                    width: "346px",
                    maxWidth: "none",
                },
            }
        );
    };

    const openModal = (session, e) => {
        e.stopPropagation();
        setSel(session);
    };

    if (isLoading) return <div>로딩 중...</div>;

    if (!isLoggedIn) {
        return (
            <RedirectLayout
                message="회원 프로필은 로그인 후 이용 가능합니다."
                target="/login"
            />
        );
    }

    return (
        <>
            <div className="user-profile profile-two-col">
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

                    {/* 우측 버튼 */}
                    <div className="profile-actions-top">
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

                {/* ===== 본문 2열: 좌측 정보 / 우측 세션리스트 ===== */}
                <div className="profile-main">
                    <div className="profile-left">
                        <div className="profile-section">
                            <h3>기본 정보</h3>
                            {[
                                ["성명", "fullName"],
                                ["닉네임", "nickname"],
                                ["이메일", "email"],
                                ["전화번호", "phoneNumber"],
                                ["성별", "gender"],
                                ["나이", "age"],
                                ["나의 상태", "mentalState"],
                            ].map(([label, key]) => (
                                <div className="profile-field" key={key}>
                                    <span>{label}</span>
                                    {isEditing ? (
                                        key === "gender" ? (
                                            <select
                                                name="gender"
                                                value={editedInfo.gender}
                                                onChange={handleChange}
                                            >
                                                <option value="">선택</option>
                                                <option value="male">남성</option>
                                                <option value="female">여성</option>
                                                <option value="other">기타</option>
                                            </select>
                                        ) : key === "mentalState" ? (
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
                                            <input
                                                type={key === "age" ? "number" : "text"}
                                                name={key}
                                                value={editedInfo[key]}
                                                onChange={handleChange}
                                                disabled={key === "email"}
                                            />
                                        )
                                    ) : (
                                        <p>
                                            {key === "gender"
                                                ? GENDER_MAP[userInfo.gender] || "─"
                                                : userInfo[key] || "─"}
                                        </p>
                                    )}
                                </div>
                            ))}

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
                    </div>

                    <div className="profile-right">
                        <SessionList openModal={openModal}/>
                    </div>
                </div>
            </div>

            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onLogout={handleLogout}
            />

            <ToastContainer position="top-center"/>

            <SessionDetailModal
                open={!!sel}
                onClose={() => setSel(false)}
                session={sel}
            />
        </>
    );
};

export default UserProfile;
