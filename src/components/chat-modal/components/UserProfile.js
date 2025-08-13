import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SessionHistory from './SessionHistory';
import { BACKEND_URL, MENTAL_STATES } from '../constants';
import PasswordChangeModal from './PasswordChangeModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserProfile = ({ customUser, isCustomLoggedIn }) => {
    const [userInfo, setUserInfo] = useState({
        age: '', gender: '', email: '', phoneNumber: '',
        mentalState: '', nickname: '', counselingGoal: ''
    });
    const [editedInfo, setEditedInfo] = useState({ ...userInfo });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const userId = customUser?.id;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isCustomLoggedIn) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!userId || !token) { setIsLoading(false); return; }

                const response = await axios.get(`${BACKEND_URL}/api/users/details/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const dbUser = response.data;

                const fullUserInfo = {
                    nickname: dbUser.nickname || customUser?.nickname || '',
                    email: dbUser.email || customUser?.email || '',
                    age: dbUser.age || '',
                    gender: dbUser.gender || '',
                    phoneNumber: dbUser.phoneNumber || '',
                    mentalState: dbUser.mentalState || customUser?.mentalState || '선택되지 않음',
                    counselingGoal: dbUser.counselingGoal || customUser?.counselingGoal || '',
                };
                setUserInfo(fullUserInfo);
                setEditedInfo(fullUserInfo);
            } catch (error) {
                console.error("백엔드에서 사용자 정보 조회에 실패했습니다:", error);
                const fallbackInfo = {
                    email: customUser?.email || '',
                    nickname: customUser?.nickname || '',
                    age: customUser?.age || '',
                    gender: customUser?.gender || '',
                    phoneNumber: customUser?.phoneNumber || '',
                    mentalState: customUser?.mentalState || '선택되지 않음',
                    counselingGoal: customUser?.counselingGoal || '',
                };
                setUserInfo(fallbackInfo);
                setEditedInfo(fallbackInfo);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [isCustomLoggedIn, customUser, userId]);

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => { setIsEditing(false); setEditedInfo(userInfo); };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) { toast.error("로그인 상태가 아닙니다."); return; }
        if (!userInfo.email) { toast.error("이메일 정보가 없습니다. 다시 로그인 해주세요."); return; }
        try {
            const payload = {
                email: userInfo.email,
                nickname: editedInfo.nickname,
                mentalState: editedInfo.mentalState,
                counselingGoal: editedInfo.counselingGoal
            };
            await axios.put(`${BACKEND_URL}/api/users/update`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserInfo(editedInfo);
            setIsEditing(false);
            toast.success('회원 정보가 저장되었습니다.');
        } catch (error) {
            console.error("정보 업데이트 실패:", error);
            toast.error("정보 저장 중 오류가 발생했습니다.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handleDeleteAccount = () => {
        const token = localStorage.getItem("token");
        if (!token) { toast.error("로그인 상태가 아닙니다."); return; }
        if (!userInfo.email) { toast.error("이메일 정보가 없습니다. 다시 로그인 해주세요."); return; }

        const toastId = toast.info(
            <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    정말로 회원 탈퇴를 진행하시겠습니까?
                </div>
                <div style={{ color: '#b00', marginBottom: 10 }}>
                    모든 정보가 영구적으로 삭제되며 복구할 수 없습니다.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={async () => {
                            try {
                                const payload = { email: userInfo.email };
                                await axios.post(`${BACKEND_URL}/api/users/delete`, payload, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                toast.dismiss(toastId);
                                toast.success('회원 탈퇴가 완료되었습니다.');
                                handleLogout();
                            } catch (error) {
                                console.error("회원 탈퇴 처리 중 오류 발생:", error);
                                toast.dismiss(toastId);
                                toast.error("회원 탈퇴 중 오류가 발생했습니다.");
                            }
                        }}
                        style={{
                            background: "#d9534f",
                            color: "#fff",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderRadius: 6
                        }}
                    >
                        탈퇴
                    </button>
                    <button
                        onClick={() => toast.dismiss(toastId)}
                        style={{
                            background: "#e0e0e0",
                            color: "#000",
                            border: "none",
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderRadius: 6
                        }}
                    >
                        취소
                    </button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, draggable: false, position: "top-center" }
        );
    };

    const handlePassChange = async (password) => {
        const token = localStorage.getItem("token");
        if (!token) { toast.error("로그인 상태가 아닙니다."); return; }
        if (!userInfo.email) { toast.error("이메일 정보가 없습니다."); return; }
        try {
            const payload = { email: userInfo.email, password };
            await axios.put(`${BACKEND_URL}/api/users/change`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
            handleLogout();
        } catch (error) {
            console.error("비밀번호 변경 실패:", error);
            toast.error("비밀번호 변경 중 오류가 발생했습니다.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedInfo((prev) => ({ ...prev, [name]: value }));
    };

    const openPasswordModal = () => setIsPasswordModalOpen(true);

    if (isLoading) return <div className="tab-content"><p>로딩 중...</p></div>;
    if (!isCustomLoggedIn) return <div className="tab-content"><p>로그인 후 이용해주세요.</p></div>;

    return (
        <>
            <div className="tab-content user-profile">
                <div className="profile-section">
                    <h3>회원 정보</h3>
                    <div className="profile-field">
                        <span>닉네임</span>
                        {isEditing ? (
                            <input
                                type="text"
                                name="nickname"
                                value={editedInfo.nickname}
                                placeholder="앱에서 사용할 별칭"
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.nickname || '─'}</p>
                        )}
                    </div>
                    <div className="profile-field"><span>나이</span><p style={{ color: '#777' }}>{userInfo.age || '─'}</p></div>
                    <div className="profile-field"><span>성별</span><p style={{ color: '#777' }}>{userInfo.gender || '─'}</p></div>
                    <div className="profile-field"><span>전화번호</span><p style={{ color: '#777' }}>{userInfo.phoneNumber || '─'}</p></div>
                    <div className="profile-field"><span>이메일</span><p style={{ color: '#777' }}>{userInfo.email}</p></div>
                    <div className="profile-field">
                        <span>나의 상태</span>
                        {isEditing ? (
                            <select name="mentalState" value={editedInfo.mentalState} onChange={handleChange}>
                                <option value="">선택해주세요</option>
                                {MENTAL_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        ) : (
                            <p>{userInfo.mentalState || '선택되지 않음'}</p>
                        )}
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button className="chat-button" onClick={handleSave}>저장</button>
                                <button className="chat-button cancel" onClick={handleCancel}>취소</button>
                            </>
                        ) : (
                            <button className="chat-button" onClick={() => setIsEditing(true)}>수정</button>
                        )}
                    </div>
                </div>

                <div className="profile-section">
                    <SessionHistory userId={userId} />
                </div>

                <div className="profile-section">
                    <h4>계정 관리</h4>
                    <div className="account-actions">
                        <button className="account-button" onClick={openPasswordModal}>비밀번호 변경</button>
                        <button className="account-button danger" onClick={handleDeleteAccount}>회원 탈퇴</button>
                    </div>
                </div>
            </div>

            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onPasswordChange={handlePassChange}
            />

            <ToastContainer position="top-center" closeButton={false} icon={false} />
        </>
    );
};

export default UserProfile;
