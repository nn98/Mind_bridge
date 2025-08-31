// 전역 ToastContainer를 한 번만 마운트
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ensureWelcomeToastMounted() {
    if (typeof window === "undefined") return;
    if (window.__WELCOME_TOAST_MOUNTED__) return;

    window.__WELCOME_TOAST_MOUNTED__ = true;

    const el = document.createElement("div");
    el.id = "welcome-toast-root";
    document.body.appendChild(el);

    const root = createRoot(el);
    root.render(
        <ToastContainer
            containerId="welcome"
            position="top-center"
            autoClose={2000}
            newestOnTop
            limit={3}
            closeOnClick
            pauseOnHover
        />
    );
}
