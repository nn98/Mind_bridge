import { useEffect, useState } from 'react';
import axios from 'axios';
import SessionHistory from './SessionHistory';
import { BACKEND_URL, MENTAL_STATES } from '../constants';
import PasswordChangeModal from './PasswordChangeModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const noop = () => { };
const call = (fn, ...args) => (typeof fn === 'function' ? fn(...args) : undefined);

const UserProfile = ({
    customUser,
    isCustomLoggedIn,
    setCustomUser = noop,           // ✅ 기본 no-op
    setIsCustomLoggedIn = noop,     // ✅ 기본 no-op
}) => {
    const [userInfo, setUserInfo] = useState({
        age: '',
        gender: '',
        email: '',
        phoneNumber: '',
        mentalState: '',
        nickname: '',
        counselingGoal: '',
    });
    const [editedInfo, setEditedInfo] = useState({ ...userInfo });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const userId = customUser?.id;

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
        console.error(`${label}:`, {
            status,
            statusText,
            data,
            url: config?.url,
            method: config?.method,
        });
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
            counselingGoal: data?.counselingGoal ?? fallback.counselingGoal ?? '',
        };
    };

    const buildUpdatePayload = (base, edited) => {
        const normalizeNumber = (v) => {
            if (v === null || v === undefined || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        };
        return {
            email: edited.email || base.email || '',
            nickname: edited.nickname ?? base.nickname ?? '',
            phoneNumber: edited.phoneNumber ?? base.phoneNumber ?? '',
            gender: edited.gender ?? base.gender ?? '',
            age: normalizeNumber(edited.age ?? base.age),
            mentalState: edited.mentalState ?? base.mentalState ?? '',
            counselingGoal: edited.counselingGoal ?? base.counselingGoal ?? '',
        };
    };

    useEffect(() => {
        let cancel = false;
        const controller = new AbortController();

        const fetchUserData = async () => {
            if (!isCustomLoggedIn) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const fallbackFromCustom = {
                email: customUser?.email || '',
                nickname: customUser?.nickname || '',
                age: customUser?.age || '',
                gender: customUser?.gender || '',
                phoneNumber: customUser?.phoneNumber || '',
                mentalState: customUser?.mentalState || '선택되지 않음',
                counselingGoal: customUser?.counselingGoal || '',
            };

            try {
                let resp = null;

                if (userId) {
                    try {
                    } catch (_) { }
                }

                if (!resp) {
                    try {
                    } catch (_) { }
                }

                if (!resp && customUser?.email) {
                    try {
                    } catch (_) { }
                }

                const normalized = resp
                    ? normalizeUser(resp, fallbackFromCustom)
                    : fallbackFromCustom;

                if (!cancel) {
                    setUserInfo(normalized);
                    setEditedInfo(normalized);
                }
            } catch (error) {
                console.error('백엔드에서 사용자 정보 조회 실패:', error);
                if (!cancel) {
                    setUserInfo(fallbackFromCustom);
                    setEditedInfo(fallbackFromCustom);
                }
            } finally {
                if (!cancel) setIsLoading(false);
            }
        };

        fetchUserData();

        return () => {
            cancel = true;
            controller.abort();
        };
    }, [isCustomLoggedIn, customUser, userId]);

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setIsEditing(false);
        setEditedInfo(userInfo);
    };

    const handleSave = async () => {
        if (!isCustomLoggedIn || !customUser) {
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
            setIsEditing(false);
            toast.success('회원 정보가 저장되었습니다.');
        } catch (error) {
            printAxiosError(error, '정보 업데이트 실패');
        }
    };

    const handleLogout = async () => {
        try {
            // 서버에 로그아웃 요청 (쿠키 만료)
            await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });

            // 상태 초기화
            setCustomUser(null);
            setIsCustomLoggedIn(false);

            // 페이지 이동
            window.location.href = '/login';
        } catch (err) {
            console.error('로그아웃 실패:', err);
            // 그래도 강제로 상태 초기화 및 로그인 페이지 이동
            setCustomUser(null);
            setIsCustomLoggedIn(false);
            window.location.href = '/login';
        }
    };

    const handleDeleteAccount = () => {
        if (!isCustomLoggedIn || !customUser) {
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
                                await axios.post(`${BACKEND_URL}/api/users/delete`, payload, {
                                    withCredentials: true,
                                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                                });

                                toast.dismiss(toastId);
                                toast.success('회원 탈퇴가 완료되었습니다.');
                                handleLogout();
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

    const handlePassChange = async (password) => {
        if (!isCustomLoggedIn || !customUser) {
            toast.error('로그인 상태가 아닙니다.');
            return;
        }
        if (!userInfo.email) {
            toast.error('이메일 정보가 없습니다.');
            return;
        }
        try {
            const payload = { email: userInfo.email, password };
            await axios.put(`${BACKEND_URL}/api/users/change`, payload, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });

            toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
            handleLogout();
        } catch (error) {
            printAxiosError(error, '비밀번호 변경 실패');
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

                    <div className="profile-field">
                        <span>나이</span>
                        <p style={{ color: '#777' }}>{userInfo.age || '─'}</p>
                    </div>
                    <div className="profile-field">
                        <span>성별</span>
                        <p style={{ color: '#777' }}>{userInfo.gender || '─'}</p>
                    </div>
                    <div className="profile-field">
                        <span>전화번호</span>
                        <p style={{ color: '#777' }}>{userInfo.phoneNumber || '─'}</p>
                    </div>
                    <div className="profile-field">
                        <span>이메일</span>
                        <p style={{ color: '#777' }}>{userInfo.email}</p>
                    </div>

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
