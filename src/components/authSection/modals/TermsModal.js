import { Button } from "@mui/material";

const TermsModal = ({ content, onClose, onConfirm }) => {
    return (
        <div className="modal-backdrop-2" onClick={onClose}>
            <div className="modal-content-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn-2">&times;</button>
                <h2>서비스 이용약관</h2>
                <div className="terms-text-content-2">
                    {content.split("\n").map((line, index) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith("제")) {
                            return <h4 key={index} style={{ marginTop: "1.5em" }}>{trimmedLine}</h4>;
                        }
                        return <p key={index}>{line}</p>;
                    })}
                </div>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{ mt: 2, backgroundColor: "#a18cd1" }}
                >
                    확인 및 동의
                </Button>
            </div>
        </div>
    );
};

export default TermsModal;
