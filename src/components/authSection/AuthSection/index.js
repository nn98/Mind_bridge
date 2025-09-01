import { useState } from "react";
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
    apiLogin, apiRegister, apiCheckEmail, apiFindId, apiResetPassword,
} from "../services/authApi";

ensureWelcomeToastMounted();

const AuthSection = ({ type, setIsCustomLoggedIn, setCustomUser }) => {
    const { applyProfileUpdate, logoutSuccess, fetchProfile } = useAuth();
    const navigate = useNavigate();

    // ---------- state ----------
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        nickname: "",
        phoneNumber: "",
        passwordConfirm: "",
        mentalState: "",
        termsAgreed: false,
        age: "",
        gender: "",
    });

    const [errors, setErrors] = useState({});
    const [emailCheck, setEmailCheck] = useState({
        isChecking: false,
        isAvailable: null,
        message: "",
    });

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsViewed, setTermsViewed] = useState(false);
    const [tempPassword, setTempPassword] = useState("");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [foundId, setFoundId] = useState("");
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ---------- validators ----------
    const emailRegex =
        /^[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*@[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*\.[a-zA-Z]{2,}$/;

    const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    const isPwOk = passwordRegex.test(formData.password);
    const isPwMatch =
        formData.password.length > 0 &&
        formData.passwordConfirm.length > 0 &&
        formData.password === formData.passwordConfirm;

    // ---------- helpers ----------
    const persistAuth = (payload) => {
        const token = payload?.token || payload?.accessToken || null;
        if (token) {
            localStorage.setItem("token", token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            localStorage.setItem("token", "LOGIN"); // 쿠키 세션 환경
        }
    };

    // SDK/소셜/로그아웃 부수효과
    useKakaoSdk();

    useSocialLoginEffect({
        applyProfileUpdate,
        setCustomUser,
        setIsCustomLoggedIn,
        fetchProfile,
    });

    useLogoutEffect({
        type,
        onAfterLogout: () => {
            try { logoutSuccess?.(); } catch { }
        },
    });

    // ---------- field handlers ----------
    const validateField = (name, value, currentData) => {
        const newErrors = { ...errors };

        if (name === "password" || name === "passwordConfirm") {
            const { password, passwordConfirm } = currentData;
            if (!passwordRegex.test(password || "")) {
                newErrors.password = "8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.";
            } else {
                delete newErrors.password;
            }
            if (passwordConfirm && password !== passwordConfirm) {
                newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
            } else {
                delete newErrors.passwordConfirm;
            }
        }

        if (name === "email") {
            if (!emailRegex.test((value || "").trim())) {
                newErrors.email = "올바른 이메일 형식이 아닙니다.";
            } else {
                delete newErrors.email;
            }
        }

        setErrors(newErrors);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => {
            const newData = {
                ...prevData,
                [name]: type === "checkbox" ? checked : value,
            };
            validateField(name, value, newData);
            return newData;
        });

        if (name === "email") {
            setEmailCheck({ isChecking: false, isAvailable: null, message: "" });
        }
    };

    const handleGenderChange = (_event, newGender) => {
        if (newGender !== null) {
            setFormData((prev) => ({ ...prev, gender: newGender }));
        }
    };

    const handleCheckEmail = async () => {
        const email = (formData.email || "").trim();

        if (!email) {
            setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
            setEmailCheck({ isChecking: false, isAvailable: null, message: "" });
            return;
        }

        if (!emailRegex.test(email)) {
            setEmailCheck({
                isChecking: false,
                isAvailable: false,
                message: "올바른 이메일 형식이 아닙니다.",
            });
            return;
        }

        setEmailCheck({ isChecking: true, isAvailable: null, message: "확인 중..." });

        try {
            const response = await apiCheckEmail(email);

            // 응답 스키마 유연 처리: {available} 또는 {data:{isAvailable}}
            let available = true;
            if (typeof response.data?.available === "boolean") {
                available = response.data.available;
            } else if (typeof response.data?.data?.isAvailable === "boolean") {
                available = response.data.data.isAvailable;
            }

            setEmailCheck({
                isChecking: false,
                isAvailable: available,
                message: available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.",
            });
        } catch (err) {
            if (err?.response?.status === 409) {
                setEmailCheck({
                    isChecking: false,
                    isAvailable: false,
                    message: "이미 사용 중인 이메일입니다.",
                });
            } else {
                setEmailCheck({
                    isChecking: false,
                    isAvailable: null,
                    message: "확인 중 오류가 발생했습니다.",
                });
            }
        }
    };

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
                const email = (formData.email || "").trim();

                if (!emailRegex.test(email)) {
                    alert("올바른 이메일 형식이 아닙니다.");
                    return;
                }
                if (emailCheck.isAvailable !== true) {
                    alert("이메일 중복 확인을 먼저 완료해주세요.");
                    return;
                }
                if (!passwordRegex.test(formData.password)) {
                    alert("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
                    return;
                }
                if (formData.password !== formData.passwordConfirm) {
                    alert("비밀번호가 일치하지 않습니다.");
                    return;
                }
                if (!formData.termsAgreed) {
                    alert("서비스 이용약관에 동의해야 합니다.");
                    return;
                }
                if (Object.keys(errors).length > 0) {
                    alert("입력 정보를 다시 확인해주세요.");
                    return;
                }

                await apiRegister({
                    email,
                    password: formData.password,
                    nickname: formData.nickname,
                    phoneNumber: formData.phoneNumber,
                    mentalState: formData.mentalState,
                    age: formData.age,
                    gender: formData.gender,
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
    const handleCloseTermsModal = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
    };
    const handleModalConfirm = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
        setFormData((prev) => ({ ...prev, termsAgreed: true }));
    };

    const handleKakaoLogin = () => {
        window.location.href = BACKEND_URL + "/api/auth/social/kakao/login";
    };
    const handleGoogleLogin = () => {
        window.location.href = BACKEND_URL + "/api/auth/social/google/login";
    };

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
                    <Box
                        sx={{
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "40px", height: "80px" }}>
                                <img
                                    src="/img/로고1.png"
                                    alt="Mind Bridge 로고"
                                    className="logo-login"
                                />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>
                                로그인
                            </Typography>
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="이메일"
                                name="email"
                                margin="normal"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="비밀번호"
                                name="password"
                                type="password"
                                margin="normal"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <Button
                                className="login-button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? "로그인 중..." : "로그인"}
                            </Button>

                            <Box className="social-buttons">
                                <Box className="social-login-divider">
                                    <Box className="divider-line" />
                                    <Box className="divider-text">또는</Box>
                                    <Box className="divider-line" />
                                </Box>
                                <Box className="button-container1">
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleKakaoLogin}
                                        className="social-button kakao-login-button"
                                    >
                                        카카오로 계속하기
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={handleGoogleLogin}
                                        className="social-button google-login-button"
                                    >
                                        Google로 계속하기
                                    </Button>
                                </Box>
                            </Box>

                            <Box className="form-links">
                                <RouterLink to="/signup" className="form-link">
                                    회원가입
                                </RouterLink>
                                <RouterLink to="/find-id" className="form-link">
                                    아이디 찾기
                                </RouterLink>
                                <RouterLink to="/find-password" className="form-link">
                                    비밀번호 찾기
                                </RouterLink>
                            </Box>
                        </Box>
                    </Box>
                );

            case "signup":
                return (
                    <Box
                        sx={{
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        <Box component="form" noValidate className="form-section-flex">
                            <Box className="form-left">
                                <Link to="/" style={{ display: "flex", height: "auto" }}>
                                    <img
                                        src="/img/로고1.png"
                                        alt="Mind Bridge 로고"
                                        className="logo-sign-up"
                                    />
                                </Link>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    회원가입
                                </Typography>

                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="닉네임"
                                    name="nickname"
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    error={!!errors.nickname}
                                    helperText={errors.nickname}
                                />

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
                                        sx={{ flex: 1 }}
                                    />
                                </Box>

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
                                        error={
                                            !!errors.email ||
                                            (emailCheck.message && emailCheck.isAvailable === false)
                                        }
                                        helperText={
                                            errors.email ||
                                            (emailCheck.message || "중복 확인을 진행해주세요.")
                                        }
                                        sx={{
                                            "& .MuiFormHelperText-root": {
                                                color: emailCheck.isAvailable ? "green" : undefined,
                                            },
                                        }}
                                    />
                                    <Button
                                        className="auth-button"
                                        variant="outlined"
                                        onClick={handleCheckEmail}
                                        disabled={emailCheck.isChecking}
                                        sx={{
                                            mt: "8px",
                                            height: "55px",
                                            flexShrink: 0,
                                            color: "#ffffff",
                                            backgroundColor: "#a18cd1",
                                            border: "none",
                                        }}
                                    >
                                        {emailCheck.isChecking ? <CircularProgress size={24} /> : "중복확인"}
                                    </Button>
                                </Box>

                                <TextField
                                    className="input-wrapper"
                                    margin="normal"
                                    fullWidth
                                    label="전화번호"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />

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
                                    error={!!errors.password}
                                    sx={{
                                        "& .MuiInputBase-root": { backgroundColor: "#ffffffff" },
                                        "& .MuiFormHelperText-root": { backgroundColor: "transparent" },
                                    }}
                                    helperText={errors.password || "8자 이상, 영문, 숫자, 특수문자를 포함해주세요."}
                                />

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
                                    error={!!errors.passwordConfirm}
                                    helperText={
                                        errors.passwordConfirm ||
                                        (formData.passwordConfirm && isPwMatch
                                            ? "비밀번호가 일치합니다."
                                            : "")
                                    }
                                    sx={{ backgroundColor: "#ffffffff" }}
                                />

                                <FormControl component="fieldset" margin="normal" sx={{ mb: 1 }}>
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
                                    </ToggleButtonGroup>
                                </FormControl>

                                <Button
                                    className="login-button"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 2, mb: 1 }}
                                    onClick={handleSubmit}
                                >
                                    가입하기
                                </Button>

                                <Box className="form-links">
                                    <RouterLink to="/login" className="form-link">
                                        이미 계정이 있으신가요? 로그인
                                    </RouterLink>
                                </Box>
                            </Box>

                            <Box className="form-right-legend">
                                <FormControl component="fieldset" margin="normal" error={!!errors.mentalState}>
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
                                    {errors.mentalState && <FormHelperText>{errors.mentalState}</FormHelperText>}
                                </FormControl>

                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="termsAgreed"
                                                checked={formData.termsAgreed}
                                                onChange={handleChange}
                                                disabled={!termsViewed}
                                                sx={{ "&.Mui-checked": { color: "#a18cd1" } }}
                                            />
                                        }
                                        label={
                                            <Typography component="span" sx={{ fontSize: "0.9rem" }}>
                                                {" "}
                                                <Button
                                                    variant="text"
                                                    onClick={handleOpenTermsModal}
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
                    <Box
                        sx={{
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "50px", height: "auto" }}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login" />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>
                                아이디 찾기
                            </Typography>
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="전화번호"
                                name="phoneNumber"
                                margin="normal"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="닉네임"
                                name="nickname"
                                margin="normal"
                                value={formData.nickname}
                                onChange={handleChange}
                            />
                            <Button
                                className="login-button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={handleSubmit}
                            >
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
                    <Box
                        sx={{
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        <Box className="form-section">
                            <Link to="/" style={{ display: "inline-block", width: "50px", height: "auto" }}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login" />
                            </Link>
                            <Typography variant="h4" component="h1" gutterBottom>
                                비밀번호 찾기
                            </Typography>
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="이메일"
                                name="email"
                                margin="normal"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <TextField
                                className="input-wrapper"
                                fullWidth
                                label="전화번호"
                                name="phoneNumber"
                                margin="normal"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                            <Button
                                className="login-button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={handleSubmit}
                            >
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
                    onClose={handleCloseTermsModal}
                    onConfirm={handleModalConfirm}
                />
            )}
            {isPasswordModalOpen && (
                <TempPasswordModal
                    password={tempPassword}
                    onClose={() => setIsPasswordModalOpen(false)}
                />
            )}
            {isIdModalOpen && (
                <IdFoundModal
                    email={foundId}
                    onClose={() => {
                        setIsIdModalOpen(false);
                        navigate("/login", { replace: true });
                    }}
                />
            )}
        </section>
    );
};

export default AuthSection;
