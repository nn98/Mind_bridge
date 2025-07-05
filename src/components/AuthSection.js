import React from 'react';
import { Link } from 'react-router-dom';

const AuthSection = ({
  type,
  sectionLabels,
  formInputs,
  buttonLabels,
  formLinks,
  signupState,
  setSignupState
}) => {
  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = encodeURIComponent('http://localhost:8080/auth/google/callback');
    const scope = encodeURIComponent('profile email');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = 'YOUR_KAKAO_REST_API_KEY';
    const redirectUri = encodeURIComponent('http://localhost:8080/auth/kakao/callback');
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <section className={`form-section${type === 'signup' ? ' form-section-flex' : ''}`}>
      <div className="form-left">
        <h2>{sectionLabels[type]}</h2>

        {formInputs[type].map((input, i) => (
          <input
            key={i}
            type={input.type}
            placeholder={input.placeholder}
            className="input"
          />
        ))}

        <button className="login-button">{buttonLabels[type]}</button>

        <div className="social-buttons">
          <button className="social-button google" onClick={handleGoogleLogin}>
            Google로 {type === 'signup' ? '가입' : '로그인'}
          </button>
          <button className="social-button kakao" onClick={handleKakaoLogin}>
            Kakao로 {type === 'signup' ? '가입' : '로그인'}
          </button>
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
