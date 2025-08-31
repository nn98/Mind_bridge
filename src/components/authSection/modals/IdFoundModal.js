import { Button } from "@mui/material";

const IdFoundModal = ({ email, onClose }) => {
    return (
        <div className="modal-backdrop-3">
            <div className="modal-content-3" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn-3">&times;</button>
                <h2>아이디 찾기 결과</h2>
                <p>회원님의 정보와 일치하는 아이디입니다.</p>
                <div className="temp-password-box">{email}</div>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ mt: 2, backgroundColor: "#a18cd1" }}
                >
                    로그인하기
                </Button>
            </div>
        </div>
    );
};

export default IdFoundModal;
