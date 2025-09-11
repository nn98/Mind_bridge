import React, {useState} from 'react';
import Toast from './Toast';
import axios from "axios";
import {BACKEND_URL} from "../constants";

const PasswordChangeModal = ({isOpen, onClose, onLogout}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [toast, setToast] = useState({show: false, message: ''});

    const showToast = (message) => {
        setToast({show: true, message});
        setTimeout(() => setToast({show: false, message: ''}), 3000);
    };

    const handleSubmit = async () => {
        console.log(`currentPassword: ${currentPassword}`);
        console.log(`password: ${password}`);
        console.log(`confirmPassword: ${confirmPassword}`);

        // ✅ 입력값 검증
        if (!currentPassword || !password || !confirmPassword) {
            showToast('비밀번호를 모두 입력해주세요.');
            return;
        }
        if (password !== confirmPassword) {
            showToast('비밀번호가 일치하지 않습니다.');
            return;
        }
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

        if (password.length < 8 || password.length > 16) {
            showToast('비밀번호는 8~16자 사이로 입력해주세요.');
            return;
        }
        if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasSpecialChar) {
            showToast('비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.');
            return;
        }

        try {
            const payload = {currentPassword, password, confirmPassword};
            await axios.patch(`${BACKEND_URL}/api/users/account/password`, payload, {
                withCredentials: true,
                headers: {'Content-Type': 'application/json', Accept: 'application/json'},
            });

            // ✅ 성공 처리
            showToast("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
            setTimeout(() => {
                onClose();    // 모달 닫기
                onLogout();   // 로그아웃 (세션/토큰 정리 + 로그인 페이지 이동)
            }, 1500);

        } catch (error) {
            console.error('비밀번호 변경 실패', error);
            if (error.response?.status === 401) {
                // ✅ 사실상 변경은 성공했을 가능성 → "변경은 되었으니 재로그인 필요" 안내
                showToast("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
                setTimeout(onLogout, 1000);
            } else {
                showToast("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="pwd-modal-overlay">
            <div className="pwd-change-container">
                <h3>비밀번호 변경</h3>
                <div className="pwd-input-group">
                    <label htmlFor="currentPassword">기존 비밀번호</label>
                    <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호 입력"
                    />
                </div>
                <div className="pwd-input-group">
                    <label htmlFor="password">신규 비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8~16자, 영문 대/소, 숫자, 특수문자 조합"
                    />
                </div>
                <div className="pwd-input-group">
                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="새 비밀번호를 다시 입력하세요"
                    />
                </div>
                <div className="pwd-modal-actions">
                    <button className="modal-action-button" onClick={handleSubmit}>변경</button>
                    <button className="modal-action-button cancel" onClick={onClose}>취소</button>
                </div>
            </div>
            <Toast message={toast.message} show={toast.show}/>
        </div>
    );
};

export default PasswordChangeModal;
