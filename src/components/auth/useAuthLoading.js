// src/components/auth/useAuthLoading.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "./getMe";
import { delay } from "./delay";

export function useAuthLoading({ setCustomUser, setIsCustomLoggedIn, waitMs = 1500 }) {
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                await delay(waitMs);

                const me = await getMe();
                if (!mounted) return;

                setCustomUser?.(me);
                setIsCustomLoggedIn?.(true);
                localStorage.setItem("customUser", JSON.stringify(me));

                navigate("/", { replace: true });
            } catch (e) {
                if (!mounted) return;

                setCustomUser?.(null);
                setIsCustomLoggedIn?.(false);
                localStorage.removeItem("customUser");

                navigate("/login", { replace: true });
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [navigate, setCustomUser, setIsCustomLoggedIn, waitMs]);
}
