import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Button, TextField, Checkbox, FormControlLabel, RadioGroup, Radio,
  FormControl, FormLabel, Box, Typography, CircularProgress, FormHelperText,
} from '@mui/material';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';

import '../css/login.css';

const BACKEND_URL = 'http://121.78.183.18:8080';

const AuthSection = ({ type }) => {
  const [formData, setFormData] = useState({
    email: '', password: '', nickname: '', phoneNumber: '',
    passwordConfirm: '', mentalState: '', termsAgreed: false,
  });
  const [errors, setErrors] = useState({});
  const [emailCheck, setEmailCheck] = useState({
    isChecking: false, isAvailable: false, message: '',
  });

  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Clerk 소셜 로그인 성공 시, 백엔드에 정보 저장 후 메인 페이지로 이동
    if (user) {
      axios.post(`${BACKEND_URL}/api/users/clerk-login`, {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.fullName || user.firstName || 'clerkUser',
      })
        .then(res => {
          console.log('Clerk user saved to DB:', res.data);
          navigate('/');
        })
        .catch(err => {
          console.error('Clerk user save error:', err);
          navigate('/');
        });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => {
      const newData = { ...prevData, [name]: type === 'checkbox' ? checked : value };
      validateField(name, value, newData);
      return newData;
    });
    if (name === 'email') {
      setEmailCheck({ isChecking: false, isAvailable: false, message: '' });
    }
  };

  const validateField = (name, value, currentData) => {
    const newErrors = { ...errors };
    if (name === 'password' || name === 'passwordConfirm') {
      const currentPassword = (name === 'password') ? value : currentData.password;
      const currentPasswordConfirm = (name === 'passwordConfirm') ? value : currentData.passwordConfirm;
      if (currentPasswordConfirm && currentPassword !== currentPasswordConfirm) {
        newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
      } else {
        delete newErrors.passwordConfirm;
      }
    }
    if (name === 'password') {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(value)) {
        newErrors.password = '8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.';
      } else {
        delete newErrors.password;
      }
    }
    setErrors(newErrors);
  };

  const handleCheckEmail = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
      return;
    }
    setEmailCheck({ isChecking: true, isAvailable: false, message: '' });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/check-email`, { email: formData.email });
      if (response.data.isAvailable) {
        setEmailCheck({ isChecking: false, isAvailable: true, message: '사용 가능한 이메일입니다.' });
      } else {
        setEmailCheck({ isChecking: false, isAvailable: false, message: '이미 사용 중인 이메일입니다.' });
      }
    } catch (err) {
      setEmailCheck({ isChecking: false, isAvailable: false, message: '확인 중 오류가 발생했습니다.' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (type === 'login') {
        const response = await axios.post(`${BACKEND_URL}/api/users/login`, {
          email: formData.email,
          password: formData.password,
        });
        alert('로그인 성공!');
        navigate('/'); // 로그인 성공 후 메인 페이지로 이동
      } else if (type === 'signup') {
        // 회원가입 전 최종 유효성 검사
        if (Object.keys(errors).length > 0 || !emailCheck.isAvailable || !formData.termsAgreed) {
          alert('입력 정보를 다시 확인해주세요.');
          return;
        }
        await axios.post(`${BACKEND_URL}/api/users/register`, {
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          phoneNumber: formData.phoneNumber,
          mentalState: formData.mentalState,
        });
        alert('회원가입이 완료되었습니다. 로그인 해주세요.');
        navigate('/login'); // 회원가입 성공 후 로그인 페이지로 이동
      } else if (type === 'find-id') {
        await axios.post(`${BACKEND_URL}/api/users/find-id`, { phoneNumber: formData.phoneNumber });
        alert('입력하신 번호로 가입된 이메일 정보를 전송했습니다.');
      } else if (type === 'find-password') {
        await axios.post(`${BACKEND_URL}/api/users/find-password`, { email: formData.email });
        alert('입력하신 이메일로 임시 비밀번호를 발급했습니다.');
      }
    } catch (err) {
      console.error(`${type} error:`, err);
      alert(err.response?.data?.message || '요청 처리 중 오류가 발생했습니다.');
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'login':
        return (
          <Box className="form-section">
            <Typography variant="h4" component="h1" gutterBottom>로그인</Typography>
            <TextField className="input-wrapper" fullWidth label="이메일" name="email" margin="normal" value={formData.email} onChange={handleChange} />
            <TextField className="input-wrapper" fullWidth label="비밀번호" name="password" type="password" margin="normal" value={formData.password} onChange={handleChange} />
            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>로그인</Button>
            <Box className="social-buttons">
              <SignInButton mode="modal">
                <Button className="social-button" variant="contained">소셜 로그인</Button>
              </SignInButton>
            </Box>
            <Box className="form-links">
              <RouterLink to="/signup" className="form-link">회원가입</RouterLink>
              <RouterLink to="/find-id" className="form-link">아이디 찾기</RouterLink>
              <RouterLink to="/find-password" className="form-link">비밀번호 찾기</RouterLink>
            </Box>
          </Box>
        );

      case 'signup':
        return (
          <Box component="form" noValidate className="form-section-flex">
            <Box className="form-left">
              <Typography variant="h5" component="h2" gutterBottom>회원가입</Typography>
              <TextField className="input-wrapper" margin="normal" required fullWidth label="닉네임" name="nickname" value={formData.nickname} onChange={handleChange} error={!!errors.nickname} helperText={errors.nickname} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TextField className="input-wrapper" margin="dense" required fullWidth label="이메일 (아이디)" name="email" value={formData.email} onChange={handleChange} error={!!errors.email || (emailCheck.message && !emailCheck.isAvailable)} helperText={errors.email || emailCheck.message} sx={{ '& .MuiFormHelperText-root': { color: emailCheck.isAvailable ? 'green' : undefined } }} />
                <Button className="auth-button" variant="outlined" onClick={handleCheckEmail} disabled={emailCheck.isChecking} sx={{ mt: '9px', height: '40px', flexShrink: 0 }}>
                  {emailCheck.isChecking ? <CircularProgress size={24} /> : '중복확인'}
                </Button>
              </Box>
              <TextField className="input-wrapper" margin="normal" fullWidth label="전화번호" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              <TextField className="input-wrapper" margin="normal" required fullWidth label="비밀번호" name="password" type="password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password || '8자 이상, 영문, 숫자, 특수문자를 포함해주세요.'} />
              <TextField className="input-wrapper" margin="normal" required fullWidth label="비밀번호 확인" name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleChange} error={!!errors.passwordConfirm} helperText={errors.passwordConfirm} />
              <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>가입하기</Button>
              <Box className="social-buttons">
                <SignUpButton mode="modal">
                  <Button className="social-button" variant="contained">소셜 회원가입</Button>
                </SignUpButton>
              </Box>
              <Box className="form-links">
                <RouterLink to="/login" className="form-link">이미 계정이 있으신가요? 로그인</RouterLink>
              </Box>
            </Box>
            <Box className="form-right-legend">
              <FormControl component="fieldset" margin="normal" error={!!errors.mentalState}>
                <FormLabel component="legend">내가 생각하는 나의 현재 상태</FormLabel>
                <RadioGroup row name="mentalState" value={formData.mentalState} onChange={handleChange} className="radio-list">
                  {['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'].map((state) => (
                    <FormControlLabel key={state} value={state} control={<Radio sx={{ '&.Mui-checked': { color: '#a18cd1' } }} />} label={state} />
                  ))}
                </RadioGroup>
                {errors.mentalState && <FormHelperText>{errors.mentalState}</FormHelperText>}
              </FormControl>
              <FormControlLabel control={<Checkbox name="termsAgreed" checked={formData.termsAgreed} onChange={handleChange} sx={{ '&.Mui-checked': { color: '#a18cd1' } }} />} label="서비스 이용약관에 동의합니다." />
              {errors.termsAgreed && <FormHelperText error sx={{ ml: '14px' }}>{errors.termsAgreed}</FormHelperText>}
            </Box>
          </Box>
        );

      case 'find-id':
        return (
          <Box className="form-section">
            <Typography variant="h4" component="h1" gutterBottom>아이디 찾기</Typography>
            <TextField className="input-wrapper" fullWidth label="전화번호" name="phoneNumber" margin="normal" value={formData.phoneNumber} onChange={handleChange} />
            <TextField className="input-wrapper" fullWidth label="이메일" name="email" margin="normal" value={formData.email} onChange={handleChange} />
            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>아이디 찾기</Button>
            <Box className="form-links">
              <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
            </Box>
          </Box>
        );

      case 'find-password':
        return (
          <Box className="form-section">
            <Typography variant="h4" component="h1" gutterBottom>비밀번호 찾기</Typography>
            <TextField className="input-wrapper" fullWidth label="이메일" name="email" margin="normal" value={formData.email} onChange={handleChange} />
            <TextField className="input-wrapper" fullWidth label="전화번호" name="phoneNumber" margin="normal" value={formData.phoneNumber} onChange={handleChange} />
            <Button className="login-button" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} onClick={handleSubmit}>임시 비밀번호 발급</Button>
            <Box className="form-links">
              <RouterLink to="/login" className="form-link">로그인으로 돌아가기</RouterLink>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return <section>{renderForm()}</section>;
};

export default AuthSection;