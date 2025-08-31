import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { apiLogout } from "../services/authApi";

export function useLogoutEffect({ type, onAfterLogout }) {
    const navigate = useNavigate();
    const logoutExecuted = useRef(false);

    useEffect(() => {
        if (type === "logout" && !logoutExecuted.current) {
            logoutExecuted.current = true;

            apiLogout()
                .then(() => {
                    toast.info("로그아웃 되었습니다!", { containerId: "welcome" });
                })
                .catch(() => { })
                .finally(() => {
                    try {
                        onAfterLogout?.();
                    } catch { }
                    delete axios.defaults.headers.common["Authorization"];
                    setTimeout(() => navigate("/", { replace: true }), 500);
                });
        }
    }, [type, navigate, onAfterLogout]);
}
