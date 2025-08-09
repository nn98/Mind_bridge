import { useState, useEffect } from 'react';
import Chat from './Chat';
import axios from 'axios';

const BACKEND_URL = "http://localhost:8080";
const MENTAL_STATES = ['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'];

const Toast = ({ message, show }) => {
  if (!show) return null;
  return <div className="validation-toast">{message}</div>;
};

const PasswordChangeModal = ({ isOpen, onClose, onPasswordChange }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  const handleSubmit = () => {
    if (!password || !confirmPassword) {
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
    onPasswordChange(password);
  };

  if (!isOpen) return null;

  return (
    <div className="pwd-modal-overlay">
      <div className="pwd-change-container">
        <h3>비밀번호 변경</h3>
        <div className="pwd-input-group">
          <label htmlFor="password">새 비밀번호</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8~16자, 영문 대/소, 숫자, 특수문자 조합" />
        </div>
        <div className="pwd-input-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="새 비밀번호를 다시 입력하세요" />
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

const SessionHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        setTimeout(() => {
          setHistory([
            { id: 1, date: '2025-07-25', summary: '첫 상담: 현재 느끼는 불안감에 대해 이야기함.' },
            { id: 2, date: '2025-07-18', summary: '대인관계 스트레스 관련 상담 진행.' },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("상담 이력 조회에 실패했습니다:", error);
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (isLoading) return <p>상담 이력을 불러오는 중...</p>;

  return (
    <div className="session-history">
      <h4>상담 이력</h4>
      {history.length > 0 ? (
        <ul>
          {history.map(item => (
            <li key={item.id}><span className="history-date">{item.date}</span><p className="history-summary">{item.summary}</p></li>
          ))}
        </ul>
      ) : <p>진행된 상담 내역이 없습니다.</p>}
    </div>
  );
};

const UserProfile = ({ customUser, isCustomLoggedIn }) => {
  const [userInfo, setUserInfo] = useState({ age: '', gender: '', email: '', phoneNumber: '', mentalState: '', nickname: '', counselingGoal: '' });
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

        const response = await axios.get(`${BACKEND_URL}/api/users/details/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
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
    if (!token) { alert("로그인 상태가 아닙니다."); return; }
    if (!userInfo.email) { alert("이메일 정보가 없습니다. 다시 로그인 해주세요."); return; }
    try {
      const payload = { email: userInfo.email, nickname: editedInfo.nickname, mentalState: editedInfo.mentalState, counselingGoal: editedInfo.counselingGoal };
      await axios.put(`${BACKEND_URL}/api/users/update`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserInfo(editedInfo);
      setIsEditing(false);
      alert('회원 정보가 저장되었습니다.');
    } catch (error) {
      console.error("정보 업데이트 실패:", error);
      alert("정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 상태가 아닙니다."); return; }
    if (!userInfo.email) { alert("이메일 정보가 없습니다. 다시 로그인 해주세요."); return; }
    const isConfirmed = window.confirm('정말로 회원 탈퇴를 진행하시겠습니까? 모든 정보가 영구적으로 삭제되며, 복구할 수 없습니다.');
    if (isConfirmed) {
      try {
        const payload = { email: userInfo.email };
        await axios.post(`${BACKEND_URL}/api/users/delete`, payload, { headers: { Authorization: `Bearer ${token}` } });
        alert('회원 탈퇴가 완료되었습니다.');
        handleLogout();
      } catch (error) {
        console.error("회원 탈퇴 처리 중 오류 발생:", error);
        alert("회원 탈퇴 중 오류가 발생했습니다.");
      }
    }
  };

  const handlePassChange = async (password) => {
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 상태가 아닙니다."); return; }
    if (!userInfo.email) { alert("이메일 정보가 없습니다."); return; }
    try {
      const payload = { email: userInfo.email, password };
      await axios.put(`${BACKEND_URL}/api/users/change`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
      handleLogout();
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountManagementClick = () => {
    setIsPasswordModalOpen(true);
  };

  if (isLoading) return <div className="tab-content"><p>로딩 중...</p></div>;
  if (!isCustomLoggedIn) return <div className="tab-content"><p>로그인 후 이용해주세요.</p></div>;

  return (
    <>
      <div className="tab-content user-profile">
        <div className="profile-section">
          <h3>회원 정보</h3>
          <div className="profile-field"><span>닉네임</span>{isEditing ? <input type="text" name="nickname" value={editedInfo.nickname} placeholder="앱에서 사용할 별칭" onChange={handleChange} /> : <p>{userInfo.nickname || '─'}</p>}</div>
          <div className="profile-field"><span>나이</span><p style={{ color: '#777' }}>{userInfo.age || '─'}</p></div>
          <div className="profile-field"><span>성별</span><p style={{ color: '#777' }}>{userInfo.gender || '─'}</p></div>
          <div className="profile-field"><span>전화번호</span><p style={{ color: '#777' }}>{userInfo.phoneNumber || '─'}</p></div>
          <div className="profile-field"><span>이메일</span><p style={{ color: '#777' }}>{userInfo.email}</p></div>
          <div className="profile-field"><span>나의 상태</span>{isEditing ? <select name="mentalState" value={editedInfo.mentalState} onChange={handleChange}><option value="">선택해주세요</option>{MENTAL_STATES.map(state => (<option key={state} value={state}>{state}</option>))}</select> : <p>{userInfo.mentalState || '선택되지 않음'}</p>}</div>
          <div className="profile-actions">{isEditing ? (<><button className="chat-button" onClick={handleSave}>저장</button><button className="chat-button cancel" onClick={handleCancel}>취소</button></>) : (<button className="chat-button" onClick={handleEdit}>수정</button>)}</div>
        </div>

        <div className="profile-section">
          <SessionHistory userId={userId} />
        </div>

        <div className="profile-section">
          <h4>계정 관리</h4>
          <div className="account-actions">
            <button className="account-button" onClick={handleAccountManagementClick}>
              비밀번호 변경
            </button>
            <button className="account-button danger" onClick={handleDeleteAccount}>회원 탈퇴</button>
          </div>
        </div>
      </div>
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onPasswordChange={handlePassChange}
      />
    </>
  );
};

const ChatModal = ({ isOpen, setIsOpen, tab, setTab, selectedChat, setSelectedChat, customUser, isCustomLoggedIn }) => {
  const chatHistory = [{ summary: "최근 상담 요약 1" }];
  const handleRead = () => alert("읽기 기능 호출");
  const handleSendEmail = () => alert("메일 전송 기능 호출");

  const renderContent = () => {
    switch (tab) {
      case 'chat': return <Chat setIsOpen={setIsOpen} customUser={customUser} />;
      case 'summary': return (
        <div className="tab-content">
          <h3>AI 상담 기록 메일 요약</h3>
          <ul style={{ textAlign: 'left' }}>
            {chatHistory.map((item, idx) => (
              <li key={idx}>
                <label>
                  <input type="radio" name="chatSelect" value={idx} checked={selectedChat === idx} onChange={() => setSelectedChat(idx)} />
                  {item.summary.length > 30 ? item.summary.slice(0, 30) + '...' : item.summary}
                </label>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <button className="chat-button" onClick={handleRead}>텍스트 읽기</button>
            <button className="chat-button" onClick={handleSendEmail}>메일 전송</button>
          </div>
        </div>
      );
      case 'profile': return <UserProfile customUser={customUser} isCustomLoggedIn={isCustomLoggedIn} />;
      default: return null;
    }
  };

  if (!isOpen) {
    return (
      <div className="floating-button" onClick={() => setIsOpen(true)}>
        <img src="/img/채팅상담.png" alt="채팅 아이콘" style={{ width: '100px', height: '100px' }} />
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setIsOpen(false)} className="close-btn">✖</button>
      <div className="modal-container">
        <div className="modal-tabs">
          <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'active' : ''}>AI 상담</button>
          <button onClick={() => setTab('summary')} className={tab === 'summary' ? 'active' : ''}>요약</button>
          <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'active' : ''}>회원 정보</button>
        </div>
        <div className="modal-body">{renderContent()}</div>
      </div>
    </>
  );
};

export default ChatModal;