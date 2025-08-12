import { useState } from 'react';
import ChatWidget from '../chat/ChatWidget';
import UserProfile from './components/UserProfile';

const ChatModal = ({ isOpen, setIsOpen, tab: outerTab, setTab: setOuterTab, customUser, isCustomLoggedIn, }) => {

    const [innerTab, setInnerTab] = useState('chat');
    const tab = outerTab ?? innerTab;
    const setTab = setOuterTab ?? setInnerTab;

    const renderContent = () => {
        switch (tab) {
            case 'chat':
                return <ChatWidget setIsOpen={setIsOpen} customUser={customUser} />;
            case 'profile':
                return <UserProfile customUser={customUser} isCustomLoggedIn={isCustomLoggedIn} />;
            default:
                return null;
        }
    };

    if (!isOpen) {
        return (
            <div className="floating-button" onClick={() => setIsOpen(true)}>
                <img
                    src="/img/채팅상담.png"
                    alt="채팅 아이콘"
                    style={{ width: '100px', height: '100px' }}
                />
            </div>
        );
    }

    return (
        <>
            <button onClick={() => setIsOpen(false)} className="close-btn">✖</button>
            <div className="modal-container">
                <div className="modal-tabs">
                    <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'active' : ''}>AI 상담</button>
                    <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'active' : ''}>회원 정보</button>
                </div>
                <div className="modal-body">{renderContent()}</div>
            </div>
        </>
    );
};

export default ChatModal;
