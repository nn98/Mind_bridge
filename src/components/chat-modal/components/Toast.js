const Toast = ({message, show, type = "error"}) => {
    if (!show) return null;

    return (
        <div className={`validation-toast ${type}`}>
            {message}
        </div>
    );
};

export default Toast;