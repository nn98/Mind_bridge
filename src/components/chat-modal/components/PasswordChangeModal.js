import React, { useState } from 'react';
import Toast from './Toast';
import axios from "axios";
import {BACKEND_URL} from "../constants";

const PasswordChangeModal = ({ isOpen, onClose, onLogout }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleSubmit = async () => {
        console.log(`currentPassword: ${currentPassword}`);
        console.log(`password: ${password}`);
        console.log(`confirmPassword: ${confirmPassword}`);
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
            const payload = { currentPassword: currentPassword, password: password, confirmPassword: confirmPassword };
            await axios.patch(`${BACKEND_URL}/api/users/account/password`, payload, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            })
            onLogout();
        } catch (error) {
            console.log(error, '비밀번호 변경 실패');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="pwd-modal-overlay">
            <div className="pwd-change-container">
                <h3>비밀번호 변경</h3>
                <div className="pwd-input-group">
                    <label htmlFor="password">기존 비밀번호</label>
                    <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="8~16자, 영문 대/소, 숫자, 특수문자 조합"
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
            <Toast message={toast.message} show={toast.show} />
        </div>
    );
};

export default PasswordChangeModal;
