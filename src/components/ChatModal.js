import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import axios from 'axios';


const BACKEND_URL = 'http://121.78.183.18:8080';
const MENTAL_STATES = ['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'];




const SessionHistory = ({ userId, getToken }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // 실제 상담 이력을 가져오는 API 여기에서 호출 부탁드립니다
    const fetchHistory = async () => {
    };

    setTimeout(() => {
      setHistory([
        { id: 1, date: '2025-07-25', summary: '첫 상담: 현재 느끼는 불안감에 대해 이야기함.' },
        { id: 2, date: '2025-07-18', summary: '대인관계 스트레스 관련 상담 진행.' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [userId, getToken]);

  if (isLoading) {
    return <p>상담 이력을 불러오는 중...</p>;
  }

  return (
    <div className="session-history">
      <h4>상담 이력</h4>
      {history.length > 0 ? (
        <ul>
          {history.map(item => (
            <li key={item.id}>
              <span className="history-date">{item.date}</span>
              <p className="history-summary">{item.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>진행된 상담 내역이 없습니다.</p>
      )}
    </div>
  );
};

const UserProfile = ({ customUser, isCustomLoggedIn }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { signOut, openUserProfile } = useClerk();

  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '', mentalState: '', nickname: '', counselingGoal: '' });
  const [editedInfo, setEditedInfo] = useState({ ...userInfo });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userId = isSignedIn ? user?.id : customUser?.id; //안전하게 정보를 받기 위한 userId

  console.log('UserProfile userId:', userId);

  useEffect(() => {
    if (isLoaded && (isSignedIn || isCustomLoggedIn)) {
      const fetchUserData = async () => {
        setIsLoading(true);
        console.log("isCustomLoggedIn:", isCustomLoggedIn);
        console.log("customUser:", customUser);
        try {
          let token;

          if (isSignedIn) {
            // Clerk 로그인 상태면 Clerk 토큰 사용
            token = await getToken();
          } else if (isCustomLoggedIn) {
            // 커스텀 로그인 상태면 로컬스토리지 토큰 사용
            token = localStorage.getItem("token");
          } else {
            // 로그인 안 된 상태면 토큰 없음
            setIsLoading(false);
            return;
          }
          //console.log('userId:', userId);

          if (!userId) {
            setIsLoading(false);
            return;
          }

          const response = await axios.get(`${BACKEND_URL}/api/users/details/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("백엔드 사용자 데이터:", response.data);
          console.log("isCustomLoggedIn", isCustomLoggedIn);

          const dbUser = response.data;

          const fullUserInfo = {
            name: dbUser.username
              || (isSignedIn
                ? user?.fullName || user?.firstName
                : customUser?.fullName || customUser?.nickname || customUser?.email?.split("@")[0])
              || "사용자",

            nickname: dbUser.nickname
              || (isCustomLoggedIn ? customUser?.nickname : '')
              || '',

            email: dbUser.email
              || (isSignedIn ? user?.emailAddresses?.[0]?.emailAddress : customUser?.email)
              || '',

            phone: dbUser.phoneNumber
              || (isCustomLoggedIn ? customUser?.phoneNumber || '연락처 미등록' : '정보 없음'),

            mentalState: dbUser.mentalState
              || (isCustomLoggedIn ? customUser?.mentalState || '선택되지 않음' : ''),

            counselingGoal: dbUser.counselingGoal
              || (isCustomLoggedIn ? customUser?.counselingGoal || '' : ''),
          };


          setUserInfo(fullUserInfo);
          setEditedInfo(fullUserInfo);

        } catch (error) {

          console.error("백엔드에서 사용자 정보 조회에 실패했습니다:", error);

          const fallbackInfo = {
            name: isSignedIn
              ? user?.fullName || user?.firstName || '사용자'
              : customUser?.fullName || customUser?.nickname || customUser?.email?.split('@')[0] || '사용자',
            email: isSignedIn
              ? user?.emailAddresses?.[0]?.emailAddress
              : customUser?.email || '',
            phone: isCustomLoggedIn
              ? customUser?.phoneNumber || '연락처 미등록'
              : '정보 없음',
            mentalState: isCustomLoggedIn
              ? customUser?.mentalState || '선택되지 않음'
              : '',
            nickname: isCustomLoggedIn
              ? customUser?.nickname || ''
              : '',
            counselingGoal: isCustomLoggedIn
              ? customUser?.counselingGoal || ''
              : '',
          };

          setUserInfo(fallbackInfo);
          setEditedInfo(fallbackInfo);
        } finally {
          setIsLoading(false);
        }
      };
      if (isLoaded || isCustomLoggedIn) {
        fetchUserData();
      }
    }
  }, [isLoaded, isSignedIn, user, isCustomLoggedIn, getToken, customUser]);


  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setIsEditing(false); setEditedInfo(userInfo); };

  const handleSave = async () => {

    //커스텀부분
    const currentUserId = isSignedIn ? user.id : customUser?.id;
    if (!currentUserId) return;
    let token;
    //clerk부분
    if (isSignedIn) {
      token = await getToken();
    } else if (isCustomLoggedIn) {
      token = localStorage.getItem("token");
    } else {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    try {
      const payload = {
        username: editedInfo.name,
        nickname: editedInfo.nickname,
        phoneNumber: editedInfo.phone,
        mentalState: editedInfo.mentalState,
        counselingGoal: editedInfo.counselingGoal,
      };
      await axios.put(`${BACKEND_URL}/api/users/update/${user.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

      setUserInfo(editedInfo);
      setIsEditing(false);
      alert('회원 정보가 저장되었습니다.');
    } catch (error) {
      console.error("정보 업데이트 실패:", error);
      alert("정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAccount = async () => {


    //커스텀부분
    const currentUserId = isSignedIn ? user.id : customUser?.id;
    if (!currentUserId) return;
    let token;
    //clerk부분
    if (isSignedIn) {
      token = await getToken();
    } else if (isCustomLoggedIn) {
      token = localStorage.getItem("token");
    } else {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    const isConfirmed = window.confirm('정말로 회원 탈퇴를 진행하시겠습니까? 모든 정보가 영구적으로 삭제되며, 복구할 수 없습니다.');
    if (isConfirmed) {
      try {
        await axios.delete(`${BACKEND_URL}/api/users/delete/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('회원 탈퇴가 완료되었습니다.');
        await signOut();
      } catch (error) {
        console.error("회원 탈퇴 처리 중 오류 발생:", error);
        alert("회원 탈퇴 중 오류가 발생했습니다.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <div className="tab-content"><p>로딩 중...</p></div>;
  if (!isSignedIn && !isCustomLoggedIn) return <div className="tab-content"><p>로그인 후 이용해주세요.</p></div>;


  return (
    <div className="tab-content user-profile">
      <div className="profile-section">
        <h3>회원 정보</h3>
        <div className="profile-field"><span>닉네임</span>{isEditing ? <input type="text" name="nickname" value={editedInfo.nickname} placeholder="앱에서 사용할 별칭" onChange={handleChange} /> : <p>{userInfo.nickname || '─'}</p>}</div>
        <div className="profile-field"><span>이메일</span><p style={{ color: '#777' }}>{userInfo.email}</p></div>
        <div className="profile-field"><span>연락처</span>{isEditing ? <input type="text" name="phone" value={editedInfo.phone} onChange={handleChange} /> : <p>{userInfo.phone}</p>}</div>
        <div className="profile-field"><span>나의 상태</span>{isEditing ? <select name="mentalState" value={editedInfo.mentalState} onChange={handleChange}><option value="">선택해주세요</option>{MENTAL_STATES.map(state => (<option key={state} value={state}>{state}</option>))}</select> : <p>{userInfo.mentalState || '선택되지 않음'}</p>}</div>
        <div className="profile-field full-width"><span>상담 목표</span>{isEditing ? <textarea name="counselingGoal" value={editedInfo.counselingGoal} placeholder="상담을 통해 이루고 싶은 목표를 작성해주세요." onChange={handleChange} rows="3"></textarea> : <p className="pre-wrap">{userInfo.counselingGoal || '─'}</p>}</div>
        <div className="profile-actions">{isEditing ? (<><button className="chat-button" onClick={handleSave}>저장</button><button className="chat-button cancel" onClick={handleCancel}>취소</button></>) : (<button className="chat-button" onClick={handleEdit}>수정</button>)}</div>
      </div>

      {/* 상담 이력 섹션 */}
      <div className="profile-section">
        <SessionHistory userId={userId} getToken={getToken} />
      </div>

      {/* 계정 관리 섹션 */}
      <div className="profile-section">
        <h4>계정 관리</h4>
        <div className="account-actions">
          <button className="account-button" onClick={() => openUserProfile()}>비밀번호 변경</button>
          <button className="account-button danger" onClick={handleDeleteAccount}>회원 탈퇴</button>
        </div>
      </div>
    </div>
  );
};


const ChatModal = ({ isOpen, setIsOpen, tab, setTab, selectedChat, setSelectedChat, customUser, isCustomLoggedIn }) => {
  const chatHistory = [
    { summary: "최근 상담 요약 1" },
  ];

  const handleRead = () => alert("읽기 기능 호출");
  const handleSendEmail = () => alert("메일 전송 기능 호출");

  const renderContent = () => {
    switch (tab) {
      case 'chat':
        return <Chat />;
      case 'summary':
        return (
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
      case 'profile':
        return <UserProfile customUser={customUser} isCustomLoggedIn={isCustomLoggedIn} />;
      default:
        return null;

    }
  };

  if (!isOpen)
    return (
      <div className="floating-button" onClick={() => setIsOpen(true)}>
        <img src="/img/채팅상담.png" alt="채팅 아이콘" style={{ width: '100px', height: '100px' }} />
      </div>
    );

  return (
    <><button onClick={() => setIsOpen(false)} className="close-btn">✖</button><div>
      <div className="modal-container">
        <div className="modal-tabs">
          <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'active' : ''}>AI 상담</button>
          <button onClick={() => setTab('summary')} className={tab === 'summary' ? 'active' : ''}>요약</button>
          <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'active' : ''}>회원 정보</button>
        </div>
        <div className="modal-body">{renderContent()}</div>
      </div>
    </div></>
  );
};

export default ChatModal;