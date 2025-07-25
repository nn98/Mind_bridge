import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8080';  // 백엔드 주소 명시

const AuthSection = ({
  type,
  sectionLabels,
  formInputs,
  buttonLabels,
  formLinks,
  signupState,
  setSignupState
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    tel: '',
    email: '',
    mentalState: '',
  });

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      axios.post(`${BACKEND_URL}/api/users/clerk-login`, {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.firstName || user.fullName || 'clerkUser',
      })
      .then(res => {
        console.log('Clerk user saved to DB:', res.data);
      })
      .catch(err => {
        console.error('Clerk user save error:', err);
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (type === 'signup') {
        await axios.post(`${BACKEND_URL}/api/users/register`, {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          // 필요한 추가 데이터 포함 가능
        });
        alert('회원가입 성공!');
      } else {
        await axios.post(`${BACKEND_URL}/api/users/login`, {
          user_id: formData.email,
          user_pw: formData.password,
        });
        alert('로그인 성공!');
      }
    } catch (err) {
      alert('에러 발생: ' + (err.response?.data || err.message));
    }
  };

  return (
    <section className={`form-section${type === 'signup' ? ' form-section-flex' : ''}`}>
      <div className="form-left">
        <h2>{sectionLabels[type]}</h2>

        {formInputs[type].map((input, i) => (
          <input
            key={i}
            type={input.type}
            name={input.name}
            placeholder={input.placeholder}
            value={formData[input.name] || ''}
            onChange={handleChange}
            className="input"
          />
        ))}

        <button className="login-button" onClick={handleSubmit}>
          {buttonLabels[type]}
        </button>

        <div className="social-buttons">
          {type === 'login' ? (
            <SignInButton mode="modal">
              <button className="social-button">소셜 로그인</button>
            </SignInButton>
          ) : (
            <SignUpButton mode="modal">
              <button className="social-button">소셜 회원가입</button>
            </SignUpButton>
          )}
        </div>

        {formLinks[type] && (
          <div className="form-links">
            {formLinks[type].map(({ label, id }, i) => (
              <Link key={i} to={`/${id}`} className="form-link">
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {type === 'signup' && (
        <div className="form-right">
          <h3>내가 생각하는 나의 현재 상태</h3>
          <ul className="radio-list">
            {['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'].map((label, i) => (
              <li key={i}>
                <label>
                  <input
                    type="radio"
                    name="mentalState"
                    value={label}
                    checked={signupState === label}
                    onChange={(e) => setSignupState(e.target.value)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default AuthSection;
