import { useState } from 'react';
import ChatWidget from '../chat/ChatWidget'; // 경로 확인해서 필요시 수정
import UserProfile from './components/UserProfile';

const ChatModal = ({ isOpen, setIsOpen, tab: outerTab, setTab: setOuterTab, selectedChat, setSelectedChat, customUser, isCustomLoggedIn }) => {
    const [innerTab, setInnerTab] = useState('chat');
    const tab = outerTab ?? innerTab;
    const setTab = setOuterTab ?? setInnerTab;

    const chatHistory = [{ summary: "최근 상담 요약 1" }];
    const handleRead = () => alert("읽기 기능 호출");
    const handleSendEmail = () => alert("메일 전송 기능 호출");

    const renderContent = () => {
        switch (tab) {
            case 'chat':
                return <ChatWidget setIsOpen={setIsOpen} customUser={customUser} />;
            case 'summary':
                return (
                    <div className="tab-content">
                        <h3>AI 상담 기록 메일 요약</h3>
                        <ul style={{ textAlign: 'left' }}>
                            {chatHistory.map((item, idx) => (
                                <li key={idx}>
                                    <label>
                                        <input
                                            type="radio"
                                            name="chatSelect"
                                            value={idx}
                                            checked={selectedChat === idx}
                                            onChange={() => setSelectedChat(idx)}
                                        />
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
