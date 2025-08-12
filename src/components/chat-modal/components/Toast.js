const Toast = ({ message, show }) => {
    if (!show) return null;
    return <div className="validation-toast">{message}</div>;
};

export default Toast;
