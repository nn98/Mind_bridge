import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import {
    Button, TextField, Checkbox, FormControlLabel, RadioGroup, Radio,
    FormControl, FormLabel, Box, Typography, CircularProgress,
    FormHelperText, ToggleButton, ToggleButtonGroup,
} from "@mui/material";

import "../../../css/login.css";
import { toast } from "react-toastify";

// 내부 분리된 것들
import { ensureWelcomeToastMounted } from "../services/welcomeToast";
import { BACKEND_URL } from "../services/env";
import { useKakaoSdk } from "../hooks/useKakaoSdk";
import { useSocialLoginEffect } from "../hooks/useSocialLoginEffect";
import { useLogoutEffect } from "../hooks/useLogoutEffect";
import TermsModal from "../modals/TermsModal";
import TempPasswordModal from "../modals/TempPasswordModal";
import IdFoundModal from "../modals/IdFoundModal";
import termsContent from "../data/termsContent";

import {
    apiLogin, apiRegister, apiCheckEmail, apiFindId, apiResetPassword, apiCheckNickname
} from "../services/authApi";

ensureWelcomeToastMounted();

/** ===== 유틸 ===== */
const formatPhoneNumber = (raw = "") => {
    const digits = String(raw).replace(/\D/g, "");
    if (digits.startsWith("02")) {
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

// 일반 형식 + 흔한 오타 차단(.comm, .con 등)
const emailRegexBase =
    /^[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*@[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*\.[a-zA-Z]{2,}$/;
const isValidEmailStrict = (email) => {
    if (!emailRegexBase.test(email)) return false;
    const lower = email.toLowerCase();
    if (/\.(comm|con)$/.test(lower)) return false;
    if (/@g?mial\.com$/.test(lower)) return false;
    if (/@naver\.(net|con)$/.test(lower)) return false;
    return true;
};

const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const AuthSection = ({ type, setIsCustomLoggedIn, setCustomUser }) => {
    const { applyProfileUpdate, logoutSuccess, fetchProfile } = useAuth();
    const navigate = useNavigate();

    // ---------- state ----------
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
        nickname: "",
        fullName: "",
        phoneNumber: "",
        mentalState: "",
        age: "",
        gender: "", // male | female | other
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const [emailCheck, setEmailCheck] = useState({ isChecking: false, isAvailable: null, message: "" });
    const [nickCheck, setNickCheck] = useState({ isChecking: false, isAvailable: null, message: "" });

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsViewed, setTermsViewed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const [tempPassword, setTempPassword] = useState("");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [foundId, setFoundId] = useState("");
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 파생 상태
    const isPwOk = passwordRegex.test(formData.password);
    const isPwMatch =
        formData.password.length > 0 &&
        formData.passwordConfirm.length > 0 &&
        formData.password === formData.passwordConfirm;

    // SDK/소셜/로그아웃 부수효과
    useKakaoSdk();
    useSocialLoginEffect({ applyProfileUpdate, setCustomUser, setIsCustomLoggedIn, fetchProfile });
    useLogoutEffect({ type, onAfterLogout: () => { try { logoutSuccess?.(); } catch { } } });

    const persistAuth = (payload) => {
        const token = payload?.token || payload?.accessToken || null;
        if (token) {
            localStorage.setItem("token", token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            localStorage.setItem("token", "LOGIN"); // 쿠키 세션 환경
        }
    };

    // ---------- validators ----------
    const validateAll = (next = formData, { strict = false } = {}) => {
        const nextErrors = { ...errors };
        const val = (k) => String(next[k] ?? "").trim();
        const has = (k) => val(k).length > 0;

        // 이메일
        if (strict || has("email")) {
            if (!has("email")) nextErrors.email = "이메일을 입력해주세요.";
            else if (!isValidEmailStrict(val("email"))) nextErrors.email = "올바른 이메일 형식이 아닙니다.";
            else delete nextErrors.email;
        } else delete nextErrors.email;

        // 비밀번호
        if (strict || has("password")) {
            if (!has("password") || !passwordRegex.test(next.password))
                nextErrors.password = "8자 이상, 영문/숫자/특수문자 포함";
            else delete nextErrors.password;
        } else delete nextErrors.password;

        // 비밀번호 확인
        if (strict || has("passwordConfirm")) {
            if (!has("passwordConfirm")) nextErrors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
            else if (next.password !== next.passwordConfirm) nextErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
            else delete nextErrors.passwordConfirm;
        } else delete nextErrors.passwordConfirm;

        // 닉네임
        if (strict || has("nickname")) {
            if (!has("nickname")) nextErrors.nickname = "닉네임을 입력해주세요.";
            else delete nextErrors.nickname;
        } else delete nextErrors.nickname;

        // 성명
        if (strict || has("fullName")) {
            if (!has("fullName")) nextErrors.fullName = "성명을 입력해주세요.";
            else delete nextErrors.fullName;
        } else delete nextErrors.fullName;

        // 나이
        if (strict || has("age")) {
            if (!has("age")) nextErrors.age = "나이를 입력해주세요.";
            else delete nextErrors.age;
        } else delete nextErrors.age;

        // 전화번호
        if (strict || has("phoneNumber")) {
            if (!has("phoneNumber")) nextErrors.phoneNumber = "전화번호를 입력해주세요.";
            else delete nextErrors.phoneNumber;
        } else delete nextErrors.phoneNumber;

        // 성별
        if (strict) {
            if (!next.gender) nextErrors.gender = "성별을 선택해주세요.";
            else delete nextErrors.gender;
        } else if (next.gender) delete nextErrors.gender;

        setErrors(nextErrors);
        return nextErrors;
    };

    // 이메일/비번/확인 → soft 검증만(비어있다고 에러 만들지 않음)
    useEffect(() => {
        validateAll(formData, { strict: false });
    }, [formData.email, formData.password, formData.passwordConfirm]);

    // ---------- field handlers ----------
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => {
            const v = name === "phoneNumber" ? formatPhoneNumber(value) : value;
            return { ...prev, [name]: type === "checkbox" ? checked : v };
        });

        if (name === "email") setEmailCheck({ isChecking: false, isAvailable: null, message: "" });
        if (name === "nickname") setNickCheck({ isChecking: false, isAvailable: null, message: "" });
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((t) => ({ ...t, [name]: true }));
    };

    const handleGenderChange = (_e, newGender) => {
        if (newGender !== null) {
            setFormData((prev) => ({ ...prev, gender: newGender }));
            setTouched((t) => ({ ...t, gender: true }));
            setErrors((p) => { const n = { ...p }; delete n.gender; return n; });
        }
    };

    const handleCheckEmail = async () => {
        const email = (formData.email || "").trim();
        if (!email) { setErrors((p) => ({ ...p, email: "이메일을 입력해주세요." })); return; }
        if (!isValidEmailStrict(email)) {
            setEmailCheck({ isChecking: false, isAvailable: false, message: "올바른 이메일 형식이 아닙니다." });
            return;
        }

        setEmailCheck({ isChecking: true, isAvailable: null, message: "확인 중..." });
        try {
            const res = await apiCheckEmail(email);
            // ApiResponse<{isAvailable:boolean}>
            const available = !!(res?.data?.data?.isAvailable);
            setEmailCheck({
                isChecking: false,
                isAvailable: available,
                message: available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.",
            });
        } catch (err) {
            if (err?.response?.status === 409) {
                setEmailCheck({ isChecking: false, isAvailable: false, message: "이미 사용 중인 이메일입니다." });
            } else {
                setEmailCheck({ isChecking: false, isAvailable: null, message: "확인 중 오류가 발생했습니다." });
            }
        }
    };

    const handleCheckNickname = async () => {
        const nickname = (formData.nickname || "").trim();
        if (!nickname) { setErrors((p) => ({ ...p, nickname: "닉네임을 입력해주세요." })); return; }

        setNickCheck({ isChecking: true, isAvailable: null, message: "확인 중..." });
        try {
            // 백엔드: GET /api/users/check-nickname?nickname=...
            const res = await apiCheckNickname(nickname);
            // ApiResponse<{isAvailable:boolean}>
            console.log(res);
            const available = !!(res?.data?.data?.isAvailable);
            setNickCheck({
                isChecking: false,
                isAvailable: available,
                message: available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.",
            });
        } catch (e) {
            if (e?.response?.status === 409) {
                setNickCheck({ isChecking: false, isAvailable: false, message: "이미 사용 중인 닉네임입니다." });
            } else {
                setNickCheck({ isChecking: false, isAvailable: null, message: "확인 중 오류가 발생했습니다." });
            }
        }
    };

    const canSubmitSignup = useMemo(() => {
        const requiredFilled =
            formData.email && formData.password && formData.passwordConfirm &&
            formData.nickname && formData.fullName && formData.gender &&
            formData.age && formData.phoneNumber;

        const noErrors = Object.keys(errors).length === 0;
        return (
            requiredFilled &&
            noErrors &&
            isPwOk &&
            isPwMatch &&
            emailCheck.isAvailable === true &&
            nickCheck.isAvailable === true &&
            termsAgreed === true
        );
    }, [errors, formData, isPwOk, isPwMatch, emailCheck, nickCheck, termsAgreed]);

    // ---------- submit ----------
    const handleSubmit = async () => {
        try {
            if (type === "login") {
                if (submitting) return;
                setSubmitting(true);

                const loginResponse = await apiLogin(formData.email, formData.password);
                const payload = loginResponse.data?.data || loginResponse.data || {};
                const user = payload?.profile || payload?.user || {};

                persistAuth(payload);
                applyProfileUpdate?.(user);
                setCustomUser?.(user);
                setIsCustomLoggedIn?.(true);

                toast.success(`${user?.nickname || "사용자"}님 환영합니다!`, { containerId: "welcome" });
                navigate("/", { replace: true });
                setSubmitting(false);
                return;
            }

            if (type === "signup") {
                setSubmitted(true);
                const nextErrors = validateAll(formData, { strict: true });
                if (Object.keys(nextErrors).length > 0) { alert("입력 정보를 다시 확인해주세요."); return; }
                if (!isPwOk) { alert("비밀번호 형식을 확인해주세요."); return; }
                if (!isPwMatch) { alert("비밀번호가 일치하지 않습니다."); return; }
                if (emailCheck.isAvailable !== true) { alert("이메일 중복 확인을 완료해주세요."); return; }
                if (nickCheck.isAvailable !== true) { alert("닉네임 중복 확인을 완료해주세요."); return; }
                if (!termsAgreed) { alert("서비스 이용약관에 동의해야 합니다."); return; }

                await apiRegister({
                    email: formData.email.trim(),
                    password: formData.password,
                    nickname: formData.nickname.trim(),
                    fullName: formData.fullName.trim(),
                    phoneNumber: formData.phoneNumber.replace(/\D/g, ""), // 숫자만
                    mentalState: formData.mentalState,
                    age: Number(formData.age),
                    gender: String(formData.gender || "").toUpperCase(), // ENUM 대비
                });

                alert("회원가입이 완료되었습니다. 로그인 해주세요.");
                navigate("/login", { replace: true });
                return;
            }

            if (type === "find-id") {
                const response = await apiFindId({
                    phoneNumber: formData.phoneNumber,
                    nickname: formData.nickname,
                });

                if (response.data?.data?.email) {
                    setFoundId(response.data.data.email);
                    setIsIdModalOpen(true);
                } else {
                    alert("해당 정보로 가입된 이메일을 찾을 수 없습니다.");
                }
                return;
            }

            if (type === "find-password") {
                const response = await apiResetPassword({
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                });

                if (response.data?.data?.tempPassword) {
                    setTempPassword(response.data.data.tempPassword);
                    setIsPasswordModalOpen(true);
                } else {
                    alert("임시 비밀번호 발급에 실패했습니다.");
                }
                return;
            }
        } catch (err) {
            setSubmitting(false);
            console.error(`${type} error:`, err);
            alert(err.response?.data?.message || "요청 처리 중 오류가 발생했습니다.");
        }
    };

    const handleOpenTermsModal = () => setIsTermsModalOpen(true);
    const handleCloseTermsModal = () => { setIsTermsModalOpen(false); setTermsViewed(true); };
    const handleModalConfirm = () => { setIsTermsModalOpen(false); setTermsViewed(true); setTermsAgreed(true); };

    const handleKakaoLogin = () => { window.location.href = BACKEND_URL + "/api/auth/social/kakao/login"; };
    const handleGoogleLogin = () => { window.location.href = BACKEND_URL + "/api/auth/social/google/login"; };

    // ---------- UI ----------
    const renderForm = () => {
        switch (type) {
            case "logout":
                return (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        로그아웃 처리 중입니다...
                    </div>
                );

            case "login":
                return (
                    <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "40px", height: "80px" }}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login" />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>로그인</Typography>

                            <TextField className="input-wrapper" fullWidth label="이메일" name="email" margin="normal"
                                value={formData.email} onChange={handleChange} onBlur={handleBlur} />
                            <TextField className="input-wrapper" fullWidth label="비밀번호" name="password" type="password" margin="normal"
                                value={formData.password} onChange={handleChange} onBlur={handleBlur} />

                            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }}
                                onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "로그인 중..." : "로그인"}
                            </Button>

                            <Box className="social-buttons">
                                <Box className="social-login-divider">
                                    <Box className="divider-line" />
                                    <Box className="divider-text">또는</Box>
                                    <Box className="divider-line" />
                                </Box>
                                <Box className="button-container1">
                                    <Button fullWidth variant="contained" onClick={handleKakaoLogin} className="social-button kakao-login-button">
                                        카카오로 계속하기
                                    </Button>
                                    <Button fullWidth variant="outlined" onClick={handleGoogleLogin} className="social-button google-login-button">
                                        Google로 계속하기
                                    </Button>
                                </Box>
                            </Box>

                            <Box className="form-links">
                                <RouterLink to="/signup" className="form-link">회원가입</RouterLink>
                                <RouterLink to="/find-id" className="form-link">아이디 찾기</RouterLink>
                                <RouterLink to="/find-password" className="form-link">비밀번호 찾기</RouterLink>
                            </Box>
                        </Box>
                    </Box>
                );

            case "signup":
                return (
                    <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
                        <Box component="form" noValidate className="form-section-flex">
                            <Box className="form-left">
                                <Link to="/" style={{ display: "flex", height: "auto" }}>
                                    <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-sign-up" />
                                </Link>
                                <Typography variant="h5" component="h2" gutterBottom>회원가입</Typography>

                                {/* 닉네임 + 중복확인 */}
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                    <TextField
                                        className="input-wrapper"
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="닉네임"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={(submitted || touched.nickname) && (!!errors.nickname || nickCheck.isAvailable === false)}
                                        helperText={
                                            (submitted || touched.nickname)
                                                ? (errors.nickname || nickCheck.message || "")
                                                : ""
                                        }
                                        sx={{ "& .MuiFormHelperText-root": { color: nickCheck.isAvailable ? "green" : undefined } }}
                                    />
                                    <Button
                                        className="auth-button"
                                        variant="outlined"
                                        onClick={handleCheckNickname}
                                        disabled={nickCheck.isChecking}
                                        sx={{ mt: "8px", height: "55px", flexShrink: 0, color: "#ffffff", backgroundColor: "#a18cd1", border: "none" }}
                                    >
                                        {nickCheck.isChecking ? <CircularProgress size={24} /> : "중복확인"}
                                    </Button>
                                </Box>

                                {/* 성명 */}
                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="성명"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={(submitted || touched.fullName) && !!errors.fullName}
                                    helperText={(submitted || touched.fullName) ? errors.fullName : ""}
                                />

                                {/* 나이 */}
                                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                    <TextField
                                        className="input-wrapper"
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="나이"
                                        name="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={(submitted || touched.age) && !!errors.age}
                                        helperText={(submitted || touched.age) ? errors.age : ""}
                                        sx={{ flex: 1 }}
                                    />
                                </Box>

                                {/* 이메일 + 중복확인 */}
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                    <TextField
                                        className="input-wrapper"
                                        margin="dense"
                                        required
                                        fullWidth
                                        label="이메일 (아이디)"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={(submitted || touched.email) && !!errors.email || emailCheck.isAvailable === false}
                                        helperText={
                                            (submitted || touched.email)
                                                ? (errors.email || emailCheck.message || "")
                                                : (emailCheck.isAvailable ? emailCheck.message : "")
                                        }
                                        sx={{ "& .MuiFormHelperText-root": { color: emailCheck.isAvailable ? "green" : undefined } }}
                                    />
                                    <Button
                                        className="auth-button"
                                        variant="outlined"
                                        onClick={handleCheckEmail}
                                        disabled={emailCheck.isChecking}
                                        sx={{ mt: "8px", height: "55px", flexShrink: 0, color: "#ffffff", backgroundColor: "#a18cd1", border: "none" }}
                                    >
                                        {emailCheck.isChecking ? <CircularProgress size={24} /> : "중복확인"}
                                    </Button>
                                </Box>

                                {/* 전화번호(자동 하이픈) */}
                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    fullWidth
                                    label="전화번호"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={(submitted || touched.phoneNumber) && !!errors.phoneNumber}
                                    helperText={(submitted || touched.phoneNumber) ? errors.phoneNumber : ""}
                                />

                                {/* 비밀번호 */}
                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="비밀번호"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={(submitted || touched.password) && !!errors.password}
                                    sx={{
                                        "& .MuiInputBase-root": { backgroundColor: "#ffffffff" },
                                        "& .MuiFormHelperText-root": { backgroundColor: "transparent" },
                                    }}
                                    helperText={(submitted || touched.password) ? (errors.password || "8자 이상, 영문, 숫자, 특수문자를 포함해주세요.") : ""}
                                />

                                {/* 비밀번호 확인 */}
                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="비밀번호 확인"
                                    name="passwordConfirm"
                                    type="password"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={(submitted || touched.passwordConfirm) && !!errors.passwordConfirm}
                                    helperText={
                                        (submitted || touched.passwordConfirm)
                                            ? (errors.passwordConfirm || (formData.passwordConfirm && isPwMatch ? "비밀번호가 일치합니다." : ""))
                                            : ""
                                    }
                                    sx={{ backgroundColor: "#ffffffff" }}
                                />

                                {/* 성별: 남/여/기타 */}
                                <FormControl component="fieldset" margin="normal" sx={{ mb: 1 }} error={(submitted || touched.gender) && !!errors.gender}>
                                    <FormLabel component="legend" sx={{ mb: 1, fontSize: "0.8rem" }}>
                                        성별
                                    </FormLabel>
                                    <ToggleButtonGroup
                                        value={formData.gender}
                                        exclusive
                                        onChange={handleGenderChange}
                                        aria-label="gender selection"
                                        fullWidth
                                    >
                                        <ToggleButton value="male" aria-label="male">남성</ToggleButton>
                                        <ToggleButton value="female" aria-label="female">여성</ToggleButton>
                                        <ToggleButton value="other" aria-label="other">기타</ToggleButton>
                                    </ToggleButtonGroup>
                                    {(submitted || touched.gender) && errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                                </FormControl>

                                {/* 가입 버튼 */}
                                <Button
                                    className="login-button"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 2, mb: 1 }}
                                    onClick={handleSubmit}
                                    disabled={!canSubmitSignup}
                                >
                                    {canSubmitSignup ? "가입하기" : "입력 확인 후 가입하기"}
                                </Button>

                                <Box className="form-links">
                                    <RouterLink to="/login" className="form-link">이미 계정이 있으신가요? 로그인</RouterLink>
                                </Box>
                            </Box>

                            <Box className="form-right-legend">
                                <FormControl component="fieldset" margin="normal">
                                    <FormLabel component="legend">내가 생각하는 나의 현재 상태</FormLabel>
                                    <RadioGroup
                                        row
                                        name="mentalState"
                                        value={formData.mentalState}
                                        onChange={handleChange}
                                        className="radio-list"
                                    >
                                        {["우울증", "불안장애", "ADHD", "게임중독", "반항장애"].map((state) => (
                                            <FormControlLabel
                                                key={state}
                                                value={state}
                                                control={<Radio sx={{ "&.Mui-checked": { color: "#a18cd1" } }} />}
                                                label={state}
                                            />
                                        ))}
                                    </RadioGroup>
                                </FormControl>

                                {/* 약관 동의 */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={termsAgreed}
                                                onChange={(_, c) => setTermsAgreed(c)}
                                                disabled={!termsViewed}
                                                sx={{ "&.Mui-checked": { color: "#a18cd1" } }}
                                            />
                                        }
                                        label={
                                            <Typography component="span" sx={{ fontSize: "0.9rem" }}>
                                                {" "}
                                                <Button
                                                    variant="text"
                                                    onClick={() => setIsTermsModalOpen(true)}
                                                    sx={{ p: 0, color: "#a18cd1", textDecoration: "underline" }}
                                                >
                                                    {" "}서비스 이용약관{" "}
                                                </Button>{" "}
                                                에 동의합니다.{" "}
                                            </Typography>
                                        }
                                    />
                                    {!termsViewed && (
                                        <FormHelperText sx={{ ml: "14px", color: "rgba(0, 0, 0, 0.6)" }}>
                                            {" "}이용약관을 클릭하여 확인 후 동의해주세요.{" "}
                                        </FormHelperText>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                );

            case "find-id":
                return (
                    <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "50px", height: "auto" }}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login" />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>아이디 찾기</Typography>
                            <TextField className="input-wrapper" fullWidth label="전화번호" name="phoneNumber" margin="normal"
                                value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                            <TextField className="input-wrapper" fullWidth label="닉네임" name="nickname" margin="normal"
                                value={formData.nickname} onChange={handleChange} onBlur={handleBlur} />
                            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>
                                아이디 찾기
                            </Button>
                            <Box className="form-links">
                                <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
                            </Box>
                        </Box>
                    </Box>
                );

            case "find-password":
                return (
                    <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "50px", height: "auto" }}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login" />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>비밀번호 찾기</Typography>
                            <TextField className="input-wrapper" fullWidth label="이메일" name="email" margin="normal"
                                value={formData.email} onChange={handleChange} onBlur={handleBlur} />
                            <TextField className="input-wrapper" fullWidth label="전화번호" name="phoneNumber" margin="normal"
                                value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>
                                임시 비밀번호 발급
                            </Button>
                            <Box className="form-links">
                                <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
                            </Box>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <section>
            {renderForm()}
            {isTermsModalOpen && (
                <TermsModal
                    content={termsContent}
                    onClose={() => { setIsTermsModalOpen(false); setTermsViewed(true); }}
                    onConfirm={() => { setIsTermsModalOpen(false); setTermsViewed(true); setTermsAgreed(true); }}
                />
            )}
            {isPasswordModalOpen && (
                <TempPasswordModal password={tempPassword} onClose={() => setIsPasswordModalOpen(false)} />
            )}
            {isIdModalOpen && (
                <IdFoundModal
                    email={foundId}
                    onClose={() => { setIsIdModalOpen(false); navigate("/login", { replace: true }); }}
                />
            )}
        </section>
    );
};

export default AuthSection;
