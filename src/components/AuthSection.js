import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
//
import React, { useState } from 'react';
import { signup, login } from '../api/authApi';


const AuthSection = ({
  type,
  sectionLabels,
  formInputs,
  buttonLabels,
  formLinks,
  signupState,
  setSignupState
}) => {
  //
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    tel: '',
    email: '',
    mentalState: '',
  });
  //
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('name:', name, 'value:', value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //
  const handleSubmit = async () => {
    try {
      if (type === 'signup') {

        console.log('보낼 데이터:', {
          ...formData,
          mentalState: signupState
        });

        await signup({
          user_id: formData.username,
          user_pw: formData.password,
          phone: formData.tel,
          mentalState: formData.mentalState,
        });

        alert('회원가입 성공!');
      } else {
        await login({
          user_id: formData.email,
          user_pw: formData.password,
        });
        alert('로그인 성공!');
      }
    } catch (err) {
      alert('에러 발생: ' + err.message);
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
