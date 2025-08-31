import { Button } from "@mui/material";

const TempPasswordModal = ({ password, onClose }) => {
    return (
        <div className="modal-backdrop-3">
            <div className="modal-content-3" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn-3">&times;</button>
                <h2>임시 비밀번호 발급</h2>
                <p>아래의 임시 비밀번호로 로그인 후, 비밀번호를 변경해주세요.</p>
                <div className="temp-password-box">{password}</div>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ mt: 2, backgroundColor: "#a18cd1" }}
                >
                    확인
                </Button>
            </div>
        </div>
    );
};

export default TempPasswordModal;
