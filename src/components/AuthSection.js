import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate, Link } from "react-router-dom";
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

import "../css/login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createRoot } from "react-dom/client";

const KAKAO_REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (typeof window !== "undefined" && !window.__WELCOME_TOAST_MOUNTED__) {
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
const TermsModal = ({ content, onClose, onConfirm }) => {
  return (
    <div className="modal-backdrop-2" onClick={onClose}>
      <div className="modal-content-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn-2">
          &times;
        </button>
        <h2>서비스 이용약관</h2>
        <div className="terms-text-content-2">
          {content.split("\n").map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("제")) {
              return (
                <h4 key={index} style={{ marginTop: "1.5em" }}>
                  {trimmedLine}
                </h4>
              );
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

const TempPasswordModal = ({ password, onClose }) => {
  return (
    <div className="modal-backdrop-3">
      <div className="modal-content-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn-3">
          &times;
        </button>
        <h2>임시 비밀번호 발급</h2>
        <p>아래의 임시 비밀번호로 로그인 후, 비밀번호를 변경해주세요.</p>
        <div className="temp-password-box">{password}</div>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ mt: 2, backgroundColor: "#a18cd1" }}
        >
          확인
        </Button>
      </div>
    </div>
  );
};

const IdFoundModal = ({ email, onClose }) => {
  return (
    <div className="modal-backdrop-3">
      <div className="modal-content-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn-3">
          &times;
        </button>
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

const AuthSection = ({
  type,
  setIsCustomLoggedIn,
  setCustomUser,
}) => {
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
    isAvailable: false,
    message: "",
  });

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [foundId, setFoundId] = useState("");
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);

  const navigate = useNavigate();
  const logoutExecuted = useRef(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.js";
    script.async = true;

    document.body.appendChild(script);

    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_REST_API_KEY);
        console.log("Kakao SDK initialized:", window.Kakao.isInitialized());
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const processSocialLogin = async (provider, code) => {
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/social-login`,
          {
            provider,
            code,
          },
          { withCredentials: true }
        );

        const { token, user } = response.data;
        localStorage.setItem("token", "LOGIN");

        if (setCustomUser) setCustomUser(user);
        if (setIsCustomLoggedIn) setIsCustomLoggedIn(true);

        const nickname = user?.nickname || "사용자";
        toast.success(`${nickname}님 환영합니다!`, {
          containerId: "welcome",
        });

        window.history.replaceState({}, "", "/login");
        navigate("/");
      } catch (err) {
        console.error(`${provider} login error:`, err);
        alert(
          err.response?.data?.message ||
          `${provider} 로그인 처리 중 오류가 발생했습니다.`
        );
        navigate("/login");
      }
    };

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = params.get("state");

    if (code && provider) {
      processSocialLogin(provider, code);
    }
  }, [navigate, setIsCustomLoggedIn, setCustomUser]);

  useEffect(() => {
    if (type === "logout" && !logoutExecuted.current) {
      logoutExecuted.current = true;


      if (setIsCustomLoggedIn) setIsCustomLoggedIn(false);
      if (setCustomUser) setCustomUser(null);

      // 서버에 로그아웃 API 호출 (선택 사항, 서버에서 쿠키 만료 처리)
      axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true })
        .catch(() => { /* 실패해도 상태 초기화는 계속 */ });

      // 전역 컨테이너(welcome)로 로그아웃 토스트 출력
      toast.info("로그아웃 되었습니다!", { containerId: "welcome" });
      navigate("/", { replace: true });
    }
  }, [type, navigate, setIsCustomLoggedIn, setCustomUser]);

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
      setEmailCheck({ isChecking: false, isAvailable: false, message: "" });
    }
  };

  const handleGenderChange = (event, newGender) => {
    if (newGender !== null) {
      setFormData((prev) => ({ ...prev, gender: newGender }));
    }
  };

  const validateField = (name, value, currentData) => {
    const newErrors = { ...errors };
    if (name === "password" || name === "passwordConfirm") {
      const { password, passwordConfirm } = currentData;
      if (passwordConfirm && password !== passwordConfirm) {
        newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
      } else {
        delete newErrors.passwordConfirm;
      }
    }
    if (name === "password") {
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(value)) {
        newErrors.password =
          "8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.";
      } else {
        delete newErrors.password;
      }
    }
    setErrors(newErrors);
  };

  const handleCheckEmail = async () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
      return;
    }
    setEmailCheck({ isChecking: true, isAvailable: false, message: "" });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/check-email`, {
        params: { email: formData.email },
        withCredentials: true
      });
      if (response.data.data.isAvailable) {
        setEmailCheck({
          isChecking: false,
          isAvailable: true,
          message: "사용 가능한 이메일입니다.",
        });
      } else {
        setEmailCheck({
          isChecking: false,
          isAvailable: false,
          message: "이미 사용 중인 이메일입니다.",
        });
      }
    } catch (err) {
      setEmailCheck({
        isChecking: false,
        isAvailable: false,
        message: "확인 중 오류가 발생했습니다.",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (type === "login") {
        const loginResponse = await axios.post(
          `${BACKEND_URL}/api/auth/login`,
          {
            email: formData.email,
            password: formData.password,
          },
          { withCredentials: true }
        );

        // 로그인 응답에서 사용자 정보 바로 가져오기
        const user = loginResponse.data.data.profile;
        console.log(user);

        if (setCustomUser) setCustomUser(user);
        if (setIsCustomLoggedIn) setIsCustomLoggedIn(true);
        console.log()

        // 환영 토스트
        const nickname = user?.nickname || "사용자";
        toast.success(`${nickname}님 환영합니다!`);

        navigate("/");
      } else if (type === "signup") {
        if (
          Object.keys(errors).length > 0 ||
          !emailCheck.isAvailable ||
          !formData.termsAgreed
        ) {
          let alertMessage = "입력 정보를 다시 확인해주세요.";
          if (!emailCheck.isAvailable) {
            alertMessage = "이메일 중복 확인을 완료해주세요.";
          } else if (!formData.termsAgreed) {
            alertMessage = "서비스 이용약관에 동의해야 합니다.";
          }
          alert(alertMessage);
          return;
        }
        await axios.post(`${BACKEND_URL}/api/users/register`, {
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          phoneNumber: formData.phoneNumber,
          mentalState: formData.mentalState,
          age: formData.age,
          gender: formData.gender,
        }, { withCredentials: true });

        alert("회원가입이 완료되었습니다. 로그인 해주세요.");
        navigate("/login");

      } else if (type === "find-id") {
        const response = await axios.post(`${BACKEND_URL}/api/auth/find-id`, {
          phoneNumber: formData.phoneNumber,
          nickname: formData.nickname,
        }, { withCredentials: true });

        if (response.data.data.email) {
          setFoundId(response.data.data.email);
          setIsIdModalOpen(true);
        } else {
          alert("해당 정보로 가입된 이메일을 찾을 수 없습니다.");
        }

      } else if (type === "find-password") {
        const response = await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        }, { withCredentials: true });

        if (response.data.data.tempPassword) {
          setTempPassword(response.data.data.tempPassword);
          setIsPasswordModalOpen(true);
        } else {
          alert("임시 비밀번호 발급에 실패했습니다.");
        }
      }
    } catch (err) {
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
    if (!KAKAO_REST_API_KEY) {
      alert("카카오 로그인 설정이 올바르지 않습니다.");
      return;
    }
    console.log(`KAKAO_REDIRECT_URI${KAKAO_REDIRECT_URI}`);
    window.Kakao.Auth.authorize({
      redirectUri: KAKAO_REDIRECT_URI,
      scope: "account_email,profile_nickname",
    });
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&state=kakao`;
    // window.location.href = authUrl;
  };

  const handleGoogleLogin = () => {
    // const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    // const REDIRECT_URI = "http://localhost:3000/login";
    // if (!GOOGLE_CLIENT_ID) {
    //   alert("구글 로그인 설정이 올바르지 않습니다.");
    //   return;
    // }
    // const scope = "openid profile email";
    // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&state=google`;
    window.location.href = BACKEND_URL + '/api/auth/social/google/login';
  };

  const termsContent = `
제1조 (목적)
본 약관은 마인드브릿지(이하 '회사')가 제공하는 AI 테라피 솔루션 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
1. '서비스'라 함은 회사가 제공하는 AI 상담, 감정 분석, 이미지 테라피 등 모든 서비스를 의미합니다.
2. '회원'이라 함은 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
3. 'AI 상담'이라 함은 인공지능 기술을 활용하여 사용자의 심리적 상태를 분석하고 조언을 제공하는 비대면 상담 서비스를 의미합니다.

제3조 (약관의 게시와 개정)
1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
2. 회사는 '약관의 규제에 관한 법률', '정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 '정보통신망법')' 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
3. 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다.

제4조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 업무를 수행합니다.
   - AI 기반 심리 상담 및 분석 서비스
   - 심리 치유를 위한 이미지 테라피 콘텐츠 제공
   - 기타 회사가 정하는 관련 업무
2. 본 서비스는 의료 행위가 아니며, 진단이나 처방을 제공하지 않습니다. 심각한 정신 건강 문제가 의심될 경우, 반드시 전문 의료기관과 상담하시기 바랍니다.

제5조 (회원의 의무)
1. 회원은 다음 행위를 하여서는 안 됩니다.
   - 신청 또는 변경 시 허위 내용의 등록
   - 타인의 정보 도용
   - 서비스의 정상적인 운영을 방해하는 행위
   - 법령 또는 공서양속에 위배되는 행위
2. 회원은 본 약관에서 규정하는 사항과 서비스 이용안내 또는 주의사항 등 회사가 공지하는 사항을 준수하여야 합니다.
`;

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
              <Link
                to="/"
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "80px",
                }}
              >
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
              >
                로그인
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
                      (emailCheck.message && !emailCheck.isAvailable)
                    }
                    helperText={errors.email || emailCheck.message}
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
                    {emailCheck.isChecking ? (
                      <CircularProgress size={24} />
                    ) : (
                      "중복확인"
                    )}
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
                    "& .MuiFormHelperText-root": {
                      backgroundColor: "transparent",
                    },
                  }}
                  helperText={
                    errors.password ||
                    "8자 이상, 영문, 숫자, 특수문자를 포함해주세요."
                  }
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
                  helperText={errors.passwordConfirm}
                  sx={{ backgroundColor: "#ffffffff" }}
                />
                <FormControl
                  component="fieldset"
                  margin="normal"
                  sx={{ flex: 2 }}
                >
                  <FormLabel
                    component="legend"
                    sx={{ mb: 1, fontSize: "0.8rem" }}
                  >
                    성별
                  </FormLabel>
                  <ToggleButtonGroup
                    value={formData.gender}
                    exclusive
                    onChange={handleGenderChange}
                    aria-label="gender selection"
                    fullWidth
                  >
                    <ToggleButton value="male" aria-label="male">
                      남성
                    </ToggleButton>
                    <ToggleButton value="female" aria-label="female">
                      여성
                    </ToggleButton>
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
                <FormControl
                  component="fieldset"
                  margin="normal"
                  error={!!errors.mentalState}
                >
                  <FormLabel component="legend">
                    내가 생각하는 나의 현재 상태
                  </FormLabel>
                  <RadioGroup
                    row
                    name="mentalState"
                    value={formData.mentalState}
                    onChange={handleChange}
                    className="radio-list"
                  >
                    {["우울증", "불안장애", "ADHD", "게임중독", "반항장애"].map(
                      (state) => (
                        <FormControlLabel
                          key={state}
                          value={state}
                          control={
                            <Radio
                              sx={{ "&.Mui-checked": { color: "#a18cd1" } }}
                            />
                          }
                          label={state}
                        />
                      )
                    )}
                  </RadioGroup>
                  {errors.mentalState && (
                    <FormHelperText>{errors.mentalState}</FormHelperText>
                  )}
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
                          sx={{
                            p: 0,
                            color: "#a18cd1",
                            textDecoration: "underline",
                          }}
                        >
                          {" "}
                          서비스 이용약관{" "}
                        </Button>{" "}
                        에 동의합니다.{" "}
                      </Typography>
                    }
                  />
                  {!termsViewed && (
                    <FormHelperText
                      sx={{ ml: "14px", color: "rgba(0, 0, 0, 0.6)" }}
                    >
                      {" "}
                      이용약관을 클릭하여 확인 후 동의해주세요.{" "}
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
              <Link
                to="/"
                style={{
                  display: "inline-block",
                  width: "50px",
                  height: "auto",
                }}
              >
                <img
                  src="/img/로고1.png"
                  alt="Mind Bridge 로고"
                  className="logo-login"
                />
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
                <RouterLink to="/login" className="form-link">
                  로그인으로 돌아가기
                </RouterLink>
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
              <Link
                to="/"
                style={{
                  display: "inline-block",
                  width: "50px",
                  height: "auto",
                }}
              >
                <img
                  src="/img/로고1.png"
                  alt="Mind Bridge 로고"
                  className="logo-login"
                />
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
                <RouterLink to="/login" className="form-link">
                  로그인으로 돌아가기
                </RouterLink>
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
            navigate("/login");
          }}
        />
      )}
    </section>
  );
};

export default AuthSection;
