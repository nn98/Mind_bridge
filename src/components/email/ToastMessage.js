// src/components/email/ToastMessage.jsx
export default function ToastMessage({ message, show }) {
    return <div className={`toast-message ${show ? 'show' : ''}`}>{message}</div>;
}
