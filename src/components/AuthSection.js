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
