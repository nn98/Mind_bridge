import AuthapiClient from "./AuthapiClient";

export const apiLogin = async (email, password) => {
    const res = await AuthapiClient.post("/api/auth/login", {email, password}, {withCredentials: true});
    return res.data;
};

// 로그아웃
export const apiLogout = async () => {
    const res = await AuthapiClient.post("/api/auth/logout", {}, {withCredentials: true});
    return res.data;
};

// 회원가입
export const apiRegister = async (payload) => {
    const res = await AuthapiClient.post("/api/users/register", payload, {withCredentials: true});
    return res.data;
};

// 닉네임 중복확인
export const apiCheckNickname = async (nickname) => {
    const res = await AuthapiClient.get(`/api/users/availability`, {params: {type: "nickname", value: nickname},});
    return res.data;
};

// 이메일 중복 체크
export const apiCheckEmail = async (email) => {
    const res = await AuthapiClient.get(`/api/users/availability`, {params: {type: "email", value: email},});
    return res.data;
};

// 아이디 찾기
export const apiFindId = async (payload) => {
    const res = await AuthapiClient.post("/api/auth/find-id", payload, {withCredentials: true});
    return res.data;
};

export const apiResetPassword = async (payload) => {
    const res = await AuthapiClient.post("/api/auth/reset-password", payload, {withCredentials: true});
    return res.data;
};

// 소셜 로그인(코드 교환)
export const apiSocialLogin = async (provider, code) => {
    const res = await AuthapiClient.post("/api/auth/social-login", {provider, code}, {withCredentials: true});
    return res.data;
};
