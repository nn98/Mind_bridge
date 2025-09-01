import { useEffect, useState } from 'react';
import axios from 'axios';
import SessionHistory from './SessionHistory';
import { BACKEND_URL, MENTAL_STATES } from '../constants';
import PasswordChangeModal from './PasswordChangeModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../AuthContext';

const UserProfile = () => {
    const { profile, applyProfileUpdate, logoutSuccess } = useAuth();
    const isLoggedIn = !!profile;

    const [userInfo, setUserInfo] = useState({
        fullName: '',
        nickname: '',
        email: '',
        phoneNumber: '',
        gender: '',
        age: '',
        mentalState: '',
        chatGoal: '',         // 추가
    });

    // 프로필 완성 여부 판별용
    const REQUIRED_FIELDS = ["fullName", "nickname", "email", "phoneNumber", "gender", "age", "mentalState", ];
    const isEmpty = (v) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    function findMissingFields(obj, requiredKeys = REQUIRED_FIELDS) {
        return requiredKeys.filter((k) => isEmpty(obj?.[k]));
    }
    const FIELD_LABELS = {
        email: "이메일",
        nickname: "닉네임",
        age: "나이",
        gender: "성별",
        phoneNumber: "전화번호",
        mentalState: "나의 상태",
        fullName: "이름",
    };

    const [editedInfo, setEditedInfo] = useState({ ...userInfo });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const userId = profile?.id;

    const printAxiosError = (error, label = 'AxiosError') => {
        if (!error?.response) {
            console.error(`${label} (no response):`, {
                message: error?.message,
                code: error?.code,
                config: error?.config,
                cause: error?.cause,
            });
            toast.error('서버에 연결하지 못했습니다. (네트워크/CORS 확인)');
            return;
        }
        const { status, statusText, data, config } = error.response;
        console.error(`${label}:`, { status, statusText, data, url: config?.url, method: config?.method });
        const msg =
            data?.message ||
            data?.error ||
            (typeof data === 'string' ? data : '') ||
            `요청 실패 (${status})`;
        toast.error(msg);
    };

    const normalizeUser = (raw, fallback = {}) => {
        const data = raw?.data ?? raw;
        return {
            nickname: data?.nickname ?? fallback.nickname ?? '',
            email: data?.email ?? fallback.email ?? '',
            age: data?.age ?? fallback.age ?? '',
            gender: data?.gender ?? fallback.gender ?? '',
            phoneNumber: data?.phoneNumber ?? fallback.phoneNumber ?? '',
            mentalState: data?.mentalState ?? fallback.mentalState ?? '선택되지 않음',
            chatGoal: data?.chatGoal ?? fallback.chatGoal ?? '',
            fullName: data?.fullName ?? fallback.fullName ?? '',  // 추가
        };
    };

    const normalizeNumber = (v) => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const buildUpdatePayload = (base, edited) => ({
        email: (edited.email ?? base.email ?? '').trim(),
        nickname: (edited.nickname ?? base.nickname ?? '').trim(),
        phoneNumber: (edited.phoneNumber ?? base.phoneNumber ?? '').trim(),
        gender: (edited.gender ?? base.gender ?? '').trim(),
        age: normalizeNumber(edited.age ?? base.age),
        mentalState: (edited.mentalState ?? base.mentalState ?? '').trim(),
        chatGoal: (edited.chatGoal ?? base.chatGoal ?? '').trim(),
        fullName: (edited.fullName ?? base.fullName ?? '').trim(),   // 추가
    });

    useEffect(() => {
        let cancel = false;
        const init = async () => {
            if (!isLoggedIn) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const fallbackFromProfile = {
                email: profile?.email || '',
                nickname: profile?.nickname || '',
                age: profile?.age ?? '',
                gender: profile?.gender || '',
                phoneNumber: profile?.phoneNumber || '',
                mentalState: profile?.mentalState || '선택되지 않음',
                chatGoal: profile?.chatGoal || '',
                fullName: profile?.fullName || '',  // 추가
            };
            try {
                console.log(`cancel: ${cancel}`);
                const normalized = normalizeUser(profile, fallbackFromProfile);
                if (!cancel) {
                    setUserInfo(normalized);
                    setEditedInfo(normalized);

                    // 누락 필드 수집
                    const missing = findMissingFields(normalized);
                    if (missing.length > 0) {
                        // 요약 토스트 1건
                        console.log(`missing: ${missing}`);
                        const list = missing.map((k) => FIELD_LABELS[k] ?? k).join(", ");
                        toast.warn(
                            <div style={{ marginLeft: 10 }}>
                                <div style={{ fontWeight: 600, marginBottom: 0 }}>
                                    원활한 서비스 이용을 위해
                                </div>
                                <div style={{ fontWeight: 600, marginBottom: 5 }}>
                                    회원 정보를 완성해주세요!
                                </div>
                                <div style={{ fontWeight: 1000, color: '#8b5cf6', marginBottom: 10 }}>
                                    {list}
                                </div>
                            </div>, { containerId: "welcome", autoClose: 5000, }
                        );
                        // toast.warn(`${list}`, {
                        //     containerId: "welcome",
                        //     autoClose: 5000,
                        //     closeOnClick: true,
                        // }); // [2][5]

                        // 첫 누락 필드로 포커스 이동(선택)
                        setIsEditing(true);
                        const first = missing;
                        requestAnimationFrame(() => {
                            const el = document.querySelector(`[name="${first}"]`);
                            if (el && typeof el.focus === "function") el.focus();
                        });
                    }
                }
            } catch (e) {
                console.error('프로필 초기화 실패:', e);
                if (!cancel) {
                    setUserInfo(fallbackFromProfile);
                    setEditedInfo(fallbackFromProfile);
                }
            } finally {
                if (!cancel) setIsLoading(false);
            }
        };
        init();
        return () => { cancel = true; };
    }, [isLoggedIn, profile]);

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setIsEditing(false);
        setEditedInfo(userInfo);
    };

    const handleSave = async () => {
        if (!isLoggedIn) {
            toast.error('로그인 상태가 아닙니다.');
            return;
        }
        if (!userInfo.email) {
            toast.error('이메일 정보가 없습니다. 다시 로그인 해주세요.');
            return;
        }
        try {
            const payload = buildUpdatePayload(userInfo, editedInfo);
            await axios.put(`${BACKEND_URL}/api/users/update`, payload, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            setUserInfo((prev) => ({ ...prev, ...editedInfo }));
            applyProfileUpdate(payload);  // 전역 프로필 동기화
            setIsEditing(false);
            toast.success('회원 정보가 저장되었습니다.');
        } catch (error) {
            printAxiosError(error, '정보 업데이트 실패');
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
            logoutSuccess();
            window.location.href = '/login';
        } catch (err) {
            console.error('로그아웃 실패:', err);
            window.location.href = '/login';
        }
    };

    const handleDeleteAccount = () => {
        if (!isLoggedIn) {
            toast.error('로그인 상태가 아닙니다.');
            return;
        }
        if (!userInfo.email) {
            toast.error('이메일 정보가 없습니다. 다시 로그인 해주세요.');
            return;
        }
        const toastId = toast.info(
            <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    정말로 회원 탈퇴를 진행하시겠습니까?
                </div>
                <div style={{ color: '#b00', marginBottom: 10 }}>
                    모든 정보가 영구적으로 삭제되며 복구할 수 없습니다.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={async () => {
                            try {
                                const payload = { email: userInfo.email };
                                await axios.delete(`${BACKEND_URL}/api/users/account`, {
                                    withCredentials: true,
                                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                                });
                                toast.dismiss(toastId);
                                toast.success('회원 탈퇴가 완료되었습니다.');
                                await handleLogout();
                            } catch (error) {
                                printAxiosError(error, '회원 탈퇴 처리 중 오류 발생');
                                toast.dismiss(toastId);
                            }
                        }}
                        style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: 6 }}
                    >
                        탈퇴
                    </button>
                    <button
                        onClick={() => toast.dismiss(toastId)}
                        style={{ background: '#e0e0e0', color: '#000', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: 6 }}
                    >
                        취소
                    </button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, draggable: false, position: 'top-center' }
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedInfo((prev) => {
            if (name === 'age') {
                const onlyDigits = value.replace(/[^\d]/g, '');
                return { ...prev, [name]: onlyDigits };
            }
            return { ...prev, [name]: value };
        });
    };

    const openPasswordModal = () => setIsPasswordModalOpen(true);

    if (isLoading) return <div className="tab-content"><p>로딩 중...</p></div>;
    if (!isLoggedIn) return <div className="tab-content"><p>로그인 후 이용해주세요.</p></div>;

    return (
        <>
            <div className="tab-content user-profile">
                <div className="profile-section">
                    <h3>{profile.role.toUpperCase() === 'ADMIN' ? '관리자' : '회원'} 정보</h3>

                    {/* 성명 */}
                    <div className="profile-field">
                        <span>성명</span>
                        {isEditing ? (
                            <input
                                type="text"
                                name="fullName"
                                value={editedInfo.fullName}
                                placeholder="실명 또는 성명"
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.fullName || '─'}</p>
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
                                placeholder="앱에서 사용할 별칭"
                                onChange={handleChange}
                            />
                        ) : (
                            <p>{userInfo.nickname || '─'}</p>
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
                                placeholder="example@domain.com"
                                onChange={handleChange}
                            />
                        ) : (
                            <p style={{ color: '#777' }}>{userInfo.email}</p>
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
                                placeholder="010-1234-5678"
                                onChange={handleChange}
                            />
                        ) : (
                            <p style={{ color: '#777' }}>{userInfo.phoneNumber || '─'}</p>
                        )}
                    </div>

                    {/* 성별 */}
                    <div className="profile-field">
                        <span>성별</span>
                        {isEditing ? (
                            <select name="gender" value={editedInfo.gender} onChange={handleChange}>
                                <option value="">선택해주세요</option>
                                <option value="MALE">남성</option>
                                <option value="FEMALE">여성</option>
                                <option value="OTHER">기타</option>
                            </select>
                        ) : (
                            <p style={{ color: '#777' }}>{userInfo.gender || '─'}</p>
                        )}
                    </div>

                    {/* 나이 */}
                    <div className="profile-field">
                        <span>나이</span>
                        {isEditing ? (
                            <input
                                type="text"
                                inputMode="numeric"
                                name="age"
                                value={editedInfo.age}
                                placeholder="숫자만 입력"
                                onChange={handleChange}
                            />
                        ) : (
                            <p style={{ color: '#777' }}>{userInfo.age || '─'}</p>
                        )}
                    </div>

                    {/* 나의 상태 */}
                    <div className="profile-field">
                        <span>나의 상태</span>
                        {isEditing ? (
                            <select name="mentalState" value={editedInfo.mentalState} onChange={handleChange}>
                                <option value="">선택해주세요</option>
                                {MENTAL_STATES.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        ) : (
                            <p>{userInfo.mentalState || '선택되지 않음'}</p>
                        )}
                    </div>

                    {/* 상담 목표 */}
                    <div className="profile-field">
                        <span>상담 목표</span>
                        {isEditing ? (
                            <input
                                type="text"
                                name="chatGoal"
                                value={editedInfo.chatGoal}
                                placeholder="상담 목표를 입력하세요"
                                onChange={handleChange}
                            />
                        ) : (
                            <p style={{ color: '#777' }}>{userInfo.chatGoal || '─'}</p>
                        )}
                    </div>

                    {/* 액션 */}
                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button className="chat-button" onClick={handleSave}>저장</button>
                                <button className="chat-button cancel" onClick={handleCancel}>취소</button>
                            </>
                        ) : (
                            <button className="chat-button" onClick={handleEdit}>수정</button>
                        )}
                    </div>
                </div>

                <div className="profile-section">
                    <SessionHistory userId={userId} />
                </div>

                <div className="profile-section">
                    <h4>계정 관리</h4>
                    <div className="account-actions">
                        <button className="account-button" onClick={() => setIsPasswordModalOpen(true)}>비밀번호 변경</button>
                        <button className="account-button danger" onClick={handleDeleteAccount}>회원 탈퇴</button>
                    </div>
                </div>
            </div>

            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onPasswordChange={async (pwd) => {
                    if (!isLoggedIn) {
                        toast.error('로그인 상태가 아닙니다.');
                        return;
                    }
                    if (!userInfo.email) {
                        toast.error('이메일 정보가 없습니다.');
                        return;
                    }
                    try {
                        const payload = { newPassword: pwd };
                        await axios.put(`${BACKEND_URL}/api/users/password`, payload, {
                            withCredentials: true,
                            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        });
                        toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
                        await handleLogout();
                    } catch (error) {
                        printAxiosError(error, '비밀번호 변경 실패');
                    }
                }}
            />
            <ToastContainer position="top-center" closeButton={false} icon={false} />
        </>
    );
};

export default UserProfile;
