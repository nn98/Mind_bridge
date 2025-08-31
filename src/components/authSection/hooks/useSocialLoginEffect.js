import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { apiSocialLogin } from "../services/authApi";

export function useSocialLoginEffect({
    applyProfileUpdate,
    setCustomUser,
    setIsCustomLoggedIn,
    fetchProfile,
}) {
    const navigate = useNavigate();

    useEffect(() => {
        const persistAuth = (payload) => {
            const token = payload?.token || payload?.accessToken || null;
            if (token) {
                localStorage.setItem("token", token);
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            } else {
                localStorage.setItem("token", "LOGIN"); // 쿠키 세션 환경
            }
        };

        const processSocialLogin = async (provider, code) => {
            try {
                const response = await apiSocialLogin(provider, code);
                const payload = response.data?.data || response.data || {};
                const user = payload?.user || payload?.profile || {};

                persistAuth(payload);
                applyProfileUpdate?.(user);
                setCustomUser?.(user);
                setIsCustomLoggedIn?.(true);

                toast.success(`${user?.nickname || "사용자"}님 환영합니다!`, {
                    containerId: "welcome",
                });

                fetchProfile?.();
                window.history.replaceState({}, "", "/login");
                navigate("/", { replace: true });
            } catch (err) {
                console.error(`${provider} login error:`, err);
                alert(
                    err.response?.data?.message ||
                    `${provider} 로그인 처리 중 오류가 발생했습니다.`
                );
                navigate("/login", { replace: true });
            }
        };

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const provider = params.get("state");

        if (code && provider) {
            processSocialLogin(provider, code);
        }
    }, [applyProfileUpdate, fetchProfile, navigate, setCustomUser, setIsCustomLoggedIn]);
}
