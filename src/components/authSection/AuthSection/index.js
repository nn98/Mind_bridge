import {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {Link as RouterLink, useNavigate, Link} from "react-router-dom";
import {useAuth} from "../../../AuthContext";
import {
    Button,
    TextField,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    FormControl,
    FormLabel,
    Box,
    Typography,
    CircularProgress,
    FormHelperText,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";

import "../../../css/login.css";
import {toast} from "react-toastify";

import {ensureWelcomeToastMounted} from "../services/welcomeToast";
import {BACKEND_URL} from "../services/env";
import {useKakaoSdk} from "../hooks/useKakaoSdk";
import {useSocialLoginEffect} from "../hooks/useSocialLoginEffect";
import {useLogoutEffect} from "../hooks/useLogoutEffect";
import TermsModal from "../modals/TermsModal";
import TempPasswordModal from "../modals/TempPasswordModal";
import IdFoundModal from "../modals/IdFoundModal";
import termsContent from "../data/termsContent";
import Toast from '../../chat-modal/components/Toast'; // Toast 컴포넌트 import 추가
import {clearSession} from "../../dashboard/ChatConsult";

import {
    apiLogin, apiRegister, apiCheckEmail, apiFindId, apiResetPassword, apiCheckNickname, apiSaveChatStyle
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
const emailRegexBase = /^[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*@[0-9a-zA-Z]([._-]?[0-9a-zA-Z])*\.[a-zA-Z]{2,}$/;
const isValidEmailStrict = (email) => {
    if (!emailRegexBase.test(email)) return false;
    const lower = email.toLowerCase();
    if (/\.(comm|con)$/.test(lower)) return false;
    if (/@g?mial\.com$/.test(lower)) return false;
    if (/@naver\.(net|con)$/.test(lower)) return false;
    return true;
};

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const AuthSection = ({type, setIsCustomLoggedIn, setCustomUser}) => {
    const {applyProfileUpdate, logoutSuccess, fetchProfile} = useAuth();
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

    const [emailCheck, setEmailCheck] = useState({isChecking: false, isAvailable: null, message: ""});
    const [nickCheck, setNickCheck] = useState({isChecking: false, isAvailable: null, message: ""});

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsViewed, setTermsViewed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const [tempPassword, setTempPassword] = useState("");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [foundId, setFoundId] = useState("");
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Toast 메시지 state 추가
    const [toastState, setToastState] = useState({show: false, message: '', type: 'info'});

    // Toast 메시지 표시 함수
    const showToast = (message, type = 'info') => {
        setToastState({show: true, message, type});
        setTimeout(() => setToastState({show: false, message: '', type: 'info'}), 3000);
    };

    // 파생 상태
    const isPwOk = passwordRegex.test(formData.password);
    const isPwMatch = formData.password.length > 0 && formData.passwordConfirm.length > 0 && formData.password === formData.passwordConfirm;

    // SDK/소셜/로그아웃 부수효과
    useKakaoSdk();
    useSocialLoginEffect({applyProfileUpdate, setCustomUser, setIsCustomLoggedIn, fetchProfile});
    useLogoutEffect({
        type,
        onAfterLogout: () => {
            try {
                logoutSuccess?.();
                clearSession();   // ✅ 로그아웃 시 채팅 세션도 제거
            } catch {
            }
        }
    });

    // ---------- 감성 스타일 ----------
    const styleOptions = ["따뜻한", "차가운", "쾌활한", "진중한", "심플한", "전문적"];

    const handleStyleSelect = (_e, newStyle) => {
        if (newStyle !== null) {
            setFormData((prev) => ({...prev, chatStyle: newStyle}));
        }
    };

    // ---------- validators ----------
    const validateAll = (next = formData, {strict = false} = {}) => {
        const nextErrors = {...errors};
        const val = (k) => String(next[k] ?? "").trim();
        const has = (k) => val(k).length > 0;

        if (strict || has("email")) {
            if (!has("email")) nextErrors.email = "이메일을 입력해주세요."; else if (!isValidEmailStrict(val("email"))) nextErrors.email = "올바른 이메일 형식이 아닙니다."; else delete nextErrors.email;
        } else delete nextErrors.email;

        if (strict || has("password")) {
            if (!has("password") || !passwordRegex.test(next.password)) nextErrors.password = "8자 이상, 영문/숫자/특수문자 포함"; else delete nextErrors.password;
        } else delete nextErrors.password;

        if (strict || has("passwordConfirm")) {
            if (!has("passwordConfirm")) nextErrors.passwordConfirm = "비밀번호 확인을 입력해주세요."; else if (next.password !== next.passwordConfirm) nextErrors.passwordConfirm = "비밀번호가 일치하지 않습니다."; else delete nextErrors.passwordConfirm;
        } else delete nextErrors.passwordConfirm;

        if (strict || has("nickname")) {
            if (!has("nickname")) nextErrors.nickname = "닉네임을 입력해주세요."; else delete nextErrors.nickname;
        } else delete nextErrors.nickname;

        if (strict || has("fullName")) {
            if (!has("fullName")) nextErrors.fullName = "성명을 입력해주세요."; else delete nextErrors.fullName;
        } else delete nextErrors.fullName;

        if (strict || has("age")) {
            if (!has("age")) nextErrors.age = "나이를 입력해주세요."; else delete nextErrors.age;
        } else delete nextErrors.age;

        if (strict || has("phoneNumber")) {
            if (!has("phoneNumber")) nextErrors.phoneNumber = "전화번호를 입력해주세요."; else delete nextErrors.phoneNumber;
        } else delete nextErrors.phoneNumber;

        if (strict) {
            if (!next.gender) nextErrors.gender = "성별을 선택해주세요."; else delete nextErrors.gender;
        } else if (next.gender) delete nextErrors.gender;

        setErrors(nextErrors);
        return nextErrors;
    };

    useEffect(() => {
        validateAll(formData, {strict: false});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.email, formData.password, formData.passwordConfirm, formData.nickname, formData.fullName, formData.age, formData.phoneNumber, formData.gender]);

    // ---------- field handlers ----------
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData((prev) => {
            const v = name === "phoneNumber" ? formatPhoneNumber(value) : value;
            return {...prev, [name]: type === "checkbox" ? checked : v};
        });

        if (name === "email") setEmailCheck({isChecking: false, isAvailable: null, message: ""});
        if (name === "nickname") setNickCheck({isChecking: false, isAvailable: null, message: ""});

        setErrors((prev) => {
            const next = {...prev};
            if (String(value).trim()) delete next[name];
            return next;
        });
    };

    const handleBlur = (e) => {
        const {name} = e.target;
        setTouched((t) => ({...t, [name]: true}));
    };

    const handleGenderChange = (_e, newGender) => {
        if (newGender !== null) {
            setFormData((prev) => ({...prev, gender: newGender}));
            setTouched((t) => ({...t, gender: true}));
            setErrors((p) => {
                const n = {...p};
                delete n.gender;
                return n;
            });
        }
    };

    const handleCheckEmail = async () => {
        const email = (formData.email || "").trim();
        if (!email) {
            setErrors((p) => ({...p, email: "이메일을 입력해주세요."}));
            return;
        }
        if (!isValidEmailStrict(email)) {
            setEmailCheck({isChecking: false, isAvailable: false, message: "올바른 이메일 형식이 아닙니다."});
            return;
        }

        setEmailCheck({isChecking: true, isAvailable: null, message: "확인 중..."});
        try {
            const res = await apiCheckEmail(email);
            const isAvailable = !!(res?.isAvailable);
            setEmailCheck({
                isChecking: false,
                isAvailable: isAvailable,
                message: isAvailable ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.",
            });
            if (isAvailable) setErrors((p) => {
                const n = {...p};
                delete n.email;
                return n;
            });
        } catch (err) {
            if (err?.response?.status === 409) {
                setEmailCheck({isChecking: false, isAvailable: false, message: "이미 사용 중인 이메일입니다."});
            } else {
                setEmailCheck({isChecking: false, isAvailable: null, message: "확인 중 오류가 발생했습니다."});
            }
        }
    };

    const handleCheckNickname = async () => {
        const nickname = (formData.nickname || "").trim();
        if (!nickname) {
            setErrors((p) => ({...p, nickname: "닉네임을 입력해주세요."}));
            return;
        }

        setNickCheck({isChecking: true, isAvailable: null, message: "확인 중..."});
        try {
            const res = await apiCheckNickname(nickname);
            const isAvailable = !!(res?.isAvailable);
            console.log(res);
            setNickCheck({
                isChecking: false,
                isAvailable: isAvailable,
                message: isAvailable ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.",
            });
            if (isAvailable) setErrors((p) => {
                const n = {...p};
                delete n.nickname;
                return n;
            });
        } catch (e) {
            if (e?.response?.status === 409) {
                setNickCheck({isChecking: false, isAvailable: false, message: "이미 사용 중인 닉네임입니다."});
            } else {
                setNickCheck({isChecking: false, isAvailable: null, message: "확인 중 오류가 발생했습니다."});
            }
        }
    };

    const canSubmitSignup = useMemo(() => {
        const requiredFilled = formData.email && formData.password && formData.passwordConfirm && formData.nickname && formData.fullName && formData.gender && formData.age && formData.phoneNumber;

        const noErrors = Object.keys(errors).length === 0;
        return (requiredFilled && noErrors && isPwOk && isPwMatch && emailCheck.isAvailable === true && nickCheck.isAvailable === true && termsAgreed === true);
    }, [errors, formData, isPwOk, isPwMatch, emailCheck, nickCheck, termsAgreed]);

    // ---------- submit ----------
    const handleSubmit = async () => {
        try {
            if (type === "login") {
                if (submitting) return;
                setSubmitting(true);

                await apiLogin(formData.email, formData.password);
                const user = await fetchProfile();

                applyProfileUpdate?.(user);
                setCustomUser?.(user);
                setIsCustomLoggedIn?.(true);

                toast.success(`${user?.nickname || "사용자"}님 환영합니다!`, {containerId: "welcome"});
                navigate("/", {replace: true});
                setSubmitting(false);
                return;
            }

            if (type === "signup") {
                setSubmitted(true);
                const nextErrors = validateAll(formData, {strict: true});
                if (Object.keys(nextErrors).length > 0) {
                    showToast("입력 정보를 다시 확인해주세요.", "error");
                    return;
                }
                if (!isPwOk) {
                    showToast("비밀번호 형식을 확인해주세요.", "error");
                    return;
                }
                if (!isPwMatch) {
                    showToast("비밀번호가 일치하지 않습니다.", "error");
                    return;
                }
                if (emailCheck.isAvailable !== true) {
                    showToast("이메일 중복 확인을 완료해주세요.", "error");
                    return;
                }
                if (nickCheck.isAvailable !== true) {
                    showToast("닉네임 중복 확인을 완료해주세요.", "error");
                    return;
                }
                if (!termsAgreed) {
                    showToast("서비스 이용약관에 동의해야 합니다.", "error");
                    return;
                }

                await apiRegister({
                    email: formData.email.trim(),
                    password: formData.password,
                    confirmPassword: formData.passwordConfirm,
                    nickname: formData.nickname.trim(),
                    fullName: formData.fullName.trim(),
                    phoneNumber: formData.phoneNumber.replace(/^0(\d{2,3})(\d{3,4})(\d{4})$/, '0$1-$2-$3'),
                    mentalState: formData.mentalState,
                    age: Number(formData.age),
                    gender: String(formData.gender || "").toUpperCase(),
                    chatStyle: String(formData.chatStyle),
                    termsAccepted: !!termsAgreed,
                });

                showToast("회원가입이 완료되었습니다. 로그인 해주세요.", "success");
                setTimeout(() => {
                    navigate("/login", {replace: true});
                }, 1500);
                return;
            }

            if (type === "find-id") {
                const response = await apiFindId({
                    phoneNumber: formData.phoneNumber, nickname: formData.nickname,
                });

                if (response.data?.data?.email) {
                    setFoundId(response.data.data.email);
                    setIsIdModalOpen(true);
                } else {
                    showToast("해당 정보로 가입된 이메일을 찾을 수 없습니다.", "error");
                }
                return;
            }

            if (type === "find-password") {
                const response = await apiResetPassword({
                    email: formData.email, phoneNumber: formData.phoneNumber,
                });

                if (response.data?.tempPassword) {
                    setTempPassword(response.data.tempPassword);
                    setIsPasswordModalOpen(true);
                } else {
                    showToast("임시 비밀번호 발급에 실패했습니다.", "error");
                }
                return;
            }
        } catch (err) {
            setSubmitting(false);
            console.error(`${type} error:`, err);
            showToast(err.response?.data?.message || "이메일 또는 비밀번호가 다릅니다.", "error");
        }
    };

    useEffect(() => {
        if (type !== "login") return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [type, formData.email, formData.password]);

    const handleOpenTermsModal = () => setIsTermsModalOpen(true);
    const handleCloseTermsModal = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
    };
    const handleModalConfirm = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
        setTermsAgreed(true);
    };

    const handleKakaoLogin = () => {
        window.location.href = BACKEND_URL + "/api/auth/social/kakao/login";
    };
    const handleGoogleLogin = () => {
        window.location.href = BACKEND_URL + "/api/auth/social/google/login";
    };

    // ---------- 공통 스타일(SX) ----------
    const fieldSX = {
        "& .MuiInputBase-root": {minHeight: 56}, "& .MuiFormHelperText-root:empty": {display: "none"},
    };
    const labelNoWrap = {whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"};

    // ---------- UI ----------
    const renderForm = () => {
        switch (type) {
            case "logout":
                return (<div style={{textAlign: "center", padding: "2rem"}}>
                    로그아웃 처리 중입니다...
                </div>);

            case "login":
                return (<Box sx={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5"
                }}>
                    <Box className="form-section">
                        <Link to="/" style={{display: "inline-block", width: "40px", height: "80px"}}>
                            <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login"/>
                        </Link>
                        <Typography variant="h4" component="h1" gutterBottom>로그인</Typography>

                        <TextField
                            className="input-wrapper"
                            fullWidth
                            label="이메일"
                            name="email"
                            margin="normal"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
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
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
                        />

                        <Button
                            className="login-button"
                            fullWidth
                            variant="contained"
                            sx={{mt: 2, mb: 1, height: 56}}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "로그인 중..." : "로그인"}
                        </Button>

                        <Box className="social-buttons">
                            <Box className="social-login-divider">
                                <Box className="divider-line"/>
                                <Box className="divider-text">또는</Box>
                                <Box className="divider-line"/>
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
                            <RouterLink to="/signup" className="form-link">회원가입</RouterLink>
                            <RouterLink to="/find-id" className="form-link">아이디 찾기</RouterLink>
                            <RouterLink to="/find-password" className="form-link">비밀번호 찾기</RouterLink>
                        </Box>
                    </Box>
                </Box>);

            case "signup":
                return (<Box sx={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5"
                }}>
                    <Box component="form" noValidate className="form-section-flex">
                        <Box className="form-left">
                            <Link to="/" style={{display: "flex", height: "auto"}}>
                                <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-sign-up"/>
                            </Link>
                            <Typography variant="h5" component="h2" gutterBottom>회원가입</Typography>

                            {/* 닉네임 + 중복확인 */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: 1,
                                    "& .MuiTextField-root": {mt: 1, mb: 0},      // 행 내부 TextField 마진 통일
                                    "& .auth-button": {mt: 1, height: 56},       // 버튼도 동일 오프셋/높이
                                }}
                            >
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
                                    error={Boolean((submitted || touched.nickname) && (errors.nickname || nickCheck.isAvailable === false))}
                                    helperText={
                                        (submitted || touched.nickname) ? (errors.nickname || nickCheck.message || "\u00A0") : "\u00A0"
                                    }
                                    sx={{
                                        ...fieldSX, "& .MuiFormHelperText-root": {
                                            ...(nickCheck.isAvailable && !errors.nickname ? {color: "green"} : {}),
                                        },
                                    }}
                                    InputLabelProps={{sx: labelNoWrap}}
                                />
                                <Button
                                    className="auth-button"
                                    variant="outlined"
                                    onClick={handleCheckNickname}
                                    disabled={nickCheck.isChecking}
                                    sx={{flexShrink: 0, color: "#fff", backgroundColor: "#a18cd1", border: "none"}}
                                >
                                    {nickCheck.isChecking ? <CircularProgress size={24}/> : "중복확인"}
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
                                sx={fieldSX}
                                InputLabelProps={{sx: labelNoWrap}}
                            />

                            {/* 나이 */}
                            <Box sx={{display: "flex", gap: 2, alignItems: "center"}}>
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
                                    sx={{flex: 1, ...fieldSX}}
                                    InputLabelProps={{sx: labelNoWrap}}
                                />
                            </Box>

                            {/* 이메일 + 중복확인 */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: 1,
                                    "& .MuiTextField-root": {mt: 1, mb: 0},      // 동일 규칙
                                    "& .auth-button": {mt: 1, height: 56},       // 동일 규칙
                                }}
                            >
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
                                    error={Boolean((submitted || touched.email) && (errors.email || emailCheck.isAvailable === false))}
                                    helperText={
                                        (submitted || touched.email) ? (errors.email || emailCheck.message || "\u00A0") : (emailCheck.isAvailable ? emailCheck.message : "\u00A0")
                                    }
                                    sx={{
                                        ...fieldSX, "& .MuiFormHelperText-root": {
                                            ...(emailCheck.isAvailable && !errors.email ? {color: "green"} : {}),
                                        },
                                    }}
                                    InputLabelProps={{sx: labelNoWrap}}
                                />
                                <Button
                                    className="auth-button"
                                    variant="outlined"
                                    onClick={handleCheckEmail}
                                    disabled={emailCheck.isChecking}
                                    sx={{flexShrink: 0, color: "#fff", backgroundColor: "#a18cd1", border: "none"}}
                                >
                                    {emailCheck.isChecking ? <CircularProgress size={24}/> : "중복확인"}
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
                                sx={fieldSX}
                                InputLabelProps={{sx: labelNoWrap}}
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
                                helperText={(submitted || touched.password) ? (errors.password || "8자 이상, 영문/숫자/특수문자 포함") : "\u00A0"}
                                sx={{"& .MuiInputBase-root": {backgroundColor: "#ffffffff", minHeight: 56}}}
                                FormHelperTextProps={{
                                    sx: {
                                        m: 0,
                                        height: 24,
                                        lineHeight: "24px",
                                        overflow: "hidden",
                                        whiteSpace: "normal",
                                        textOverflow: "ellipsis",
                                        display: "block !important", // ✅ 이 부분을 추가하여 텍스트를 오른쪽으로 옮깁니다.

                                    }
                                }}
                                InputLabelProps={{
                                    sx: {
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                    }
                                }}
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
                                helperText={(submitted || touched.passwordConfirm) && (errors.passwordConfirm || (formData.passwordConfirm && isPwMatch ? "비밀번호가 일치합니다." : "")) || "\u00A0"}
                                sx={{"& .MuiInputBase-root": {minHeight: 56}}}
                                FormHelperTextProps={{
                                    sx: {
                                        m: 0,
                                        minHeight: 24,
                                        lineHeight: "24px",
                                        whiteSpace: "normal", // 비밀번호가 일치하고 에러가 없을 때 적용될 스타일
                                        color: isPwMatch && !errors.passwordConfirm ? 'success.main' : undefined, // ✅ 이 부분을 추가하여 성공 메시지만 오른쪽으로 옮깁니다
                                    }
                                }}
                                InputLabelProps={{
                                    sx: {
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                    }
                                }}
                            />


                            {/* 성별 */}
                            <FormControl component="fieldset" margin="normal" sx={{mb: 1}}
                                         error={(submitted || touched.gender) && !!errors.gender}>
                                <FormLabel component="legend" sx={{mb: 1, fontSize: "0.8rem"}}>
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
                                {(submitted || touched.gender) && errors.gender &&
                                    <FormHelperText>{errors.gender}</FormHelperText>}
                            </FormControl>

                            {/* 가입 버튼 */}
                            <Button
                                className="login-button"
                                fullWidth
                                variant="contained"
                                sx={{mt: 2, mb: 1, height: 56}}
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

                            <Box sx={{mt: 3}}>
                                <FormLabel component="legend">채팅 감성 스타일 선택</FormLabel>
                                <div className="chat-style-buttons">
                                    {styleOptions.map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            className={`chat-style-button ${formData.chatStyle === style ? "selected" : ""}`}
                                            onClick={() => setFormData((prev) => ({...prev, chatStyle: style}))}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                                <FormControl component="fieldset" margin="normal">
                                    <FormLabel component="legend">내가 생각하는 나의 현재 상태</FormLabel>
                                    <RadioGroup
                                        row
                                        name="mentalState"
                                        value={formData.mentalState}
                                        onChange={handleChange}
                                        className="radio-list"
                                    >
                                        {["우울증", "불안장애", "ADHD", "게임중독", "반항장애"].map((state) => (<FormControlLabel
                                            key={state}
                                            value={state}
                                            control={<Radio sx={{"&.Mui-checked": {color: "#a18cd1"}}}/>}
                                            label={state}
                                        />))}
                                    </RadioGroup>
                                </FormControl>

                                {/* 약관 동의 */}
                                <Box>
                                    <FormControlLabel
                                        control={<Checkbox
                                            checked={termsAgreed}
                                            onChange={(_, c) => setTermsAgreed(c)}
                                            disabled={!termsViewed}
                                            sx={{"&.Mui-checked": {color: "#a18cd1"}}}
                                        />}
                                        label={<Typography component="span" sx={{fontSize: "0.9rem"}}>
                                            {" "}
                                            <Button
                                                variant="text"
                                                onClick={() => setIsTermsModalOpen(true)}
                                                sx={{p: 0, color: "#a18cd1", textDecoration: "underline"}}
                                            >
                                                {" "}서비스 이용약관{" "}
                                            </Button>{" "}
                                            에 동의합니다.{" "}
                                        </Typography>}
                                    />
                                    {!termsViewed && (
                                        <FormHelperText sx={{ml: "14px", color: "rgba(0, 0, 0, 0.6)"}}>
                                            {" "}이용약관을 클릭하여 확인 후 동의해주세요.{" "}
                                        </FormHelperText>)}
                                </Box>
                                {/* 감성 스타일 선택 */}

                            </Box>
                        </Box>
                    </Box>
                </Box>);

            case "find-id":
                return (<Box sx={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5"
                }}>
                    <Box className="form-section">
                        <Link to="/" style={{display: "inline-block", width: "50px", height: "auto"}}>
                            <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login"/>
                        </Link>
                        <Typography variant="h4" component="h1" gutterBottom>아이디 찾기</Typography>
                        <TextField
                            className="input-wrapper"
                            fullWidth
                            label="전화번호"
                            name="phoneNumber"
                            margin="normal"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
                        />
                        <TextField
                            className="input-wrapper"
                            fullWidth
                            label="닉네임"
                            name="nickname"
                            margin="normal"
                            value={formData.nickname}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
                        />
                        <Button
                            className="login-button"
                            fullWidth
                            variant="contained"
                            sx={{mt: 2, mb: 1, height: 56}}
                            onClick={handleSubmit}
                        >
                            아이디 찾기
                        </Button>
                        <Box className="form-links">
                            <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
                        </Box>
                    </Box>
                </Box>);

            case "find-password":
                return (<Box sx={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5"
                }}>
                    <Box className="form-section">
                        <Link to="/" style={{display: "inline-block", width: "50px", height: "auto"}}>
                            <img src="/img/로고1.png" alt="Mind Bridge 로고" className="logo-login"/>
                        </Link>
                        <Typography variant="h4" component="h1" gutterBottom>비밀번호 찾기</Typography>
                        <TextField
                            className="input-wrapper"
                            fullWidth
                            label="이메일"
                            name="email"
                            margin="normal"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
                        />
                        <TextField
                            className="input-wrapper"
                            fullWidth
                            label="전화번호"
                            name="phoneNumber"
                            margin="normal"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSX}
                            InputLabelProps={{sx: labelNoWrap}}
                        />
                        <Button
                            className="login-button"
                            fullWidth
                            variant="contained"
                            sx={{mt: 2, mb: 1, height: 56}}
                            onClick={handleSubmit}
                        >
                            임시 비밀번호 발급
                        </Button>
                        <Box className="form-links">
                            <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
                        </Box>
                    </Box>
                </Box>);

            default:
                return null;
        }
    };

    return (<section>
        {renderForm()}
        {isTermsModalOpen && (<TermsModal
            content={termsContent}
            onClose={() => {
                setIsTermsModalOpen(false);
                setTermsViewed(true);
            }}
            onConfirm={() => {
                setIsTermsModalOpen(false);
                setTermsViewed(true);
                setTermsAgreed(true);
            }}
        />)}
        {isPasswordModalOpen && (
            <TempPasswordModal password={tempPassword} onClose={() => setIsPasswordModalOpen(false)}/>)}
        {isIdModalOpen && (<IdFoundModal
            email={foundId}
            onClose={() => {
                setIsIdModalOpen(false);
                navigate("/login", {replace: true});
            }}
        />)}
        {/* Toast 컴포넌트 추가 */}
        <Toast message={toastState.message} show={toastState.show} type={toastState.type}/>
    </section>);
};

export default AuthSection;